import type { RelaySignalMessage } from "@/types/desktop";

const ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

export function sendRelaySignal(message: RelaySignalMessage): void {
  window.morphixDesktop?.sendRelaySignal(message);
}

export function isDesktopApp(): boolean {
  return !!window.morphixDesktop?.isDesktop;
}

export class StreamRelaySender {
  private pc: RTCPeerConnection | null = null;
  private unsub: (() => void) | null = null;

  start(stream: MediaStream): void {
    this.stop();

    const track = stream.getVideoTracks()[0];
    if (!track) {
      throw new Error("Swap stream has no video track");
    }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.pc = pc;
    pc.addTrack(track, stream);

    pc.onicecandidate = (event) => {
      sendRelaySignal({ type: "ice", candidate: event.candidate?.toJSON() ?? null });
    };

    this.unsub = window.morphixDesktop!.onRelaySignal((message) => {
      void this.handleSignal(message);
    });
  }

  private async handleSignal(message: RelaySignalMessage): Promise<void> {
    if (!this.pc) return;

    if (message.type === "ready") {
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
    if (!this.pc) return;
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    sendRelaySignal({ type: "offer", sdp: offer });
  }

  stop(): void {
    this.unsub?.();
    this.unsub = null;
    this.pc?.close();
    this.pc = null;
  }
}

export class StreamRelayReceiver {
  private pc: RTCPeerConnection | null = null;
  private unsub: (() => void) | null = null;

  start(onStream: (stream: MediaStream) => void): void {
    this.stop();

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.pc = pc;

    pc.ontrack = (event) => {
      if (event.streams[0]) {
        onStream(event.streams[0]);
      }
    };

    pc.onicecandidate = (event) => {
      sendRelaySignal({ type: "ice", candidate: event.candidate?.toJSON() ?? null });
    };

    this.unsub = window.morphixDesktop!.onRelaySignal((message) => {
      void this.handleSignal(message);
    });

    sendRelaySignal({ type: "ready" });
  }

  private async handleSignal(message: RelaySignalMessage): Promise<void> {
    if (!this.pc) return;

    if (message.type === "offer") {
      await this.pc.setRemoteDescription(message.sdp);
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);
      sendRelaySignal({ type: "answer", sdp: answer });
      return;
    }

    if (message.type === "ice" && message.candidate) {
      await this.pc.addIceCandidate(message.candidate);
    }
  }

  stop(): void {
    this.unsub?.();
    this.unsub = null;
    this.pc?.close();
    this.pc = null;
  }
}
