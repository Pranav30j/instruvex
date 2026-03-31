import { supabase } from "@/integrations/supabase/client";

interface NotifyParams {
  userId: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
}

export async function sendNotification({ userId, title, message, type = "info", link }: NotifyParams) {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
    link: link || null,
  });
  if (error) console.error("Failed to send notification:", error);
}

export async function notifyStudentsOfAssignment(assignmentId: string, assignmentTitle: string) {
  // Notify all students about the new assignment
  const { data: studentRoles } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "student");

  if (!studentRoles?.length) return;

  const notifications = studentRoles.map((r) => ({
    user_id: r.user_id,
    title: "New Assignment",
    message: `A new assignment "${assignmentTitle}" has been posted.`,
    type: "assignment",
    link: `/dashboard/assignments/${assignmentId}`,
  }));

  const { error } = await supabase.from("notifications").insert(notifications);
  if (error) console.error("Failed to notify students:", error);
}

export async function notifyInstructorOfSubmission(
  instructorId: string,
  assignmentId: string,
  assignmentTitle: string,
  studentName: string
) {
  await sendNotification({
    userId: instructorId,
    title: "New Submission",
    message: `${studentName} submitted "${assignmentTitle}".`,
    type: "submission",
    link: `/dashboard/assignments/${assignmentId}`,
  });
}
