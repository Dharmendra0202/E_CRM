import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { getToken } from "./api";

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace("/api/v1", "") || "http://localhost:5000";

interface AttendanceUpdate {
  batchId: string;
  timestamp: string;
  scheduleId?: string;
  classDate?: string;
  records: Array<{
    studentId: string;
    status: string;
    remarks?: string;
  }>;
  source?: "web" | "mobile" | "mobile_sync";
  markedBy?: string;
  markedById?: string;
}

interface UseAttendanceRealtimeOptions {
  batchId: string | null;
  enabled?: boolean;
  onUpdate?: (update: AttendanceUpdate) => void;
}

export function useAttendanceRealtime({ batchId, enabled = true, onUpdate }: UseAttendanceRealtimeOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<AttendanceUpdate | null>(null);
  /** Set when the handshake or a room join is rejected, so the UI can say why. */
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !batchId) return;

    // The server authenticates every socket handshake and checks that the caller
    // may join the requested batch room, so the access token must be supplied.
    const token = getToken();
    if (!token) {
      setIsConnected(false);
      setAuthError("Sign in to receive live attendance updates.");
      return;
    }
    setAuthError(null);

    // Create socket connection with better stability
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
      timeout: 10000,
      autoConnect: true,
      auth: { token },
    });

    socketRef.current = socket;

    let connectionStable = false;
    const stabilityTimer = setTimeout(() => {
      connectionStable = true;
    }, 1000); // Only mark as connected after 1 second of stability

    socket.on("connect", () => {
      console.log("✅ WebSocket connected:", socket.id);
      setTimeout(() => {
        if (connectionStable) setIsConnected(true);
      }, 500);
      
      // Join the batch room to receive updates
      socket.emit("join_batch", batchId);
      console.log(`📡 Joined batch room: batch_${batchId}`);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ WebSocket disconnected:", reason);
      if (connectionStable) setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("🔴 WebSocket connection error:", error);
      if (connectionStable) setIsConnected(false);
      // An "Unauthorized" handshake rejection is terminal — retrying with the
      // same bad/expired token will keep failing, so stop reconnect attempts.
      if (/unauthorized/i.test(error?.message || "")) {
        setAuthError(error.message);
        socket.disconnect();
      }
    });

    // The server refuses batch rooms the caller has no access to.
    socket.on("join_denied", (info: { batchId: string; message: string }) => {
      console.warn("🚫 Batch room join denied:", info);
      setAuthError(info?.message || "You do not have access to this batch.");
    });

    // Listen for attendance updates
    socket.on("attendance_updated", (update: AttendanceUpdate) => {
      console.log("🔔 Received attendance update:", update);
      setLastUpdate(update);
      
      // Call the callback if provided
      if (onUpdate) {
        onUpdate(update);
      }
    });

    // Cleanup on unmount or when batchId changes
    return () => {
      clearTimeout(stabilityTimer);
      if (socket) {
        socket.emit("leave_batch", batchId);
        socket.disconnect();
        console.log(`👋 Left batch room and disconnected: batch_${batchId}`);
      }
    };
  }, [batchId, enabled, onUpdate]);

  const sendMessage = (event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  };

  return {
    isConnected,
    lastUpdate,
    sendMessage,
    authError,
    socket: socketRef.current,
  };
}
