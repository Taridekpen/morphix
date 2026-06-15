export interface MediaAcquireOptions {
  video?: boolean;
  audio?: boolean;
  videoDeviceId?: string;
  audioDeviceId?: string;
}

export class MediaManager {
  private stream: MediaStream | null = null;
  private videoDeviceId: string | undefined;
  private audioDeviceId: string | undefined;

  async acquire(options: MediaAcquireOptions = { video: true, audio: true }): Promise<MediaStream> {
    const { video = true, audio = true, videoDeviceId, audioDeviceId } = options;
    this.videoDeviceId = videoDeviceId;
    this.audioDeviceId = audioDeviceId;

    if (this.stream) {
      this.teardown();
    }

    const constraints: MediaStreamConstraints = {
      video: video
        ? videoDeviceId
          ? { deviceId: { exact: videoDeviceId } }
          : true
        : false,
      audio: audio
        ? audioDeviceId
          ? { deviceId: { exact: audioDeviceId } }
          : true
        : false,
    };

    this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    return this.stream;
  }

  getStream(): MediaStream | null {
    return this.stream;
  }

  getVideoTrack(): MediaStreamTrack | null {
    return this.stream?.getVideoTracks()[0] ?? null;
  }

  getAudioTrack(): MediaStreamTrack | null {
    return this.stream?.getAudioTracks()[0] ?? null;
  }

  getVideoStream(): MediaStream | null {
    const track = this.getVideoTrack();
    return track ? new MediaStream([track]) : null;
  }

  getAudioStream(): MediaStream | null {
    const track = this.getAudioTrack();
    return track ? new MediaStream([track]) : null;
  }

  async enumerateDevices(): Promise<MediaDeviceInfo[]> {
    return navigator.mediaDevices.enumerateDevices();
  }

  async setInputDevice(kind: "audioinput" | "videoinput", deviceId: string): Promise<void> {
    if (kind === "audioinput") {
      this.audioDeviceId = deviceId;
    } else {
      this.videoDeviceId = deviceId;
    }

    if (!this.stream) return;

    const hasVideo = !!this.getVideoTrack();
    const hasAudio = !!this.getAudioTrack();
    await this.acquire({
      video: hasVideo,
      audio: hasAudio,
      videoDeviceId: this.videoDeviceId,
      audioDeviceId: this.audioDeviceId,
    });
  }

  teardown(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }
}
