import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { createBrowserRelayTransport, validateRelayToken } from "@/lib/browserRelay";
import { StreamRelayReceiver, createRelayTransport, isDesktopApp, isLocalhost } from "@/lib/streamRelay";

export function ObsOutputPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const receiverRef = useRef<StreamRelayReceiver | null>(null);
  const [searchParams] = useSearchParams();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [hasStream, setHasStream] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get("token");

  useEffect(() => {
    if (isDesktopApp()) {
      if (!token) {
        setAuthorized(false);
        setError("Missing relay token.");
        return;
      }

      void window.morphixDesktop!.validateRelayToken(token).then((valid) => {
        setAuthorized(valid);
        if (!valid) {
          setError("Invalid or expired relay token.");
        }
      });
      return;
    }

    if (!isLocalhost()) {
      setAuthorized(false);
      setError("OBS output is only available on localhost.");
      return;
    }

    if (!token) {
      setAuthorized(false);
      setError("Missing relay token.");
      return;
    }

    const valid = validateRelayToken(token);
    setAuthorized(valid);
    if (!valid) {
      setError("Invalid or expired relay token. Start OBS Virtual Camera from Studio again.");
    }
  }, [token]);

  useEffect(() => {
    if (!authorized || !token) return;

    const transport = isDesktopApp() ? createRelayTransport() : createBrowserRelayTransport(token);
    if (!transport) return;

    const receiver = new StreamRelayReceiver();
    receiverRef.current = receiver;

    receiver.start((stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setHasStream(true);
      }
    }, transport);

    return () => {
      receiver.stop();
      receiverRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [authorized, token]);

  if (authorized === null) {
    return <OutputShell message="Connecting…" />;
  }

  if (!authorized) {
    return <OutputShell message={error ?? "Unauthorized"} />;
  }

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-contain ${hasStream ? "" : "hidden"}`}
      />
      {!hasStream && <OutputShell message="Waiting for swap stream…" />}
    </div>
  );
}

function OutputShell({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white px-6 text-center">
      <p className="text-lg font-medium">{message}</p>
      <p className="mt-2 text-sm text-white/60">Morphix Output — used by OBS Virtual Camera</p>
    </div>
  );
}
