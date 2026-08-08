import { supabase } from "@/integrations/supabase/client";

export type SecurityEventType =
  | "EXAM_STARTED"
  | "EXAM_RESUMED"
  | "TAB_SWITCH"
  | "WINDOW_BLUR"
  | "FULLSCREEN_EXIT"
  | "FULLSCREEN_RESTORED"
  | "COPY_ATTEMPT"
  | "PASTE_ATTEMPT"
  | "CUT_ATTEMPT"
  | "RIGHT_CLICK"
  | "PRINT_ATTEMPT"
  | "CAMERA_INTERRUPTED"
  | "CAMERA_RESTORED"
  | "MICROPHONE_INTERRUPTED"
  | "FACE_NOT_DETECTED"
  | "MULTIPLE_FACE_DETECTED"
  | "NETWORK_INTERRUPTION"
  | "NETWORK_RESTORED"
  | "PROCTORING_INTERRUPTION"
  | "EXAM_SUBMITTED"
  | "EXAM_AUTO_SUBMITTED";

export type Severity = "info" | "warning" | "critical";

export interface ExamSecuritySettings {
  fullscreen_required: boolean;
  tab_switch_detection: boolean;
  copy_paste_protection: boolean;
  right_click_protection: boolean;
  text_selection_protection: boolean;
  auto_submit_on_violation: boolean;
  max_violations: number;
  ai_proctoring: boolean;
  camera_required: boolean;
  microphone_required: boolean;
  allow_answer_review: boolean;
}

export const DEFAULT_SECURITY_SETTINGS: ExamSecuritySettings = {
  fullscreen_required: true,
  tab_switch_detection: true,
  copy_paste_protection: true,
  right_click_protection: true,
  text_selection_protection: true,
  auto_submit_on_violation: false,
  max_violations: 3,
  ai_proctoring: false,
  camera_required: false,
  microphone_required: false,
  allow_answer_review: true,
};

export function parseSecuritySettings(raw: unknown): ExamSecuritySettings {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_SECURITY_SETTINGS };
  return { ...DEFAULT_SECURITY_SETTINGS, ...(raw as Partial<ExamSecuritySettings>) };
}

/** Human-readable labels used in student warnings and the faculty timeline. */
export const EVENT_LABEL: Record<string, string> = {
  EXAM_STARTED: "Examination started",
  EXAM_RESUMED: "Examination resumed",
  TAB_SWITCH: "Tab / window switch detected",
  WINDOW_BLUR: "Examination window lost focus",
  FULLSCREEN_EXIT: "Fullscreen exited",
  FULLSCREEN_RESTORED: "Returned to fullscreen",
  COPY_ATTEMPT: "Copy attempt detected",
  PASTE_ATTEMPT: "Paste attempt detected",
  CUT_ATTEMPT: "Cut attempt detected",
  RIGHT_CLICK: "Context menu blocked",
  PRINT_ATTEMPT: "Print attempt blocked",
  CAMERA_INTERRUPTED: "Camera interrupted",
  CAMERA_RESTORED: "Camera restored",
  MICROPHONE_INTERRUPTED: "Microphone interrupted",
  FACE_NOT_DETECTED: "Face not detected",
  MULTIPLE_FACE_DETECTED: "Multiple people detected",
  NETWORK_INTERRUPTION: "Network interruption",
  NETWORK_RESTORED: "Network restored",
  PROCTORING_INTERRUPTION: "Proctoring interrupted",
  EXAM_SUBMITTED: "Examination submitted",
  EXAM_AUTO_SUBMITTED: "Examination auto-submitted",
};

/** Events that count towards the configured violation limit. */
export const VIOLATION_EVENTS: SecurityEventType[] = [
  "TAB_SWITCH",
  "FULLSCREEN_EXIT",
  "MULTIPLE_FACE_DETECTED",
];

interface LogArgs {
  examId: string;
  studentId: string;
  submissionId: string | null;
  type: SecurityEventType;
  severity?: Severity;
  metadata?: Record<string, unknown>;
}

/**
 * Persists a security event. Never throws — a failed log must not break an
 * in-progress examination.
 */
export async function logSecurityEvent({
  examId,
  studentId,
  submissionId,
  type,
  severity = "warning",
  metadata = {},
}: LogArgs): Promise<void> {
  if (!examId || !studentId) return;
  try {
    await supabase.from("security_events" as any).insert({
      exam_id: examId,
      student_id: studentId,
      submission_id: submissionId,
      event_type: type,
      severity,
      metadata,
    });
  } catch {
    /* offline or transient — the attempt continues */
  }
}