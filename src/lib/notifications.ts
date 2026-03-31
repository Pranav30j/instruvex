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

export async function notifyStudentsOfExam(examId: string, examTitle: string) {
  const { data: studentRoles } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "student");

  if (!studentRoles?.length) return;

  const notifications = studentRoles.map((r) => ({
    user_id: r.user_id,
    title: "New Exam Published",
    message: `A new exam "${examTitle}" is now available.`,
    type: "exam",
    link: `/dashboard/exams`,
  }));

  const { error } = await supabase.from("notifications").insert(notifications);
  if (error) console.error("Failed to notify students of exam:", error);
}

export async function notifyExamCreatorOfSubmission(
  creatorId: string,
  examTitle: string,
  studentName: string
) {
  await sendNotification({
    userId: creatorId,
    title: "Exam Submitted",
    message: `${studentName} completed "${examTitle}".`,
    type: "exam_submission",
    link: `/dashboard/exams`,
  });
}

export async function notifyQuizCompletion(
  userId: string,
  quizTitle: string,
  passed: boolean,
  score: number,
  total: number
) {
  await sendNotification({
    userId,
    title: passed ? "Quiz Passed! 🎉" : "Quiz Completed",
    message: `You scored ${score}/${total} on "${quizTitle}".${passed ? " Great job!" : " Try again!"}`,
    type: "quiz",
    link: `/dashboard/academy`,
  });
}

export async function notifyStudentOfGrade(
  studentId: string,
  assignmentTitle: string,
  marks: number,
  assignmentId: string
) {
  await sendNotification({
    userId: studentId,
    title: "Assignment Graded",
    message: `Your submission for "${assignmentTitle}" received ${marks} marks.`,
    type: "grade",
    link: `/dashboard/assignments/${assignmentId}`,
  });
}
