import { useState } from "react";
import { Sparkles, Loader2, Copy, Download, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

interface GeneratedQuestion {
  question_text: string;
  marks: number;
  options: { option_text: string; is_correct: boolean }[];
}

const AIGenerator = () => {
  const { toast } = useToast();
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState("5");
  const [difficulty, setDifficulty] = useState("medium");
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({ title: "Enter a topic", variant: "destructive" });
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-questions", {
        body: { topic: topic.trim(), count: parseInt(count), difficulty },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const generated = data?.questions;
      if (!generated?.length) throw new Error("No questions generated");

      setQuestions(generated);
      toast({ title: `${generated.length} questions generated!` });
    } catch (e: any) {
      toast({
        title: "Generation failed",
        description: e.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyAll = () => {
    const text = questions
      .map(
        (q, i) =>
          `Q${i + 1}. ${q.question_text} (${q.marks} marks)\n${q.options
            .map((o, j) => `  ${String.fromCharCode(65 + j)}) ${o.option_text}${o.is_correct ? " ✓" : ""}`)
            .join("\n")}`
      )
      .join("\n\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(questions, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-questions-${topic.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const difficultyColor: Record<string, string> = {
    easy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    hard: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <DashboardLayout>
      <h1 className="font-display text-lg font-semibold text-foreground mb-1">AI Question Generator</h1>
      <p className="mb-6 text-muted-foreground">Generate exam questions instantly using AI</p>

      {/* Generator form */}
      <div className="mb-8 rounded-xl border border-border bg-card-gradient p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={20} className="text-steel" />
          <h2 className="font-display text-base font-semibold text-foreground">Configure Generation</h2>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Topic or Subject</Label>
            <Textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Binary Search Trees, Photosynthesis, World War II, React Hooks..."
              className="mt-1 min-h-[80px]"
              disabled={generating}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label>Number of Questions</Label>
              <Select value={count} onValueChange={setCount} disabled={generating}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[3, 5, 8, 10].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n} questions</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty} disabled={generating}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="hero" className="w-full" onClick={handleGenerate} disabled={generating}>
                {generating ? (
                  <><Loader2 size={16} className="animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles size={16} /> Generate Questions</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {questions.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-foreground">
              Generated Questions ({questions.length})
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyAll}>
                <Copy size={14} /> Copy All
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportJSON}>
                <Download size={14} /> Export JSON
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {questions.map((q, i) => (
              <div key={i} className="rounded-xl border border-border bg-card-gradient p-5 shadow-card">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-muted-foreground">Q{i + 1}</span>
                      <Badge variant="outline" className={difficultyColor[difficulty]}>
                        {difficulty}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{q.marks} mark{q.marks !== 1 ? "s" : ""}</span>
                    </div>
                    <p className="text-sm text-foreground font-medium">{q.question_text}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeQuestion(i)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {q.options.map((opt, j) => (
                    <div
                      key={j}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                        opt.is_correct
                          ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
                          : "border-border bg-secondary/30 text-muted-foreground"
                      }`}
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-xs font-medium">
                        {String.fromCharCode(65 + j)}
                      </span>
                      <span className="flex-1">{opt.option_text}</span>
                      {opt.is_correct && <CheckCircle2 size={14} className="shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {questions.length === 0 && !generating && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <Sparkles size={40} className="mb-3 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Enter a topic above and generate questions with AI</p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AIGenerator;
