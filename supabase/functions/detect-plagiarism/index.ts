import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

function normalizeCode(code: string): string {
  return code
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/#.*$/gm, "")
    .replace(/\s+/g, " ")
    .replace(/[a-zA-Z_]\w*/g, "VAR")
    .trim()
    .toLowerCase();
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

function nGrams(text: string, n: number): Set<string> {
  const words = text.split(/\s+/);
  const grams = new Set<string>();
  for (let i = 0; i <= words.length - n; i++) {
    grams.add(words.slice(i, i + n).join(" "));
  }
  return grams;
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  const intersection = new Set([...a].filter((x) => b.has(x)));
  const union = new Set([...a, ...b]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { exam_id } = await req.json();
    if (!exam_id) {
      return new Response(JSON.stringify({ error: "exam_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Get all submitted answers for this exam
    const { data: submissions } = await admin
      .from("exam_submissions")
      .select("id, student_id")
      .eq("exam_id", exam_id)
      .in("status", ["submitted", "graded"]);

    if (!submissions || submissions.length < 2) {
      return new Response(JSON.stringify({ message: "Not enough submissions to compare", records: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const submissionIds = submissions.map((s: any) => s.id);
    const studentMap = new Map(submissions.map((s: any) => [s.id, s.student_id]));

    const { data: answers } = await admin
      .from("student_answers")
      .select("submission_id, question_id, text_answer, code_answer")
      .in("submission_id", submissionIds);

    if (!answers || answers.length === 0) {
      return new Response(JSON.stringify({ message: "No answers found", records: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get question types
    const questionIds = [...new Set(answers.map((a: any) => a.question_id))];
    const { data: questions } = await admin
      .from("questions")
      .select("id, question_type")
      .in("id", questionIds);

    const questionTypeMap = new Map((questions || []).map((q: any) => [q.id, q.question_type]));

    // Group answers by question
    const byQuestion = new Map<string, { studentId: string; text: string; submissionId: string }[]>();
    for (const a of answers) {
      const qType = questionTypeMap.get(a.question_id);
      let content = "";
      if (qType === "coding" && a.code_answer) {
        content = a.code_answer;
      } else if (a.text_answer) {
        content = a.text_answer;
      }
      if (!content || content.trim().length < 20) continue;

      const arr = byQuestion.get(a.question_id) || [];
      arr.push({
        studentId: studentMap.get(a.submission_id) || "",
        text: content,
        submissionId: a.submission_id,
      });
      byQuestion.set(a.question_id, arr);
    }

    // Compare pairwise
    const records: any[] = [];
    const FLAG_THRESHOLD = 0.7;

    for (const [questionId, studentAnswers] of byQuestion.entries()) {
      if (studentAnswers.length < 2) continue;
      const qType = questionTypeMap.get(questionId);
      const isCoding = qType === "coding";

      for (let i = 0; i < studentAnswers.length; i++) {
        for (let j = i + 1; j < studentAnswers.length; j++) {
          const a = studentAnswers[i];
          const b = studentAnswers[j];

          let normA: string, normB: string;
          if (isCoding) {
            normA = normalizeCode(a.text);
            normB = normalizeCode(b.text);
          } else {
            normA = normalizeText(a.text);
            normB = normalizeText(b.text);
          }

          const similarity = jaccardSimilarity(nGrams(normA, 3), nGrams(normB, 3));
          
          if (similarity >= 0.3) {
            const flagged = similarity >= FLAG_THRESHOLD;
            
            // Insert for both students
            records.push({
              exam_id,
              student_id: a.studentId,
              question_id: questionId,
              matched_student_id: b.studentId,
              similarity_score: Math.round(similarity * 100),
              flagged,
              detection_method: isCoding ? "code_structure" : "text_similarity",
            });
            records.push({
              exam_id,
              student_id: b.studentId,
              question_id: questionId,
              matched_student_id: a.studentId,
              similarity_score: Math.round(similarity * 100),
              flagged,
              detection_method: isCoding ? "code_structure" : "text_similarity",
            });
          }
        }
      }
    }

    if (records.length > 0) {
      // Clear old records for this exam
      await admin.from("plagiarism_records").delete().eq("exam_id", exam_id);
      // Insert new
      await admin.from("plagiarism_records").insert(records);
    }

    return new Response(JSON.stringify({ message: "Plagiarism check complete", records: records.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
