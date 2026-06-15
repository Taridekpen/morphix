import { useCallback, useEffect, useRef, useState } from "react";
import { LiveSessionController } from "@morphix/media";
import type { SessionStatus, DecartModelId, DecartResolution } from "@morphix/shared";
import { FaceSessionService } from "@/services/FaceSessionService";
import type { SelectedReferenceFace } from "@/lib/faceSwap";

export function useLiveSession(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  beforeVideoRef: React.RefObject<HTMLVideoElement | null>
) {
  const controllerRef = useRef(new LiveSessionController());
  const faceRef = useRef<FaceSessionService | null>(null);
  const pendingReferenceRef = useRef<SelectedReferenceFace | null>(null);
  const faceOptionsRef = useRef({
    model: "lucy-latest" as DecartModelId,
    resolution: "720p" as DecartResolution,
    enhance: true,
  });

  const [faceStatus, setFaceStatus] = useState<SessionStatus>("idle");
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isSwapActive, setIsSwapActive] = useState(false);

  const [faceOptions, setFaceOptions] = useState(faceOptionsRef.current);

  useEffect(() => {
    faceOptionsRef.current = faceOptions;
  }, [faceOptions]);

  useEffect(() => {
    faceRef.current = new FaceSessionService(
      controllerRef.current.media,
      videoRef,
      beforeVideoRef
    );

    const unsubFace = faceRef.current.onStatus(setFaceStatus);

    controllerRef.current.setHandlers({
      onFaceStart: async () => {
        await faceRef.current?.connect(faceOptionsRef.current);
        const reference = pendingReferenceRef.current;
        if (reference) {
          await faceRef.current?.applyReference(reference, faceOptionsRef.current.enhance);
        }
      },
      onFaceStop: async () => {
        faceRef.current?.stopSwap();
      },
    });

    return () => {
      unsubFace();
      controllerRef.current.stopAll();
    };
  }, []);

  const bindCameraPreview = useCallback(() => {
    const stream = controllerRef.current.media.getVideoStream();
    if (beforeVideoRef.current && stream) {
      beforeVideoRef.current.srcObject = stream;
    }
  }, [beforeVideoRef]);

  const startCamera = useCallback(async () => {
    await controllerRef.current.startCamera({ video: true });
    bindCameraPreview();
    setIsCameraOn(true);
  }, [bindCameraPreview]);

  const stopCamera = useCallback(async () => {
    await controllerRef.current.stopCamera();
    if (beforeVideoRef.current) beforeVideoRef.current.srcObject = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraOn(false);
    setIsSwapActive(false);
  }, [beforeVideoRef, videoRef]);

  const startSwap = useCallback(async (reference: SelectedReferenceFace) => {
    pendingReferenceRef.current = reference;
    try {
      await controllerRef.current.startSwap();
      setIsSwapActive(true);
    } catch (err) {
      setIsSwapActive(false);
      throw err;
    }
  }, []);

  const stopSwap = useCallback(async () => {
    await controllerRef.current.stopSwap();
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsSwapActive(false);
  }, [videoRef]);

  const applyReference = useCallback(async (reference: SelectedReferenceFace) => {
    pendingReferenceRef.current = reference;
    if (!controllerRef.current.getIsSwapActive()) return;
    await faceRef.current?.applyReference(reference, faceOptionsRef.current.enhance);
  }, []);

  const reconnectFace = useCallback(async () => {
    const reference = pendingReferenceRef.current;
    if (!reference) {
      throw new Error("No reference face selected");
    }
    await controllerRef.current.stopSwap();
    setIsSwapActive(false);
    await startSwap(reference);
  }, [startSwap]);

  const getRemoteStream = useCallback(() => {
    return faceRef.current?.getRemoteStream() ?? null;
  }, []);

  return {
    controller: controllerRef.current,
    getRemoteStream,
    faceStatus,
    isCameraOn,
    isSwapActive,
    faceOptions,
    setFaceOptions,
    startCamera,
    stopCamera,
    startSwap,
    stopSwap,
    applyReference,
    reconnectFace,
    faceService: faceRef,
  };
}
