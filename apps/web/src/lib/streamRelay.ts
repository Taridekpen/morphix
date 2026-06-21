import type { RelaySignalMessage } from "@/types/desktop";
import { createBrowserRelayTransport, type RelayTransport } from "@/lib/browserRelay";
import { isDesktopApp, isLocalhost } from "@/lib/runtimeEnv";

const ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

export { isDesktopApp, isLocalhost, isBrowserObsSupported } from "@/lib/runtimeEnv";

export function createRelayTransport(token?: string): RelayTransport | null {
  if (isDesktopApp()) {
    return {
      send: (message: RelaySignalMessage) => window.morphixDesktop!.sendRelaySignal(message),
      onMessage: (callback) => window.morphixDesktop!.onRelaySignal(callback),
      dispose: () => undefined,
    };
  }

  if (token && isLocalhost()) {
    return createBrowserRelayTransport(token);
  }

  return null;
}

export class StreamRelaySender {
  private pc: RTCPeerConnection | null = null;
  private unsub: (() => void) | null = null;
  private transport: RelayTransport | null = null;
  private offerSent = false;

  start(stream: MediaStream, transport: RelayTransport): void {
    this.stop();
    this.offerSent = false;

    const track = stream.getVideoTracks()[0];
    if (!track) {
      throw new Error("Swap stream has no video track");
    }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.pc = pc;
    this.transport = transport;
    pc.addTrack(track, stream);

    pc.onicecandidate = (event) => {
      transport.send({ type: "ice", candidate: event.candidate?.toJSON() ?? null });
    };

    this.unsub = transport.onMessage((message) => {
      void this.handleSignal(message);
    });
  }

  private async handleSignal(message: RelaySignalMessage): Promise<void> {
    if (!this.pc || !this.transport) return;

    if (message.type === "ready") {
      if (this.offerSent) return;
      this.offerSent = true;
      await this.sendOffer();
      return;
    }

    if (message.type === "answer") {
      await this.pc.setRemoteDescription(message.sdp);
      return;
    }

    if (message.type === "ice" && message.candidate) {
      await this.pc.addIceCandidate(message.candidate);
    }
  }

  private async sendOffer(): Promise<void> {
    if (!this.pc || !this.transport) return;
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    this.transport.send({ type: "offer", sdp: offer });
  }

  stop(): void {
    this.unsub?.();
    this.unsub = null;
    this.pc?.close();
    this.pc = null;
    this.transport?.dispose();
    this.transport = null;
  }
}

export class StreamRelayReceiver {
  private pc: RTCPeerConnection | null = null;
  private unsub: (() => void) | null = null;
  private transport: RelayTransport | null = null;
  private readyTimer: number | null = null;

  start(onStream: (stream: MediaStream) => void, transport: RelayTransport): void {
    this.stop();

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.pc = pc;
    this.transport = transport;

    pc.ontrack = (event) => {
      if (event.streams[0]) {
        onStream(event.streams[0]);
      }
    };

    pc.onicecandidate = (event) => {
      transport.send({ type: "ice", candidate: event.candidate?.toJSON() ?? null });
    };

    this.unsub = transport.onMessage((message) => {
      void this.handleSignal(message);
    });

    const pingReady = () => transport.send({ type: "ready" });
    pingReady();
    this.readyTimer = window.setInterval(pingReady, 500);
  }

  private async handleSignal(message: RelaySignalMessage): Promise<void> {
    if (!this.pc || !this.transport) return;

    if (message.type === "offer") {
      if (this.readyTimer !== null) {
        window.clearInterval(this.readyTimer);
        this.readyTimer = null;
      }
      await this.pc.setRemoteDescription(message.sdp);
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);
      this.transport.send({ type: "answer", sdp: answer });
      return;
    }

    if (message.type === "ice" && message.candidate) {
      await this.pc.addIceCandidate(message.candidate);
    }
  }

  stop(): void {
    if (this.readyTimer !== null) {
      window.clearInterval(this.readyTimer);
      this.readyTimer = null;
    }
    this.unsub?.();
    this.unsub = null;
    this.pc?.close();
    this.pc = null;
    this.transport?.dispose();
    this.transport = null;
  }
}
