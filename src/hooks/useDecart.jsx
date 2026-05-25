import { useEffect, useRef, useState, useCallback } from "react";
import { createDecartClient, models } from "@decartai/sdk";

const client = createDecartClient({ apiKey: import.meta.env.VITE_DECART_API_KEY });

export const STATUS = {
  CONNECTING: "connecting",
  LIVE: "live",
  APPLYING: "applying",
  ERROR: "error",
  DENIED: "camera denied",
  IDLE: "idle",
};

export function useDecart() {
  const clientRef = useRef(null);
  const videoRef = useRef(null);
  const [status, setStatus] = useState(STATUS.CONNECTING);
  const [prompt, setPrompt] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [thumbUrl, setThumbUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      setStatus(STATUS.CONNECTING);
      const model = models.realtime("lucy-latest");
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch {
        if (!cancelled) setStatus(STATUS.DENIED);
        return;
      }
      try {
        clientRef.current = await client.realtime.connect(stream, {
          model,
          onRemoteStream: (remote) => {
            if (videoRef.current) videoRef.current.srcObject = remote;
            if (!cancelled) setStatus(STATUS.LIVE);
          },
          onError: (err) => {
            console.error(err);
            if (!cancelled) setStatus(STATUS.ERROR);
          },
          onDisconnect: () => {
            if (!cancelled) setStatus(STATUS.IDLE);
          },
        });
      } catch (err) {
        console.error(err);
        if (!cancelled) setStatus(STATUS.ERROR);
      }
    }
    start();
    return () => { cancelled = true; };
  }, []);

  const apply = useCallback(async (file = imageFile) => {
    if (!clientRef.current) return;
    setStatus(STATUS.APPLYING);
    try {
      await clientRef.current.set({
        prompt: prompt || "Transform into this character",
        image: file ?? null,
        enhance: true,
      });
      setStatus(STATUS.LIVE);
    } catch (err) {
      console.error(err);
      setStatus(STATUS.ERROR);
    }
  }, [prompt, imageFile]);

  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImageFile(file);
    setThumbUrl(URL.createObjectURL(file));
    await apply(file);
  }, [apply]);

  const clearImage = useCallback(async () => {
    setImageFile(null);
    setThumbUrl(null);
    if (clientRef.current) {
      await clientRef.current.set({ image: null, prompt: "" });
    }
  }, []);

  return { videoRef, status, prompt, setPrompt, imageFile, thumbUrl, apply, handleFile, clearImage };
}
