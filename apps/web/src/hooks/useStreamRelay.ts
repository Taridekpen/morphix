import { useEffect, useRef } from "react";
import { StreamRelaySender, isDesktopApp } from "@/lib/streamRelay";

export function useStreamRelaySender(stream: MediaStream | null, enabled: boolean) {
  const senderRef = useRef<StreamRelaySender | null>(null);

  useEffect(() => {
    if (!enabled || !stream || !isDesktopApp()) {
      senderRef.current?.stop();
      senderRef.current = null;
      return;
    }

    const sender = new StreamRelaySender();
    senderRef.current = sender;
    sender.start(stream);

    return () => {
      sender.stop();
      senderRef.current = null;
    };
  }, [stream, enabled]);
}
