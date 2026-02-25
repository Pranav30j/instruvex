import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GeneratedQuestion {
  question_text: string;
  marks: number;
  options: { option_text: string; is_correct: boolean }[];
}

interface AIQuestionGeneratorProps {
  onQuestionsGenerated: (questions: GeneratedQuestion[]) => void;
}

const AIQuestionGenerator = ({ onQuestionsGenerated }: AIQuestionGeneratorProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState("5");
  const [difficulty, setDifficulty] = useState("medium");
  const [generating, setGenerating] = useState(false);

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

      const questions = data?.questions;
      if (!questions?.length) throw new Error("No questions generated");

      onQuestionsGenerated(questions);
      toast({ title: `${questions.length} questions generated!` });
      setOpen(false);
      setTopic("");
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="hero" size="sm">
          <Sparkles size={16} /> AI Generate
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={18} className="text-primary" /> AI Question Generator
          </DialogTitle>
          <DialogDescription>
            Enter a topic and AI will generate MCQ questions for your exam.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Topic or Subject</Label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Binary Search Trees, Photosynthesis, World War II..."
              className="mt-1"
              disabled={generating}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
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
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={generating}>
            Cancel
          </Button>
          <Button variant="hero" onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <><Loader2 size={16} className="animate-spin" /> Generating...</>
            ) : (
              <><Sparkles size={16} /> Generate</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AIQuestionGenerator;
