import { useEffect, useRef } from "react";
import { StreamRelaySender, createRelayTransport } from "@/lib/streamRelay";

export function useStreamRelaySender(stream: MediaStream | null, enabled: boolean, relayToken?: string | null) {
  const senderRef = useRef<StreamRelaySender | null>(null);

  useEffect(() => {
    if (!enabled || !stream) {
      senderRef.current?.stop();
      senderRef.current = null;
      return;
    }

    const transport = createRelayTransport(relayToken ?? undefined);
    if (!transport) {
      senderRef.current?.stop();
      senderRef.current = null;
      return;
    }

    const sender = new StreamRelaySender();
    senderRef.current = sender;
    sender.start(stream, transport);

    return () => {
      sender.stop();
      senderRef.current = null;
    };
  }, [stream, enabled, relayToken]);
}
