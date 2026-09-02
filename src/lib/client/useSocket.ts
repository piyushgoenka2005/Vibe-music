"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface UseSocketOptions {
  /** Enable/disable connection (default: true) */
  enabled?: boolean;
  /** Events to listen for */
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

interface UseSocketReturn {
  /** Whether the socket is connected */
  connected: boolean;
  /** Send an event to the server */
  emit: (event: string, ...args: unknown[]) => void;
  /** Subscribe to an event */
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  /** Unsubscribe from an event */
  off: (event: string, callback: (...args: unknown[]) => void) => void;
}

/**
 * React hook for Socket.io connection.
 *
 * Usage:
 * ```tsx
 * const { connected, on, off } = useSocket();
 *
 * useEffect(() => {
 *   const handler = (data) => setOrderStatus(data.status);
 *   on("order:update", handler);
 *   return () => off("order:update", handler);
 * }, [on, off]);
 * ```
 */
export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const { enabled = true } = options;
  const socketRef = useRef<ReturnType<typeof import("socket.io-client").io> | null>(null);
  const [connected, setConnected] = useState(false);
  const callbacksRef = useRef<Map<string, Set<(...args: unknown[]) => void>>>(new Map());

  useEffect(() => {
    if (!enabled) return;

    // Dynamic import to avoid SSR issues
    let mounted = true;

    import("socket.io-client").then(({ io }) => {
      if (!mounted) return;

      const socket = io({
        path: "/api/socketio",
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });

      socket.on("connect", () => {
        if (mounted) setConnected(true);
        options.onConnect?.();
      });

      socket.on("disconnect", () => {
        if (mounted) setConnected(false);
        options.onDisconnect?.();
      });

      socket.on("connect_error", (error) => {
        options.onError?.(error);
      });

      // Re-register any events that were added before connection
      for (const [event, handlers] of callbacksRef.current) {
        for (const handler of handlers) {
          socket.on(event, handler);
        }
      }

      socketRef.current = socket;
    });

    return () => {
      mounted = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const emit = useCallback((event: string, ...args: unknown[]) => {
    socketRef.current?.emit(event, ...args);
  }, []);

  const on = useCallback((event: string, callback: (...args: unknown[]) => void) => {
    // Track callbacks for re-registration on reconnect
    if (!callbacksRef.current.has(event)) {
      callbacksRef.current.set(event, new Set());
    }
    callbacksRef.current.get(event)!.add(callback);

    // Register on socket if connected
    socketRef.current?.on(event, callback);
  }, []);

  const off = useCallback((event: string, callback: (...args: unknown[]) => void) => {
    callbacksRef.current.get(event)?.delete(callback);
    socketRef.current?.off(event, callback);
  }, []);

  return { connected, emit, on, off };
}
