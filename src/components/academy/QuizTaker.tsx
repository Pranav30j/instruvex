import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  CheckCircle2, XCircle, Clock, RotateCcw, Trophy, ArrowRight, ArrowLeft,
} from "lucide-react";
import { notifyQuizCompletion } from "@/lib/notifications";

interface QuizTakerProps {
  quizId: string;
  onComplete?: (passed: boolean) => void;
}

export default function QuizTaker({ quizId, onComplete }: QuizTakerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; passed: boolean } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const { data: quiz } = useQuery({
    queryKey: ["academy-quiz", quizId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_quizzes")
        .select("*")
        .eq("id", quizId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: questions = [] } = useQuery({
    queryKey: ["academy-quiz-questions", quizId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_quiz_questions")
        .select("*, academy_quiz_options(*)")
        .eq("quiz_id", quizId)
        .order("order_index");
      if (error) throw error;
      // Shuffle if needed
      if (quiz?.shuffle_questions) {
        return data.sort(() => Math.random() - 0.5);
      }
      return data;
    },
    enabled: !!quiz,
  });

  const { data: pastAttempts = [] } = useQuery({
    queryKey: ["academy-quiz-attempts", quizId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_quiz_attempts")
        .select("*")
        .eq("quiz_id", quizId)
        .eq("user_id", user!.id)
        .order("started_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Timer
  useEffect(() => {
    if (!quiz?.time_limit_minutes || submitted) return;
    setTimeLeft(quiz.time_limit_minutes * 60);
  }, [quiz?.time_limit_minutes, submitted]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submitted]);

  const handleSubmit = useCallback(async () => {
    if (submitted || !user || questions.length === 0) return;
    setSubmitted(true);

    let score = 0;
    let totalMarks = 0;

    questions.forEach((q: any) => {
      totalMarks += q.marks || 1;
      const selectedOptionId = answers[q.id];
      if (selectedOptionId) {
        const correctOption = (q.academy_quiz_options || []).find((o: any) => o.is_correct);
        if (correctOption && correctOption.id === selectedOptionId) {
          score += q.marks || 1;
        }
      }
    });

    const passingScore = quiz?.passing_score || 70;
    const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
    const passed = percentage >= passingScore;

    setResult({ score, total: totalMarks, passed });

    // Save attempt
    await supabase.from("academy_quiz_attempts").insert({
      quiz_id: quizId,
      user_id: user.id,
      score,
      total_marks: totalMarks,
      passed,
      answers,
      completed_at: new Date().toISOString(),
    } as any);

    queryClient.invalidateQueries({ queryKey: ["academy-quiz-attempts"] });

    // Send in-app notification
    if (user) {
      notifyQuizCompletion(user.id, quiz?.title || "Quiz", passed, score, totalMarks);
    }

    // If final exam and passed, generate certificate
    if (quiz?.is_final_exam && passed) {
      onComplete?.(true);
    } else {
      onComplete?.(passed);
    }
  }, [submitted, user, questions, answers, quiz, quizId, queryClient, onComplete]);

  const handleRetry = () => {
    setSubmitted(false);
    setResult(null);
    setAnswers({});
    setCurrentIdx(0);
    if (quiz?.time_limit_minutes) {
      setTimeLeft(quiz.time_limit_minutes * 60);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (questions.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">No questions in this quiz yet.</p>
        </CardContent>
      </Card>
    );
  }

  // Results view
  if (submitted && result) {
    const percentage = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
    return (
      <Card className="border-border bg-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3">
            {result.passed ? (
              <Trophy className="h-12 w-12 text-amber-400" />
            ) : (
              <XCircle className="h-12 w-12 text-destructive" />
            )}
          </div>
          <CardTitle className="text-xl">
            {result.passed ? "Congratulations! You Passed!" : "Not Quite There Yet"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-foreground">{percentage}%</p>
            <p className="text-sm text-muted-foreground">
              {result.score} / {result.total} marks · Passing: {quiz?.passing_score || 70}%
            </p>
          </div>
          <Progress value={percentage} className="h-3" />

          {/* Show answers review */}
          <div className="space-y-3 pt-4">
            <h4 className="text-sm font-semibold text-foreground">Review Answers</h4>
            {questions.map((q: any, i: number) => {
              const selectedId = answers[q.id];
              const correctOption = (q.academy_quiz_options || []).find((o: any) => o.is_correct);
              const isCorrect = selectedId === correctOption?.id;

              return (
                <div key={q.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-start gap-2">
                    {isCorrect ? (
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                    ) : (
                      <XCircle size={16} className="mt-0.5 shrink-0 text-destructive" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Q{i + 1}. {q.question_text}</p>
                      {!isCorrect && correctOption && (
                        <p className="mt-1 text-xs text-emerald-400">
                          Correct: {correctOption.option_text}
                        </p>
                      )}
                      {q.explanation && (
                        <p className="mt-1 text-xs text-muted-foreground italic">{q.explanation}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {!result.passed && (
            <Button onClick={handleRetry} className="w-full">
              <RotateCcw size={14} className="mr-1" /> Retry Quiz
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Quiz taking view
  const currentQ = questions[currentIdx];
  const options = (currentQ?.academy_quiz_options || []).sort(
    (a: any, b: any) => a.order_index - b.order_index
  );
  const answeredCount = Object.keys(answers).length;

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{quiz?.title || "Quiz"}</CardTitle>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              {answeredCount}/{questions.length} answered
            </Badge>
            {timeLeft !== null && (
              <Badge
                variant="outline"
                className={`text-xs ${timeLeft < 60 ? "border-destructive text-destructive" : ""}`}
              >
                <Clock size={12} className="mr-1" />
                {formatTime(timeLeft)}
              </Badge>
            )}
          </div>
        </div>
        <Progress value={(answeredCount / questions.length) * 100} className="h-1.5" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">
            Question {currentIdx + 1} of {questions.length}
            {currentQ?.marks > 1 && ` · ${currentQ.marks} marks`}
          </p>
          <p className="text-sm font-medium text-foreground">{currentQ?.question_text}</p>
        </div>

        <RadioGroup
          value={answers[currentQ?.id] || ""}
          onValueChange={(val) => setAnswers({ ...answers, [currentQ.id]: val })}
        >
          {options.map((opt: any) => (
            <div
              key={opt.id}
              className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/30"
            >
              <RadioGroupItem value={opt.id} id={opt.id} />
              <Label htmlFor={opt.id} className="flex-1 cursor-pointer text-sm text-foreground">
                {opt.option_text}
              </Label>
            </div>
          ))}
        </RadioGroup>

        <div className="flex items-center justify-between pt-2">
          <Button
            size="sm"
            variant="outline"
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx(currentIdx - 1)}
          >
            <ArrowLeft size={14} className="mr-1" /> Previous
          </Button>

          {currentIdx < questions.length - 1 ? (
            <Button
              size="sm"
              onClick={() => setCurrentIdx(currentIdx + 1)}
            >
              Next <ArrowRight size={14} className="ml-1" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={answeredCount < questions.length}
            >
              Submit Quiz
            </Button>
          )}
        </div>

        {/* Question nav dots */}
        <div className="flex flex-wrap gap-1.5 pt-2">
          {questions.map((_: any, i: number) => (
            <button
              key={i}
              onClick={() => setCurrentIdx(i)}
              className={`h-6 w-6 rounded text-xs font-medium transition-colors ${
                i === currentIdx
                  ? "bg-primary text-primary-foreground"
                  : answers[questions[i]?.id]
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {pastAttempts.length > 0 && (
          <div className="border-t border-border pt-3">
            <p className="text-xs text-muted-foreground mb-1">Previous Attempts</p>
            <div className="flex flex-wrap gap-2">
              {pastAttempts.slice(0, 5).map((a: any) => (
                <Badge
                  key={a.id}
                  variant="outline"
                  className={`text-xs ${a.passed ? "text-emerald-400" : "text-muted-foreground"}`}
                >
                  {Math.round((a.score / a.total_marks) * 100)}%
                  {a.passed ? " ✓" : ""}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
