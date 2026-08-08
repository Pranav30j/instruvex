import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SecurityEventType } from "@/lib/exam-security";

interface Props {
  enabled: boolean;
  onEvent: (type: SecurityEventType, severity?: "info" | "warning" | "critical", metadata?: Record<string, unknown>) => void;
}

type FaceDetectorLike = { detect: (source: CanvasImageSource) => Promise<unknown[]> };

/**
 * Camera-based proctoring. Face checks use the browser's native FaceDetector
 * when the engine provides it; otherwise only camera interruptions are
 * monitored. No event is ever fabricated.
 */
const ProctoringMonitor = ({ enabled, onEvent }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [interrupted, setInterrupted] = useState(false);
  const [retry, setRetry] = useState(0);
  const lastFaceState = useRef<"ok" | "missing" | "multiple">("ok");

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let faceTimer: ReturnType<typeof setInterval> | undefined;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setInterrupted(false);

        stream.getVideoTracks().forEach((track) => {
          track.addEventListener("ended", () => {
            setInterrupted(true);
            onEvent("CAMERA_INTERRUPTED", "critical");
          });
          track.addEventListener("mute", () => {
            setInterrupted(true);
            onEvent("CAMERA_INTERRUPTED", "warning");
          });
        });

        const Detector = (window as unknown as { FaceDetector?: new (o?: unknown) => FaceDetectorLike }).FaceDetector;
        if (Detector) {
          const detector = new Detector({ fastMode: true });
          faceTimer = setInterval(async () => {
            if (!videoRef.current || videoRef.current.readyState < 2) return;
            try {
              const faces = await detector.detect(videoRef.current);
              const next = faces.length === 0 ? "missing" : faces.length > 1 ? "multiple" : "ok";
              if (next !== lastFaceState.current) {
                lastFaceState.current = next;
                if (next === "missing") onEvent("FACE_NOT_DETECTED", "warning");
                if (next === "multiple") onEvent("MULTIPLE_FACE_DETECTED", "critical", { faces: faces.length });
              }
            } catch {
              /* detection unavailable on this frame */
            }
          }, 6000);
        }
      } catch {
        setInterrupted(true);
        onEvent("PROCTORING_INTERRUPTION", "critical");
      }
    };

    void start();
    return () => {
      cancelled = true;
      if (faceTimer) clearInterval(faceTimer);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [enabled, retry, onEvent]);

  if (!enabled) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-40 overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <video ref={videoRef} muted playsInline className="h-28 w-full bg-black object-cover" />
      <div className="flex items-center gap-1.5 px-2 py-1.5 text-[10px]">
        {interrupted ? (
          <>
            <CameraOff size={11} className="text-destructive" />
            <span className="text-destructive">Proctoring interrupted</span>
          </>
        ) : (
          <>
            <Camera size={11} className="text-emerald-400" />
            <span className="text-muted-foreground">Proctoring active</span>
          </>
        )}
      </div>
      {interrupted && (
        <div className="border-t border-border p-2">
          <p className="mb-2 text-[10px] text-muted-foreground">
            Your camera connection has been interrupted. Please restore access to continue.
          </p>
          <Button size="sm" variant="outline" className="h-7 w-full text-[10px]" onClick={() => setRetry((r) => r + 1)}>
            <RefreshCw size={10} /> Retry camera
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProctoringMonitor;