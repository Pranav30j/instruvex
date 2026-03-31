import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, GripVertical, Code, AlignLeft, ListChecks } from "lucide-react";
import AIQuestionGenerator from "@/components/exam/AIQuestionGenerator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { notifyStudentsOfExam } from "@/lib/notifications";

type QuestionType = "mcq" | "subjective" | "coding";

interface QuestionOption {
  id: string;
  option_text: string;
  is_correct: boolean;
}

interface QuestionDraft {
  id: string;
  question_type: QuestionType;
  question_text: string;
  marks: number;
  options: QuestionOption[];
  expected_answer: string;
  code_template: string;
  code_language: string;
}

const newOption = (): QuestionOption => ({ id: crypto.randomUUID(), option_text: "", is_correct: false });

const newQuestion = (type: QuestionType = "mcq"): QuestionDraft => ({
  id: crypto.randomUUID(),
  question_type: type,
  question_text: "",
  marks: 1,
  options: type === "mcq" ? [newOption(), newOption(), newOption(), newOption()] : [],
  expected_answer: "",
  code_template: "",
  code_language: "javascript",
});

const questionTypeIcon: Record<QuestionType, React.ReactNode> = {
  mcq: <ListChecks size={16} />,
  subjective: <AlignLeft size={16} />,
  coding: <Code size={16} />,
};

const ExamCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(60);
  const [passingMarks, setPassingMarks] = useState(0);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const [questions, setQuestions] = useState<QuestionDraft[]>([newQuestion()]);

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  const updateQuestion = (idx: number, updates: Partial<QuestionDraft>) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...updates } : q)));
  };

  const updateOption = (qIdx: number, oIdx: number, updates: Partial<QuestionOption>) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx ? { ...q, options: q.options.map((o, j) => (j === oIdx ? { ...o, ...updates } : o)) } : q
      )
    );
  };

  const setCorrectOption = (qIdx: number, oIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx ? { ...q, options: q.options.map((o, j) => ({ ...o, is_correct: j === oIdx })) } : q
      )
    );
  };

  const addQuestion = (type: QuestionType) => setQuestions((prev) => [...prev, newQuestion(type)]);
  const removeQuestion = (idx: number) => setQuestions((prev) => prev.filter((_, i) => i !== idx));
  const addOption = (qIdx: number) =>
    setQuestions((prev) => prev.map((q, i) => (i === qIdx ? { ...q, options: [...q.options, newOption()] } : q)));
  const removeOption = (qIdx: number, oIdx: number) =>
    setQuestions((prev) => prev.map((q, i) => (i === qIdx ? { ...q, options: q.options.filter((_, j) => j !== oIdx) } : q)));

  const handleSave = async (status: "draft" | "published" = "draft") => {
    if (!title.trim()) { toast({ title: "Title required", variant: "destructive" }); return; }
    if (questions.some((q) => !q.question_text.trim())) { toast({ title: "All questions need text", variant: "destructive" }); return; }
    if (!user) return;
    setSaving(true);

    const { data: exam, error: examError } = await supabase
      .from("exams")
      .insert({
        title: title.trim(),
        description: description.trim() || null,
        created_by: user.id,
        duration_minutes: duration,
        total_marks: totalMarks,
        passing_marks: passingMarks,
        shuffle_questions: shuffleQuestions,
        show_results: showResults,
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
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const { data: qData, error: qError } = await supabase
        .from("questions")
        .insert({
          exam_id: exam.id,
          question_type: q.question_type,
          question_text: q.question_text.trim(),
          marks: q.marks,
          order_index: i,
          code_template: q.question_type === "coding" ? q.code_template || null : null,
          code_language: q.question_type === "coding" ? q.code_language || null : null,
          expected_answer: q.question_type === "subjective" ? q.expected_answer || null : null,
        })
        .select()
        .single();

      if (qError || !qData) continue;

      if (q.question_type === "mcq" && q.options.length > 0) {
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

    toast({ title: `Exam ${status === "draft" ? "saved as draft" : "published"}!` });
    if (status === "published") {
      notifyStudentsOfExam(exam.id, exam.title);
    }
    navigate("/dashboard/exams");
    setSaving(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/exams")}><ArrowLeft size={18} /></Button>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Create Exam</h1>
            <p className="text-sm text-muted-foreground">Total marks: {totalMarks}</p>
          </div>
        </div>

        {/* Exam details */}
        <div className="rounded-xl border border-border bg-card-gradient p-6 shadow-card mb-6">
          <h2 className="font-display text-lg font-semibold text-foreground mb-4">Exam Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Midterm Data Structures" className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description..." className="mt-1" rows={3} />
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} min={1} className="mt-1" />
            </div>
            <div>
              <Label>Passing Marks</Label>
              <Input type="number" value={passingMarks} onChange={(e) => setPassingMarks(Number(e.target.value))} min={0} className="mt-1" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={shuffleQuestions} onCheckedChange={setShuffleQuestions} />
              <Label>Shuffle Questions</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={showResults} onCheckedChange={setShowResults} />
              <Label>Show Results to Students</Label>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4 mb-6">
          {questions.map((q, qIdx) => (
            <div key={q.id} className="rounded-xl border border-border bg-card-gradient p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <GripVertical size={16} className="text-muted-foreground" />
                  <span className="text-sm font-medium text-steel">Q{qIdx + 1}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground border border-border rounded px-2 py-0.5">
                    {questionTypeIcon[q.question_type]} {q.question_type.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Label className="text-xs">Marks:</Label>
                    <Input type="number" value={q.marks} onChange={(e) => updateQuestion(qIdx, { marks: Number(e.target.value) })} min={0} className="w-16 h-8 text-xs" />
                  </div>
                  {questions.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeQuestion(qIdx)}>
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              </div>

              <Textarea
                value={q.question_text}
                onChange={(e) => updateQuestion(qIdx, { question_text: e.target.value })}
                placeholder="Enter question text..."
                className="mb-4"
                rows={2}
              />

              {/* MCQ Options */}
              {q.question_type === "mcq" && (
                <div className="space-y-2">
                  {q.options.map((opt, oIdx) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <button
                        onClick={() => setCorrectOption(qIdx, oIdx)}
                        className={`h-5 w-5 shrink-0 rounded-full border-2 transition-colors ${
                          opt.is_correct ? "border-success bg-success" : "border-muted-foreground"
                        }`}
                      />
                      <Input
                        value={opt.option_text}
                        onChange={(e) => updateOption(qIdx, oIdx, { option_text: e.target.value })}
                        placeholder={`Option ${oIdx + 1}`}
                        className="flex-1"
                      />
                      {q.options.length > 2 && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeOption(qIdx, oIdx)}>
                          <Trash2 size={12} />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" onClick={() => addOption(qIdx)} className="text-xs">
                    <Plus size={14} /> Add Option
                  </Button>
                </div>
              )}

              {/* Subjective */}
              {q.question_type === "subjective" && (
                <div>
                  <Label className="text-xs text-muted-foreground">Expected Answer (for auto-grading reference)</Label>
                  <Textarea
                    value={q.expected_answer}
                    onChange={(e) => updateQuestion(qIdx, { expected_answer: e.target.value })}
                    placeholder="Model answer..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              )}

              {/* Coding */}
              {q.question_type === "coding" && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Language</Label>
                    <Select value={q.code_language} onValueChange={(v) => updateQuestion(qIdx, { code_language: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="javascript">JavaScript</SelectItem>
                        <SelectItem value="python">Python</SelectItem>
                        <SelectItem value="java">Java</SelectItem>
                        <SelectItem value="cpp">C++</SelectItem>
                        <SelectItem value="c">C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Code Template</Label>
                    <Textarea
                      value={q.code_template}
                      onChange={(e) => updateQuestion(qIdx, { code_template: e.target.value })}
                      placeholder="// Starter code for the student..."
                      className="mt-1 font-mono text-sm"
                      rows={5}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add question buttons */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Button variant="outline" onClick={() => addQuestion("mcq")}><ListChecks size={16} /> Add MCQ</Button>
          <Button variant="outline" onClick={() => addQuestion("subjective")}><AlignLeft size={16} /> Add Subjective</Button>
          <Button variant="outline" onClick={() => addQuestion("coding")}><Code size={16} /> Add Coding</Button>
          <AIQuestionGenerator
            onQuestionsGenerated={(generated) => {
              const newQuestions = generated.map((g) => ({
                id: crypto.randomUUID(),
                question_type: "mcq" as QuestionType,
                question_text: g.question_text,
                marks: g.marks || 1,
                options: g.options.map((o) => ({
                  id: crypto.randomUUID(),
                  option_text: o.option_text,
                  is_correct: o.is_correct,
                })),
                expected_answer: "",
                code_template: "",
                code_language: "javascript",
              }));
              setQuestions((prev) => [...prev, ...newQuestions]);
            }}
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 border-t border-border pt-6">
          <Button variant="hero" size="lg" onClick={() => handleSave("published")} disabled={saving}>
            {saving ? "Saving..." : "Publish Exam"}
          </Button>
          <Button variant="outline" size="lg" onClick={() => handleSave("draft")} disabled={saving}>
            Save as Draft
          </Button>
          <Button variant="ghost" size="lg" onClick={() => navigate("/dashboard/exams")}>Cancel</Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ExamCreate;
