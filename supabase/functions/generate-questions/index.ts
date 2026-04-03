import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const questionSchemas: Record<string, any> = {
  mcq: {
    type: "object",
    properties: {
      question_type: { type: "string", enum: ["mcq"] },
      question_text: { type: "string" },
      marks: { type: "number" },
      options: {
        type: "array",
        items: {
          type: "object",
          properties: { option_text: { type: "string" }, is_correct: { type: "boolean" } },
          required: ["option_text", "is_correct"],
          additionalProperties: false,
        },
      },
    },
    required: ["question_type", "question_text", "marks", "options"],
    additionalProperties: false,
  },
  short_answer: {
    type: "object",
    properties: {
      question_type: { type: "string", enum: ["short_answer"] },
      question_text: { type: "string" },
      marks: { type: "number" },
      expected_answer: { type: "string" },
      keywords: { type: "array", items: { type: "string" } },
    },
    required: ["question_type", "question_text", "marks", "expected_answer", "keywords"],
    additionalProperties: false,
  },
  long_answer: {
    type: "object",
    properties: {
      question_type: { type: "string", enum: ["long_answer"] },
      question_text: { type: "string" },
      marks: { type: "number" },
      expected_answer: { type: "string" },
      evaluation_criteria: { type: "string" },
    },
    required: ["question_type", "question_text", "marks", "expected_answer", "evaluation_criteria"],
    additionalProperties: false,
  },
  coding: {
    type: "object",
    properties: {
      question_type: { type: "string", enum: ["coding"] },
      question_text: { type: "string" },
      marks: { type: "number" },
      code_language: { type: "string" },
      code_template: { type: "string" },
      input_format: { type: "string" },
      output_format: { type: "string" },
      constraints_text: { type: "string" },
      test_cases: {
        type: "array",
        items: {
          type: "object",
          properties: {
            input: { type: "string" },
            expected_output: { type: "string" },
            is_hidden: { type: "boolean" },
          },
          required: ["input", "expected_output", "is_hidden"],
          additionalProperties: false,
        },
      },
    },
    required: ["question_type", "question_text", "marks", "code_language", "input_format", "output_format", "test_cases"],
    additionalProperties: false,
  },
  case_study: {
    type: "object",
    properties: {
      question_type: { type: "string", enum: ["case_study"] },
      scenario_text: { type: "string" },
      marks: { type: "number" },
      sub_questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            question_type: { type: "string", enum: ["mcq", "short_answer", "long_answer"] },
            question_text: { type: "string" },
            marks: { type: "number" },
            expected_answer: { type: "string" },
            options: {
              type: "array",
              items: {
                type: "object",
                properties: { option_text: { type: "string" }, is_correct: { type: "boolean" } },
                required: ["option_text", "is_correct"],
                additionalProperties: false,
              },
            },
          },
          required: ["question_type", "question_text", "marks"],
          additionalProperties: false,
        },
      },
    },
    required: ["question_type", "scenario_text", "marks", "sub_questions"],
    additionalProperties: false,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic, count = 5, difficulty = "medium", question_type = "mcq" } = await req.json();

    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Topic is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const typeSpecific: Record<string, string> = {
      mcq: "Each question must have exactly 4 options with exactly one correct answer.",
      short_answer: "Each question should have a concise expected answer (1-2 sentences) and 3-5 keywords for evaluation.",
      long_answer: "Each question should have a model answer (2-3 paragraphs) and clear evaluation criteria.",
      coding: "Each question should have: a clear problem statement, input/output format, constraints, starter code template, and 3-4 test cases (mix of visible and hidden).",
      case_study: "Each case study should have a realistic scenario (3-5 paragraphs) and 3-5 sub-questions mixing MCQ and short answer types.",
    };

    const systemPrompt = `You are an expert exam question generator. Generate ${question_type.replace("_", " ")} questions.

Rules:
- Generate exactly ${count} questions
- Difficulty level: ${difficulty}
- ${typeSpecific[question_type] || typeSpecific.mcq}
- Questions should test understanding, not just memorization
- Vary question styles`;

    const schema = questionSchemas[question_type] || questionSchemas.mcq;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate ${count} ${question_type.replace("_", " ")} questions about: ${topic.trim()}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_questions",
              description: "Return the generated questions",
              parameters: {
                type: "object",
                properties: {
                  questions: { type: "array", items: schema },
                },
                required: ["questions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_questions" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "AI did not return structured questions" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-questions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
