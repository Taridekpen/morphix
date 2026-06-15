import { useCallback, useRef, useState } from "react";

export function useRecording() {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = useCallback((stream: MediaStream | null) => {
    if (!stream) return;
    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";

    const recorder = new MediaRecorder(stream, { mimeType });
    recorderRef.current = recorder;
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.start(1000);
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        setIsRecording(false);
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        chunksRef.current = [];
        setIsRecording(false);
        resolve(blob);
      };
      recorder.stop();
    });
  }, []);

  const downloadRecording = useCallback(async (stream: MediaStream | null) => {
    if (isRecording) {
      const blob = await stopRecording();
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `morphix-recording-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } else {
      startRecording(stream);
    }
  }, [isRecording, startRecording, stopRecording]);

  return { isRecording, startRecording, stopRecording, downloadRecording };
}
