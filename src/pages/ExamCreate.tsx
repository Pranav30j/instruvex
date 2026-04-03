import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, ListChecks, AlignLeft, Code, BookOpen, Type, Plus } from "lucide-react";
import AIQuestionGenerator from "@/components/exam/AIQuestionGenerator";
import ExamStepBasicInfo, { ExamBasicInfo } from "@/components/exam/ExamStepBasicInfo";
import QuestionEditor, { QuestionDraft, QuestionType, newQuestion } from "@/components/exam/QuestionEditor";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { notifyStudentsOfExam } from "@/lib/notifications";

const MAX_QUESTIONS = 100;

const ExamCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const [basicInfo, setBasicInfo] = useState<ExamBasicInfo>({
    title: "",
    description: "",
    duration: 60,
    passingMarks: 0,
    shuffleQuestions: false,
    showResults: true,
    examType: "practice",
  });

  const [questions, setQuestions] = useState<QuestionDraft[]>([newQuestion()]);

  // Count all questions including sub-questions
  const countQuestions = (qs: QuestionDraft[]): number =>
    qs.reduce((sum, q) => sum + (q.question_type === "case_study" ? q.sub_questions.length : 1), 0);

  const questionCount = countQuestions(questions);
  const totalMarks = questions.reduce((sum, q) => {
    if (q.question_type === "case_study") return sum + q.sub_questions.reduce((s, sq) => s + sq.marks, 0);
    return sum + q.marks;
  }, 0);

  const updateQuestion = (idx: number, updates: Partial<QuestionDraft>) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...updates } : q)));
  };

  const addQuestion = (type: QuestionType) => {
    if (questionCount >= MAX_QUESTIONS) {
      toast({ title: `Maximum ${MAX_QUESTIONS} questions reached`, variant: "destructive" });
      return;
    }
    setQuestions((prev) => [...prev, newQuestion(type)]);
  };

  const removeQuestion = (idx: number) => setQuestions((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = async (status: "draft" | "published" = "draft") => {
    if (!basicInfo.title.trim()) { toast({ title: "Title required", variant: "destructive" }); return; }
    if (questions.some((q) => q.question_type !== "case_study" && !q.question_text.trim())) {
      toast({ title: "All questions need text", variant: "destructive" });
      return;
    }
    if (!user) return;
    setSaving(true);

    try {
      const { data: exam, error: examError } = await supabase
        .from("exams")
        .insert({
          title: basicInfo.title.trim(),
          description: basicInfo.description.trim() || null,
          created_by: user.id,
          duration_minutes: basicInfo.duration,
          total_marks: totalMarks,
          passing_marks: basicInfo.passingMarks,
          shuffle_questions: basicInfo.shuffleQuestions,
          show_results: basicInfo.showResults,
          status,
        })
        .select()
        .single();

      if (examError || !exam) {
        toast({ title: "Failed to create exam", description: examError?.message, variant: "destructive" });
        setSaving(false);
        return;
      }

      // Insert questions
      let orderIdx = 0;
      for (const q of questions) {
        if (q.question_type === "case_study") {
          // Insert parent case study
          const { data: parentQ } = await supabase
            .from("questions")
            .insert({
              exam_id: exam.id,
              question_type: "case_study" as any,
              question_text: q.scenario_text || "Case Study",
              marks: 0,
              order_index: orderIdx++,
              scenario_text: q.scenario_text,
            } as any)
            .select()
            .single();

          if (parentQ) {
            for (let si = 0; si < q.sub_questions.length; si++) {
              const sub = q.sub_questions[si];
              const { data: subQ } = await supabase
                .from("questions")
                .insert({
                  exam_id: exam.id,
                  question_type: sub.question_type as any,
                  question_text: sub.question_text.trim(),
                  marks: sub.marks,
                  order_index: orderIdx++,
                  parent_question_id: parentQ.id,
                  expected_answer: sub.expected_answer || null,
                  keywords: sub.keywords.length ? sub.keywords : null,
                } as any)
                .select()
                .single();

              if (subQ && sub.question_type === "mcq" && sub.options.length > 0) {
                await supabase.from("question_options").insert(
                  sub.options.map((o, j) => ({
                    question_id: subQ.id,
                    option_text: o.option_text.trim(),
                    is_correct: o.is_correct,
                    order_index: j,
                  }))
                );
              }
            }
          }
        } else {
          const { data: qData } = await supabase
            .from("questions")
            .insert({
              exam_id: exam.id,
              question_type: q.question_type as any,
              question_text: q.question_text.trim(),
              marks: q.marks,
              order_index: orderIdx++,
              code_template: q.question_type === "coding" ? q.code_template || null : null,
              code_language: q.question_type === "coding" ? q.code_language || null : null,
              expected_answer: ["short_answer", "long_answer"].includes(q.question_type) ? q.expected_answer || null : null,
              test_cases: q.question_type === "coding" ? q.test_cases.filter((t) => !t.is_hidden) : null,
              hidden_test_cases: q.question_type === "coding" ? q.test_cases.filter((t) => t.is_hidden) : null,
              input_format: q.question_type === "coding" ? q.input_format || null : null,
              output_format: q.question_type === "coding" ? q.output_format || null : null,
              constraints_text: q.question_type === "coding" ? q.constraints_text || null : null,
              evaluation_criteria: q.question_type === "long_answer" ? q.evaluation_criteria || null : null,
              keywords: q.question_type === "short_answer" && q.keywords.length ? q.keywords : null,
            })
            .select()
            .single();

          if (qData && q.question_type === "mcq" && q.options.length > 0) {
            await supabase.from("question_options").insert(
              q.options.map((o, j) => ({
                question_id: qData.id,
                option_text: o.option_text.trim(),
                is_correct: o.is_correct,
                order_index: j,
              }))
            );
          }
        }
      }

      toast({ title: `Exam ${status === "draft" ? "saved as draft" : "published"}!` });
      if (status === "published") notifyStudentsOfExam(exam.id, exam.title);
      navigate("/dashboard/exams");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/exams")}><ArrowLeft size={18} /></Button>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold text-foreground">Create Exam</h1>
            <p className="text-sm text-muted-foreground">
              {step === 1 ? "Step 1: Basic Information" : `Step 2: Questions (${questionCount}/${MAX_QUESTIONS}) • Total: ${totalMarks} marks`}
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium ${step === 1 ? "bg-steel text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            1. Basic Info
          </div>
          <ArrowRight size={16} className="text-muted-foreground" />
          <div className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium ${step === 2 ? "bg-steel text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            2. Questions
          </div>
        </div>

        {step === 1 && (
          <>
            <ExamStepBasicInfo info={basicInfo} onChange={(u) => setBasicInfo((prev) => ({ ...prev, ...u }))} />
            <div className="flex justify-end mt-6">
              <Button variant="hero" onClick={() => {
                if (!basicInfo.title.trim()) { toast({ title: "Enter a title first", variant: "destructive" }); return; }
                setStep(2);
              }}>
                Next: Add Questions <ArrowRight size={16} />
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            {/* Question counter bar */}
            <div className="rounded-lg border border-border bg-card-gradient p-3 mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Questions Added: <span className="text-steel">{questionCount}</span> / {MAX_QUESTIONS}
              </span>
              <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-steel rounded-full transition-all" style={{ width: `${(questionCount / MAX_QUESTIONS) * 100}%` }} />
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-4 mb-6">
              {questions.map((q, idx) => (
                <QuestionEditor
                  key={q.id}
                  question={q}
                  index={idx}
                  canDelete={questions.length > 1}
                  onUpdate={(updates) => updateQuestion(idx, updates)}
                  onRemove={() => removeQuestion(idx)}
                />
              ))}
            </div>

            {/* Add question buttons */}
            <div className="flex flex-wrap gap-2 mb-8">
              <Button variant="outline" size="sm" onClick={() => addQuestion("mcq")}><ListChecks size={16} /> MCQ</Button>
              <Button variant="outline" size="sm" onClick={() => addQuestion("short_answer")}><Type size={16} /> Short Answer</Button>
              <Button variant="outline" size="sm" onClick={() => addQuestion("long_answer")}><AlignLeft size={16} /> Long Answer</Button>
              <Button variant="outline" size="sm" onClick={() => addQuestion("coding")}><Code size={16} /> Coding</Button>
              <Button variant="outline" size="sm" onClick={() => addQuestion("case_study")}><BookOpen size={16} /> Case Study</Button>
              <AIQuestionGenerator
                onQuestionsGenerated={(generated) => {
                  const newQuestions: QuestionDraft[] = generated.map((g: any) => ({
                    id: crypto.randomUUID(),
                    question_type: g.question_type || "mcq",
                    question_text: g.question_text,
                    marks: g.marks || 1,
                    options: (g.options || []).map((o: any) => ({
                      id: crypto.randomUUID(),
                      option_text: o.option_text,
                      is_correct: o.is_correct || false,
                    })),
                    expected_answer: g.expected_answer || "",
                    code_template: g.code_template || "",
                    code_language: g.code_language || "python",
                    test_cases: (g.test_cases || []).map((t: any) => ({
                      id: crypto.randomUUID(),
                      input: t.input || "",
                      expected_output: t.expected_output || "",
                      is_hidden: t.is_hidden || false,
                    })),
                    input_format: g.input_format || "",
                    output_format: g.output_format || "",
                    constraints_text: g.constraints_text || "",
                    evaluation_criteria: g.evaluation_criteria || "",
                    keywords: g.keywords || [],
                    scenario_text: g.scenario_text || "",
                    sub_questions: (g.sub_questions || []).map((sq: any) => ({
                      id: crypto.randomUUID(),
                      question_type: sq.question_type || "short_answer",
                      question_text: sq.question_text || "",
                      marks: sq.marks || 1,
                      options: (sq.options || []).map((o: any) => ({ id: crypto.randomUUID(), option_text: o.option_text, is_correct: o.is_correct || false })),
                      expected_answer: sq.expected_answer || "",
                      code_template: "",
                      code_language: "python",
                      test_cases: [],
                      input_format: "",
                      output_format: "",
                      constraints_text: "",
                      evaluation_criteria: "",
                      keywords: [],
                      scenario_text: "",
                      sub_questions: [],
                    })),
                  }));
                  setQuestions((prev) => [...prev, ...newQuestions]);
                }}
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 border-t border-border pt-6">
              <Button variant="ghost" onClick={() => setStep(1)}>
                <ArrowLeft size={16} /> Back
              </Button>
              <div className="flex-1" />
              <Button variant="outline" size="lg" onClick={() => handleSave("draft")} disabled={saving}>
                Save as Draft
              </Button>
              <Button variant="hero" size="lg" onClick={() => handleSave("published")} disabled={saving}>
                {saving ? "Saving..." : "Publish Exam"}
              </Button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ExamCreate;
