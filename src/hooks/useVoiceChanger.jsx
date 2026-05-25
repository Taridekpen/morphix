import { useState, useRef, useCallback, useEffect } from "react";

const CHUNK_MS = 2500;

export const VOICE_STATUS = {
  IDLE: "idle",
  LIVE: "live",
  CONVERTING: "converting",
  ERROR: "error",
};

export function useVoiceChanger() {
  const [voiceStatus, setVoiceStatus] = useState(VOICE_STATUS.IDLE);
  const [isVoiceLive, setIsVoiceLive] = useState(false);
  const [volume, setVolume] = useState(0);
  const [latency, setLatency] = useState(null);
  const [chunkCount, setChunkCount] = useState(0);
  const [fishApiKey, setFishApiKey] = useState(import.meta.env.VITE_FISH_API_KEY || "");
  const [fishVoiceId, setFishVoiceId] = useState(import.meta.env.VITE_FISH_VOICE_ID || "");
  const [voiceError, setVoiceError] = useState("");

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const intervalRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const audioCtxRef = useRef(null);
  const outputDestRef = useRef(null);

  const drawVolume = useCallback(() => {
    if (!analyserRef.current) return;
    const data = new Uint8Array(analyserRef.current.fftSize);
    analyserRef.current.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    setVolume(Math.min(1, Math.sqrt(sum / data.length) * 6));
    animFrameRef.current = requestAnimationFrame(drawVolume);
  }, []);

  const processChunk = useCallback(async (blob) => {
    if (!fishApiKey || !fishVoiceId || blob.size < 1000) return;
    const start = Date.now();
    try {
      const fd = new FormData();
      fd.append("audio", blob, "chunk.webm");
      fd.append("reference_id", fishVoiceId);
      fd.append("format", "mp3");

      const res = await fetch("https://api.fish.audio/v1/voice-conversion", {
        method: "POST",
        headers: { Authorization: `Bearer ${fishApiKey}` },
        body: fd,
      });

      if (!res.ok) throw new Error(`Fish Audio: ${res.status}`);

      const audioData = await res.arrayBuffer();
      setLatency(Date.now() - start);
      setChunkCount((c) => c + 1);

      if (audioCtxRef.current && outputDestRef.current) {
        const decoded = await audioCtxRef.current.decodeAudioData(audioData);
        const source = audioCtxRef.current.createBufferSource();
        source.buffer = decoded;
        source.connect(outputDestRef.current);
        source.connect(audioCtxRef.current.destination);
        source.start();
      }
    } catch (err) {
      console.error("Voice chunk error:", err);
      setVoiceError(err.message);
    }
  }, [fishApiKey, fishVoiceId]);

  const startVoice = useCallback(async () => {
    if (!fishApiKey.trim() || !fishVoiceId.trim()) {
      setVoiceError("Enter your Fish Audio API key and Voice ID first.");
      return;
    }
    setVoiceError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      src.connect(analyser);

      outputDestRef.current = ctx.createMediaStreamDestination();

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data?.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start(CHUNK_MS);

      intervalRef.current = setInterval(() => {
        if (!chunksRef.current.length) return;
        const blob = new Blob(chunksRef.current, { type: "audio/webm;codecs=opus" });
        chunksRef.current = [];
        setVoiceStatus(VOICE_STATUS.CONVERTING);
        processChunk(blob).then(() => setVoiceStatus(VOICE_STATUS.LIVE));
      }, CHUNK_MS);

      drawVolume();
      setIsVoiceLive(true);
      setVoiceStatus(VOICE_STATUS.LIVE);
    } catch {
      setVoiceError("Mic access denied. Please allow microphone access.");
      setVoiceStatus(VOICE_STATUS.ERROR);
    }
  }, [fishApiKey, fishVoiceId, processChunk, drawVolume]);

  const stopVoice = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (audioCtxRef.current) audioCtxRef.current.close();
    chunksRef.current = [];
    setIsVoiceLive(false);
    setVoiceStatus(VOICE_STATUS.IDLE);
    setVolume(0);
    setChunkCount(0);
    setLatency(null);
  }, []);

  useEffect(() => () => stopVoice(), [stopVoice]);

  return {
    voiceStatus, isVoiceLive, volume, latency, chunkCount,
    fishApiKey, setFishApiKey, fishVoiceId, setFishVoiceId,
    voiceError, startVoice, stopVoice,
  };
}
