import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen, Search, Filter, ChevronDown, CheckCircle2, Code, FileText, Sparkles, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";

const typeIcon: Record<string, typeof FileText> = {
  mcq: CheckCircle2,
  subjective: FileText,
  coding: Code,
};

const typeLabel: Record<string, string> = {
  mcq: "MCQ",
  subjective: "Subjective",
  coding: "Coding",
};

const QuestionBank = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [examFilter, setExamFilter] = useState("all");

  // Fetch exams created by user
  const { data: exams = [] } = useQuery({
    queryKey: ["my-exams", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select("id, title")
        .eq("created_by", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch all questions with options for user's exams
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ["question-bank", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("*, question_options(*), exams!inner(id, title, created_by)")
        .eq("exams.created_by", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      const matchSearch =
        !search ||
        q.question_text.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "all" || q.question_type === typeFilter;
      const matchExam = examFilter === "all" || q.exam_id === examFilter;
      return matchSearch && matchType && matchExam;
    });
  }, [questions, search, typeFilter, examFilter]);

  const stats = useMemo(() => {
    const total = questions.length;
    const mcq = questions.filter((q) => q.question_type === "mcq").length;
    const subjective = questions.filter((q) => q.question_type === "subjective").length;
    const coding = questions.filter((q) => q.question_type === "coding").length;
    return { total, mcq, subjective, coding };
  }, [questions]);

  return (
    <DashboardLayout>
      <h1 className="font-display text-lg font-semibold text-foreground mb-1">Question Bank</h1>
      <p className="mb-6 text-muted-foreground">Browse and manage all questions across your exams</p>

      {/* Stats */}
      <div className="mb-6 grid gap-3 grid-cols-2 sm:grid-cols-4">
        {[
          { label: "Total", value: stats.total, icon: BookOpen },
          { label: "MCQ", value: stats.mcq, icon: CheckCircle2 },
          { label: "Subjective", value: stats.subjective, icon: FileText },
          { label: "Coding", value: stats.coding, icon: Code },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card-gradient p-4 shadow-card">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <s.icon size={14} className="text-steel" />
            </div>
            <p className="font-display text-xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions..."
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter size={14} className="mr-1 text-muted-foreground" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="mcq">MCQ</SelectItem>
            <SelectItem value="subjective">Subjective</SelectItem>
            <SelectItem value="coding">Coding</SelectItem>
          </SelectContent>
        </Select>
        <Select value={examFilter} onValueChange={setExamFilter}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Exam" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Exams</SelectItem>
            {exams.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-steel" />
        </div>
      )}

      {/* Question list */}
      {!isLoading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((q) => {
            const Icon = typeIcon[q.question_type] || FileText;
            const examTitle = q.exams?.title || "Unknown Exam";
            const options = (q.question_options || []).sort(
              (a: any, b: any) => a.order_index - b.order_index
            );

            return (
              <Collapsible key={q.id}>
                <div className="rounded-xl border border-border bg-card-gradient shadow-card overflow-hidden">
                  <CollapsibleTrigger className="flex w-full items-start gap-3 p-4 text-left hover:bg-secondary/20 transition-colors">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-steel/10 text-steel">
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-2">{q.question_text}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {typeLabel[q.question_type] || q.question_type}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{q.marks} mark{q.marks !== 1 ? "s" : ""}</span>
                        <span className="text-[10px] text-muted-foreground">•</span>
                        <span className="text-[10px] text-muted-foreground truncate">{examTitle}</span>
                      </div>
                    </div>
                    <ChevronDown size={16} className="mt-1 shrink-0 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180" />
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="border-t border-border px-4 py-3 space-y-2">
                      {q.question_type === "mcq" && options.length > 0 && (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {options.map((opt: any, j: number) => (
                            <div
                              key={opt.id}
                              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                                opt.is_correct
                                  ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
                                  : "border-border bg-secondary/30 text-muted-foreground"
                              }`}
                            >
                              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-current text-[10px] font-medium">
                                {String.fromCharCode(65 + j)}
                              </span>
                              <span className="flex-1">{opt.option_text}</span>
                              {opt.is_correct && <CheckCircle2 size={12} className="shrink-0" />}
                            </div>
                          ))}
                        </div>
                      )}
                      {q.question_type === "subjective" && q.expected_answer && (
                        <div>
                          <p className="text-[10px] font-medium text-muted-foreground mb-1">Expected Answer</p>
                          <p className="text-xs text-foreground/80 rounded-lg border border-border bg-secondary/30 p-3">
                            {q.expected_answer}
                          </p>
                        </div>
                      )}
                      {q.question_type === "coding" && (
                        <div className="space-y-2">
                          {q.code_language && (
                            <Badge variant="outline" className="text-[10px]">{q.code_language}</Badge>
                          )}
                          {q.code_template && (
                            <pre className="text-[11px] text-foreground/80 rounded-lg border border-border bg-secondary/30 p-3 overflow-x-auto font-mono">
                              {q.code_template}
                            </pre>
                          )}
                        </div>
                      )}
                      {q.question_type === "mcq" && options.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">No options found</p>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <BookOpen size={40} className="mb-3 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {questions.length === 0
              ? "No questions yet. Create an exam and add questions to see them here."
              : "No questions match your filters."}
          </p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default QuestionBank;
