import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.97.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request
    const { submission_id } = await req.json();
    if (!submission_id || typeof submission_id !== "string") {
      return new Response(JSON.stringify({ error: "submission_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create user client to verify identity
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to access is_correct
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Verify submission belongs to user
    const { data: submission, error: subErr } = await adminClient
      .from("exam_submissions")
      .select("*, exams(*)")
      .eq("id", submission_id)
      .single();

    if (subErr || !submission) {
      return new Response(JSON.stringify({ error: "Submission not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (submission.student_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get student answers
    const { data: studentAnswers } = await adminClient
      .from("student_answers")
      .select("*")
      .eq("submission_id", submission_id);

    // Get questions with correct options
    const { data: questions } = await adminClient
      .from("questions")
      .select("*, question_options(*)")
      .eq("exam_id", submission.exam_id);

    // Grade MCQs
    let totalScore = 0;
    for (const q of (questions || [])) {
      if (q.question_type === "mcq") {
        const studentAns = (studentAnswers || []).find((a: any) => a.question_id === q.id);
        if (studentAns?.selected_option_id) {
          const correctOpt = (q.question_options || []).find((o: any) => o.is_correct);
          if (correctOpt && correctOpt.id === studentAns.selected_option_id) {
            totalScore += q.marks;
          }
        }
      }
    }

    // Update submission
    await adminClient.from("exam_submissions").update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
      total_score: totalScore,
    }).eq("id", submission_id);

    return new Response(JSON.stringify({ score: totalScore }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
