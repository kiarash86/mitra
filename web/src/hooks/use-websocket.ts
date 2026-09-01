import { useEffect, useRef, useCallback, useState } from "react";
import { useAuthStore } from "../stores/auth";

interface UseWebSocketOptions {
  url: string;
  onMessage?: (data: unknown) => void;
  onOpen?: () => void;
  onClose?: () => void;
  reconnectInterval?: number;
}

export function useWebSocket({
  url,
  onMessage,
  onOpen,
  onClose,
  reconnectInterval = 3000,
}: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Holds the latest `connect` so the reconnect callback below never closes
  // over a stale/self-referencing binding.
  const connectRef = useRef<() => void>(() => {});
  const [status, setStatus] = useState<"connecting" | "open" | "closed">("closed");

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const token = useAuthStore.getState().accessToken;
    const wsUrl = token ? `${url}?token=${token}` : url;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    setStatus("connecting");

    ws.onopen = () => {
      setStatus("open");
      onOpen?.();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage?.(data);
      } catch {
        // non-json message
      }
    };

    ws.onclose = () => {
      setStatus("closed");
      onClose?.();
      reconnectTimer.current = setTimeout(() => connectRef.current(), reconnectInterval);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [url, onMessage, onOpen, onClose, reconnectInterval]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const disconnect = useCallback(() => {
    clearTimeout(reconnectTimer.current);
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, []);

  return { connect, disconnect, send, status };
}
