import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, HelpCircle, CheckCircle2, GraduationCap } from "lucide-react";

interface QuizManagerProps {
  moduleId: string;
  moduleName: string;
}

export default function QuizManager({ moduleId, moduleName }: QuizManagerProps) {
  const queryClient = useQueryClient();
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [quizForm, setQuizForm] = useState({
    title: "",
    passing_score: "70",
    time_limit_minutes: "",
    is_final_exam: false,
    shuffle_questions: true,
  });
  const [questionForm, setQuestionForm] = useState({
    question_text: "",
    explanation: "",
    marks: "1",
    options: [
      { option_text: "", is_correct: true },
      { option_text: "", is_correct: false },
      { option_text: "", is_correct: false },
      { option_text: "", is_correct: false },
    ],
  });

  const { data: quizzes = [] } = useQuery({
    queryKey: ["academy-quizzes", moduleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_quizzes")
        .select("*, academy_quiz_questions(*, academy_quiz_options(*))")
        .eq("module_id", moduleId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const saveQuiz = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("academy_quizzes").insert({
        module_id: moduleId,
        title: quizForm.title,
        passing_score: parseInt(quizForm.passing_score) || 70,
        time_limit_minutes: quizForm.time_limit_minutes ? parseInt(quizForm.time_limit_minutes) : null,
        is_final_exam: quizForm.is_final_exam,
        shuffle_questions: quizForm.shuffle_questions,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Quiz created" });
      queryClient.invalidateQueries({ queryKey: ["academy-quizzes"] });
      setQuizDialogOpen(false);
      setQuizForm({ title: "", passing_score: "70", time_limit_minutes: "", is_final_exam: false, shuffle_questions: true });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteQuiz = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("academy_quizzes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Quiz deleted" });
      queryClient.invalidateQueries({ queryKey: ["academy-quizzes"] });
    },
  });

  const saveQuestion = useMutation({
    mutationFn: async () => {
      if (!selectedQuizId) return;
      // Insert question
      const { data: q, error: qErr } = await supabase
        .from("academy_quiz_questions")
        .insert({
          quiz_id: selectedQuizId,
          question_text: questionForm.question_text,
          explanation: questionForm.explanation || null,
          marks: parseInt(questionForm.marks) || 1,
        } as any)
        .select()
        .single();
      if (qErr) throw qErr;

      // Insert options
      const options = questionForm.options
        .filter((o) => o.option_text.trim())
        .map((o, i) => ({
          question_id: q.id,
          option_text: o.option_text,
          is_correct: o.is_correct,
          order_index: i,
        }));
      if (options.length > 0) {
        const { error: oErr } = await supabase.from("academy_quiz_options").insert(options as any);
        if (oErr) throw oErr;
      }
    },
    onSuccess: () => {
      toast({ title: "Question added" });
      queryClient.invalidateQueries({ queryKey: ["academy-quizzes"] });
      setQuestionDialogOpen(false);
      setQuestionForm({
        question_text: "", explanation: "", marks: "1",
        options: [
          { option_text: "", is_correct: true },
          { option_text: "", is_correct: false },
          { option_text: "", is_correct: false },
          { option_text: "", is_correct: false },
        ],
      });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteQuestion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("academy_quiz_questions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["academy-quizzes"] }),
  });

  const setCorrectOption = (optionIdx: number) => {
    setQuestionForm({
      ...questionForm,
      options: questionForm.options.map((o, i) => ({ ...o, is_correct: i === optionIdx })),
    });
  };

  const updateOption = (idx: number, text: string) => {
    const newOpts = [...questionForm.options];
    newOpts[idx] = { ...newOpts[idx], option_text: text };
    setQuestionForm({ ...questionForm, options: newOpts });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
          <HelpCircle size={14} /> Quizzes
        </h4>
        <Dialog open={quizDialogOpen} onOpenChange={setQuizDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus size={12} className="mr-1" /> Add Quiz
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Quiz for {moduleName}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Quiz Title *</Label><Input value={quizForm.title} onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Passing Score (%)</Label><Input type="number" min="0" max="100" value={quizForm.passing_score} onChange={(e) => setQuizForm({ ...quizForm, passing_score: e.target.value })} /></div>
                <div><Label>Time Limit (min)</Label><Input type="number" placeholder="No limit" value={quizForm.time_limit_minutes} onChange={(e) => setQuizForm({ ...quizForm, time_limit_minutes: e.target.value })} /></div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={quizForm.is_final_exam} onCheckedChange={(v) => setQuizForm({ ...quizForm, is_final_exam: v })} />
                  <Label>Final Certification Exam</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={quizForm.shuffle_questions} onCheckedChange={(v) => setQuizForm({ ...quizForm, shuffle_questions: v })} />
                  <Label>Shuffle Questions</Label>
                </div>
              </div>
              <Button onClick={() => saveQuiz.mutate()} disabled={!quizForm.title || saveQuiz.isPending} className="w-full">Create Quiz</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {quizzes.map((quiz: any) => {
        const questionCount = quiz.academy_quiz_questions?.length || 0;
        return (
          <Card key={quiz.id} className="border-border bg-muted/20">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {quiz.is_final_exam ? (
                    <GraduationCap size={14} className="text-amber-400" />
                  ) : (
                    <HelpCircle size={14} className="text-primary" />
                  )}
                  <span className="text-sm font-medium text-foreground">{quiz.title}</span>
                  <Badge variant="outline" className="text-xs">{questionCount} questions</Badge>
                  {quiz.is_final_exam && <Badge className="bg-amber-500/20 text-amber-400 text-xs">Final Exam</Badge>}
                  <Badge variant="outline" className="text-xs">Pass: {quiz.passing_score}%</Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Dialog open={questionDialogOpen && selectedQuizId === quiz.id} onOpenChange={(o) => { setQuestionDialogOpen(o); if (o) setSelectedQuizId(quiz.id); }}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="ghost" onClick={() => setSelectedQuizId(quiz.id)}>
                        <Plus size={12} className="mr-1" /> Question
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[85vh] overflow-y-auto">
                      <DialogHeader><DialogTitle>Add Question</DialogTitle></DialogHeader>
                      <div className="space-y-4">
                        <div><Label>Question *</Label><Textarea value={questionForm.question_text} onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })} rows={2} /></div>
                        <div><Label>Marks</Label><Input type="number" min="1" value={questionForm.marks} onChange={(e) => setQuestionForm({ ...questionForm, marks: e.target.value })} /></div>
                        <div>
                          <Label>Options (click radio to mark correct)</Label>
                          <div className="mt-2 space-y-2">
                            {questionForm.options.map((opt, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setCorrectOption(i)}
                                  className={`h-4 w-4 shrink-0 rounded-full border-2 transition-colors ${opt.is_correct ? "border-emerald-400 bg-emerald-400" : "border-muted-foreground"}`}
                                />
                                <Input
                                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                  value={opt.option_text}
                                  onChange={(e) => updateOption(i, e.target.value)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                        <div><Label>Explanation (shown after attempt)</Label><Textarea value={questionForm.explanation} onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })} rows={2} /></div>
                        <Button onClick={() => saveQuestion.mutate()} disabled={!questionForm.question_text || questionForm.options.filter(o => o.option_text.trim()).length < 2 || saveQuestion.isPending} className="w-full">Add Question</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm("Delete this quiz?")) deleteQuiz.mutate(quiz.id); }}>
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>

              {/* List questions */}
              {questionCount > 0 && (
                <div className="mt-2 space-y-1">
                  {(quiz.academy_quiz_questions || [])
                    .sort((a: any, b: any) => a.order_index - b.order_index)
                    .map((q: any, i: number) => (
                      <div key={q.id} className="flex items-center justify-between rounded bg-muted/30 px-2 py-1.5 text-xs">
                        <span className="text-foreground">Q{i + 1}. {q.question_text.slice(0, 60)}{q.question_text.length > 60 ? "..." : ""}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{q.marks}m · {q.academy_quiz_options?.length || 0} opts</span>
                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => deleteQuestion.mutate(q.id)}>
                            <Trash2 size={10} />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
