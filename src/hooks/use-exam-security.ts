import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ExamSecuritySettings,
  SecurityEventType,
  logSecurityEvent,
  VIOLATION_EVENTS,
} from "@/lib/exam-security";

interface Args {
  examId: string;
  studentId: string;
  submissionId: string | null;
  settings: ExamSecuritySettings;
  enabled: boolean;
  /** Called when the configured violation limit is exceeded and auto-submit is on. */
  onViolationLimit: () => void;
}

export interface SecurityState {
  tabSwitches: number;
  fullscreenExits: number;
  copyAttempts: number;
  pasteAttempts: number;
  violations: number;
  isFullscreen: boolean;
  fullscreenWarning: boolean;
  online: boolean;
}

/**
 * Browser-side integrity monitoring for the secure examination portal.
 *
 * These are *detection* mechanisms — a browser cannot physically prevent a
 * student from leaving the page. Every detected event is persisted so faculty
 * can review it.
 */
export function useExamSecurity({
  examId,
  studentId,
  submissionId,
  settings,
  enabled,
  onViolationLimit,
}: Args) {
  const [state, setState] = useState<SecurityState>({
    tabSwitches: 0,
    fullscreenExits: 0,
    copyAttempts: 0,
    pasteAttempts: 0,
    violations: 0,
    isFullscreen: false,
    fullscreenWarning: false,
    online: typeof navigator === "undefined" ? true : navigator.onLine,
  });

  const counters = useRef({ tab: 0, fs: 0, copy: 0, paste: 0, violations: 0, warnings: 0 });
  const limitFired = useRef(false);
  const syncTimer = useRef<ReturnType<typeof setTimeout>>();
  const submissionRef = useRef(submissionId);
  submissionRef.current = submissionId;

  /** Mirror aggregate counters into proctoring_logs (kept for existing reports). */
  const syncCounters = useCallback(() => {
    if (!examId || !studentId) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      const c = counters.current;
      try {
        await supabase.from("proctoring_logs" as any).upsert(
          {
            exam_id: examId,
            student_id: studentId,
            submission_id: submissionRef.current,
            tab_switch_count: c.tab,
            fullscreen_exit_count: c.fs,
            copy_attempts: c.copy + c.paste,
            warnings_shown: c.warnings,
          },
          { onConflict: "exam_id,student_id" },
        );
      } catch {
        /* transient */
      }
    }, 1500);
  }, [examId, studentId]);

  const record = useCallback(
    (type: SecurityEventType, severity: "info" | "warning" | "critical" = "warning", metadata: Record<string, unknown> = {}) => {
      void logSecurityEvent({ examId, studentId, submissionId: submissionRef.current, type, severity, metadata });

      const c = counters.current;
      if (severity !== "info") c.warnings++;
      if (VIOLATION_EVENTS.includes(type)) c.violations++;

      setState((prev) => ({ ...prev, violations: c.violations }));
      syncCounters();

      if (
        settings.auto_submit_on_violation &&
        !limitFired.current &&
        c.violations >= Math.max(settings.max_violations, 1)
      ) {
        limitFired.current = true;
        onViolationLimit();
      }
    },
    [examId, studentId, settings.auto_submit_on_violation, settings.max_violations, onViolationLimit, syncCounters],
  );

  // ---- Tab switch / window blur -------------------------------------------
  useEffect(() => {
    if (!enabled || !settings.tab_switch_detection) return;
    const onVisibility = () => {
      if (!document.hidden) return;
      counters.current.tab++;
      setState((p) => ({ ...p, tabSwitches: counters.current.tab }));
      record("TAB_SWITCH", "warning", { count: counters.current.tab });
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [enabled, settings.tab_switch_detection, record]);

  // ---- Fullscreen ----------------------------------------------------------
  const requestFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen?.();
      setState((p) => ({ ...p, isFullscreen: true, fullscreenWarning: false }));
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!enabled || !settings.fullscreen_required) return;
    const onChange = () => {
      const active = !!document.fullscreenElement;
      if (active) {
        setState((p) => ({ ...p, isFullscreen: true, fullscreenWarning: false }));
        if (counters.current.fs > 0) record("FULLSCREEN_RESTORED", "info");
      } else {
        counters.current.fs++;
        setState((p) => ({
          ...p,
          isFullscreen: false,
          fullscreenWarning: true,
          fullscreenExits: counters.current.fs,
        }));
        record("FULLSCREEN_EXIT", "warning", { count: counters.current.fs });
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      if (document.fullscreenElement) void document.exitFullscreen?.().catch(() => {});
    };
  }, [enabled, settings.fullscreen_required, record]);

  // ---- Copy / paste / context menu ----------------------------------------
  useEffect(() => {
    if (!enabled) return;

    /** Code editors and answer fields opted out of clipboard blocking. */
    const isExempt = (target: EventTarget | null) =>
      target instanceof Element && !!target.closest("[data-clipboard-allowed='true']");

    const onClipboard = (e: Event) => {
      if (!settings.copy_paste_protection || isExempt(e.target)) return;
      e.preventDefault();
      if (e.type === "copy") {
        counters.current.copy++;
        setState((p) => ({ ...p, copyAttempts: counters.current.copy }));
        record("COPY_ATTEMPT");
      } else if (e.type === "paste") {
        counters.current.paste++;
        setState((p) => ({ ...p, pasteAttempts: counters.current.paste }));
        record("PASTE_ATTEMPT");
      } else {
        record("CUT_ATTEMPT");
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      if (!settings.right_click_protection || isExempt(e.target)) return;
      e.preventDefault();
      record("RIGHT_CLICK", "info");
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey;
      if (!meta) return;
      const key = e.key.toLowerCase();
      if (key === "p") {
        e.preventDefault();
        record("PRINT_ATTEMPT");
      }
      if (settings.copy_paste_protection && !isExempt(e.target) && ["c", "v", "x", "a"].includes(key)) {
        e.preventDefault();
      }
    };

    document.addEventListener("copy", onClipboard);
    document.addEventListener("paste", onClipboard);
    document.addEventListener("cut", onClipboard);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("copy", onClipboard);
      document.removeEventListener("paste", onClipboard);
      document.removeEventListener("cut", onClipboard);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [enabled, settings.copy_paste_protection, settings.right_click_protection, record]);

  // ---- Text selection ------------------------------------------------------
  useEffect(() => {
    if (!enabled || !settings.text_selection_protection) return;
    document.body.classList.add("exam-no-select");
    return () => document.body.classList.remove("exam-no-select");
  }, [enabled, settings.text_selection_protection]);

  // ---- Navigation guard ----------------------------------------------------
  useEffect(() => {
    if (!enabled) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [enabled]);

  // ---- Connectivity --------------------------------------------------------
  useEffect(() => {
    if (!enabled) return;
    const goOffline = () => setState((p) => ({ ...p, online: false }));
    const goOnline = () => {
      setState((p) => ({ ...p, online: true }));
      record("NETWORK_RESTORED", "info");
    };
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, [enabled, record]);

  return { ...state, record, requestFullscreen };
}