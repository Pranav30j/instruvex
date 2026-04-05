import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProctoringConfig {
  examId: string;
  studentId: string;
  submissionId: string | null;
  maxTabSwitches?: number;
  onAutoSubmit?: () => void;
  enabled?: boolean;
}

interface ProctoringState {
  tabSwitchCount: number;
  fullscreenExitCount: number;
  copyAttempts: number;
  warningsShown: number;
  isFullscreen: boolean;
}

export function useProctoring({
  examId,
  studentId,
  submissionId,
  maxTabSwitches = 3,
  onAutoSubmit,
  enabled = true,
}: ProctoringConfig) {
  const { toast } = useToast();
  const state = useRef<ProctoringState>({
    tabSwitchCount: 0,
    fullscreenExitCount: 0,
    copyAttempts: 0,
    warningsShown: 0,
    isFullscreen: false,
  });
  const [tabSwitches, setTabSwitches] = useState(0);
  const [fullscreenExits, setFullscreenExits] = useState(0);
  const logCreated = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  const syncToDb = useCallback(async () => {
    if (!examId || !studentId) return;
    const s = state.current;

    if (!logCreated.current) {
      await supabase.from("proctoring_logs" as any).upsert({
        exam_id: examId,
        student_id: studentId,
        submission_id: submissionId,
        tab_switch_count: s.tabSwitchCount,
        fullscreen_exit_count: s.fullscreenExitCount,
        copy_attempts: s.copyAttempts,
        warnings_shown: s.warningsShown,
      }, { onConflict: "exam_id,student_id" });
      logCreated.current = true;
    } else {
      await supabase
        .from("proctoring_logs" as any)
        .update({
          tab_switch_count: s.tabSwitchCount,
          fullscreen_exit_count: s.fullscreenExitCount,
          copy_attempts: s.copyAttempts,
          warnings_shown: s.warningsShown,
          submission_id: submissionId,
        })
        .eq("exam_id", examId)
        .eq("student_id", studentId);
    }
  }, [examId, studentId, submissionId]);

  const debouncedSync = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(syncToDb, 2000);
  }, [syncToDb]);

  // Tab switch detection
  useEffect(() => {
    if (!enabled) return;
    const handleVisibility = () => {
      if (document.hidden) {
        state.current.tabSwitchCount++;
        state.current.warningsShown++;
        setTabSwitches(state.current.tabSwitchCount);

        if (state.current.tabSwitchCount >= maxTabSwitches) {
          toast({
            title: "⚠️ Exam Auto-Submitted",
            description: `You exceeded the maximum allowed tab switches (${maxTabSwitches}).`,
            variant: "destructive",
          });
          syncToDb().then(() => {
            supabase.from("proctoring_logs" as any)
              .update({ auto_submitted: true })
              .eq("exam_id", examId)
              .eq("student_id", studentId)
              .then(() => onAutoSubmit?.());
          });
        } else {
          toast({
            title: "⚠️ Tab Switch Detected",
            description: `Warning ${state.current.tabSwitchCount}/${maxTabSwitches}. Further switches may auto-submit your exam.`,
            variant: "destructive",
          });
          debouncedSync();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [enabled, maxTabSwitches, examId, studentId, onAutoSubmit, toast, syncToDb, debouncedSync]);

  // Fullscreen management
  useEffect(() => {
    if (!enabled) return;

    const enterFullscreen = () => {
      document.documentElement.requestFullscreen?.().catch(() => {});
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        state.current.fullscreenExitCount++;
        state.current.warningsShown++;
        setFullscreenExits(state.current.fullscreenExitCount);
        toast({
          title: "⚠️ Fullscreen Required",
          description: "Please stay in fullscreen mode during the exam.",
          variant: "destructive",
        });
        debouncedSync();
        // Re-enter fullscreen after a short delay
        setTimeout(enterFullscreen, 1000);
      } else {
        state.current.isFullscreen = true;
      }
    };

    enterFullscreen();
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, [enabled, toast, debouncedSync]);

  // Copy-paste and right-click blocking
  useEffect(() => {
    if (!enabled) return;

    const blockEvent = (e: Event) => {
      e.preventDefault();
      state.current.copyAttempts++;
      state.current.warningsShown++;
      toast({
        title: "⚠️ Action Blocked",
        description: "Copy/paste is not allowed during exams.",
        variant: "destructive",
      });
      debouncedSync();
    };

    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "v" || e.key === "x")) {
        blockEvent(e);
      }
    };

    document.addEventListener("copy", blockEvent);
    document.addEventListener("paste", blockEvent);
    document.addEventListener("cut", blockEvent);
    document.addEventListener("contextmenu", blockEvent);
    document.addEventListener("keydown", handleKeydown);

    return () => {
      document.removeEventListener("copy", blockEvent);
      document.removeEventListener("paste", blockEvent);
      document.removeEventListener("cut", blockEvent);
      document.removeEventListener("contextmenu", blockEvent);
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [enabled, toast, debouncedSync]);

  // Initial log creation
  useEffect(() => {
    if (!enabled || !examId || !studentId) return;
    syncToDb();
  }, [enabled, examId, studentId, syncToDb]);

  return { tabSwitches, fullscreenExits, copyAttempts: state.current.copyAttempts };
}
