import { Trash2, Plus, GripVertical, ListChecks, AlignLeft, Code, FileText, BookOpen, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export type QuestionType = "mcq" | "short_answer" | "long_answer" | "coding" | "case_study";

export interface QuestionOption {
  id: string;
  option_text: string;
  is_correct: boolean;
}

export interface TestCase {
  id: string;
  input: string;
  expected_output: string;
  is_hidden: boolean;
}

export interface QuestionDraft {
  id: string;
  question_type: QuestionType;
  question_text: string;
  marks: number;
  options: QuestionOption[];
  expected_answer: string;
  code_template: string;
  code_language: string;
  test_cases: TestCase[];
  input_format: string;
  output_format: string;
  constraints_text: string;
  evaluation_criteria: string;
  keywords: string[];
  scenario_text: string;
  sub_questions: QuestionDraft[];
}

const questionTypeIcon: Record<QuestionType, React.ReactNode> = {
  mcq: <ListChecks size={16} />,
  short_answer: <Type size={16} />,
  long_answer: <AlignLeft size={16} />,
  coding: <Code size={16} />,
  case_study: <BookOpen size={16} />,
};

const questionTypeLabel: Record<QuestionType, string> = {
  mcq: "MCQ",
  short_answer: "Short Answer",
  long_answer: "Long Answer",
  coding: "Coding",
  case_study: "Case Study",
};

export const newOption = (): QuestionOption => ({ id: crypto.randomUUID(), option_text: "", is_correct: false });
export const newTestCase = (): TestCase => ({ id: crypto.randomUUID(), input: "", expected_output: "", is_hidden: false });

export const newQuestion = (type: QuestionType = "mcq"): QuestionDraft => ({
  id: crypto.randomUUID(),
  question_type: type,
  question_text: "",
  marks: type === "case_study" ? 0 : 1,
  options: type === "mcq" ? [newOption(), newOption(), newOption(), newOption()] : [],
  expected_answer: "",
  code_template: "",
  code_language: "python",
  test_cases: type === "coding" ? [newTestCase()] : [],
  input_format: "",
  output_format: "",
  constraints_text: "",
  evaluation_criteria: "",
  keywords: [],
  scenario_text: "",
  sub_questions: type === "case_study" ? [newQuestion("short_answer")] : [],
});

interface Props {
  question: QuestionDraft;
  index: number;
  canDelete: boolean;
  onUpdate: (updates: Partial<QuestionDraft>) => void;
  onRemove: () => void;
}

const QuestionEditor = ({ question: q, index: qIdx, canDelete, onUpdate, onRemove }: Props) => {
  const updateOption = (oIdx: number, updates: Partial<QuestionOption>) => {
    onUpdate({ options: q.options.map((o, j) => (j === oIdx ? { ...o, ...updates } : o)) });
  };

  const setCorrectOption = (oIdx: number) => {
    onUpdate({ options: q.options.map((o, j) => ({ ...o, is_correct: j === oIdx })) });
  };

  const addOption = () => onUpdate({ options: [...q.options, newOption()] });
  const removeOption = (oIdx: number) => onUpdate({ options: q.options.filter((_, j) => j !== oIdx) });

  const updateTestCase = (tIdx: number, updates: Partial<TestCase>) => {
    onUpdate({ test_cases: q.test_cases.map((t, j) => (j === tIdx ? { ...t, ...updates } : t)) });
  };
  const addTestCase = () => onUpdate({ test_cases: [...q.test_cases, newTestCase()] });
  const removeTestCase = (tIdx: number) => onUpdate({ test_cases: q.test_cases.filter((_, j) => j !== tIdx) });

  const updateSubQuestion = (sIdx: number, updates: Partial<QuestionDraft>) => {
    onUpdate({ sub_questions: q.sub_questions.map((s, j) => (j === sIdx ? { ...s, ...updates } : s)) });
  };
  const addSubQuestion = () => onUpdate({ sub_questions: [...q.sub_questions, newQuestion("short_answer")] });
  const removeSubQuestion = (sIdx: number) => onUpdate({ sub_questions: q.sub_questions.filter((_, j) => j !== sIdx) });

  return (
    <div className="rounded-xl border border-border bg-card-gradient p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GripVertical size={16} className="text-muted-foreground cursor-grab" />
          <span className="text-sm font-medium text-steel">Q{qIdx + 1}</span>
          <Badge variant="outline" className="flex items-center gap-1 text-xs">
            {questionTypeIcon[q.question_type]} {questionTypeLabel[q.question_type]}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {q.question_type !== "case_study" && (
            <div className="flex items-center gap-1">
              <Label className="text-xs">Marks:</Label>
              <Input type="number" value={q.marks} onChange={(e) => onUpdate({ marks: Number(e.target.value) })} min={0} className="w-16 h-8 text-xs" />
            </div>
          )}
          {canDelete && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onRemove}>
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      </div>

      {/* Case Study Scenario */}
      {q.question_type === "case_study" && (
        <div className="mb-4">
          <Label className="text-xs text-muted-foreground">Scenario / Case Description</Label>
          <Textarea
            value={q.scenario_text}
            onChange={(e) => onUpdate({ scenario_text: e.target.value })}
            placeholder="Describe the case study scenario..."
            className="mt-1"
            rows={5}
          />
        </div>
      )}

      {/* Question text (not for case study parent) */}
      {q.question_type !== "case_study" && (
        <Textarea
          value={q.question_text}
          onChange={(e) => onUpdate({ question_text: e.target.value })}
          placeholder="Enter question text..."
          className="mb-4"
          rows={2}
        />
      )}

      {/* MCQ Options */}
      {q.question_type === "mcq" && (
        <div className="space-y-2">
          {q.options.map((opt, oIdx) => (
            <div key={opt.id} className="flex items-center gap-2">
              <button
                onClick={() => setCorrectOption(oIdx)}
                className={`h-5 w-5 shrink-0 rounded-full border-2 transition-colors ${
                  opt.is_correct ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground"
                }`}
              />
              <Input
                value={opt.option_text}
                onChange={(e) => updateOption(oIdx, { option_text: e.target.value })}
                placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                className="flex-1"
              />
              {q.options.length > 2 && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeOption(oIdx)}>
                  <Trash2 size={12} />
                </Button>
              )}
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={addOption} className="text-xs">
            <Plus size={14} /> Add Option
          </Button>
        </div>
      )}

      {/* Short Answer */}
      {q.question_type === "short_answer" && (
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Expected Answer</Label>
            <Input value={q.expected_answer} onChange={(e) => onUpdate({ expected_answer: e.target.value })} placeholder="Expected answer..." className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Keywords (comma-separated, for AI evaluation)</Label>
            <Input
              value={q.keywords.join(", ")}
              onChange={(e) => onUpdate({ keywords: e.target.value.split(",").map((k) => k.trim()).filter(Boolean) })}
              placeholder="keyword1, keyword2, keyword3"
              className="mt-1"
            />
          </div>
        </div>
      )}

      {/* Long Answer */}
      {q.question_type === "long_answer" && (
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Model Answer</Label>
            <Textarea value={q.expected_answer} onChange={(e) => onUpdate({ expected_answer: e.target.value })} placeholder="Model answer for reference..." className="mt-1" rows={4} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Evaluation Criteria</Label>
            <Textarea value={q.evaluation_criteria} onChange={(e) => onUpdate({ evaluation_criteria: e.target.value })} placeholder="e.g. Clarity of explanation, use of examples, depth of analysis..." className="mt-1" rows={2} />
          </div>
        </div>
      )}

      {/* Coding */}
      {q.question_type === "coding" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Language</Label>
              <Select value={q.code_language} onValueChange={(v) => onUpdate({ code_language: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="cpp">C++</SelectItem>
                  <SelectItem value="c">C</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Constraints</Label>
              <Input value={q.constraints_text} onChange={(e) => onUpdate({ constraints_text: e.target.value })} placeholder="e.g. 1 ≤ N ≤ 10^5" className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Input Format</Label>
              <Textarea value={q.input_format} onChange={(e) => onUpdate({ input_format: e.target.value })} placeholder="Describe input format..." className="mt-1" rows={2} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Output Format</Label>
              <Textarea value={q.output_format} onChange={(e) => onUpdate({ output_format: e.target.value })} placeholder="Describe output format..." className="mt-1" rows={2} />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Code Template (starter code)</Label>
            <Textarea value={q.code_template} onChange={(e) => onUpdate({ code_template: e.target.value })} placeholder="// Starter code..." className="mt-1 font-mono text-sm" rows={4} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Test Cases</Label>
            <div className="space-y-2 mt-1">
              {q.test_cases.map((tc, tIdx) => (
                <div key={tc.id} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-center">
                  <Input value={tc.input} onChange={(e) => updateTestCase(tIdx, { input: e.target.value })} placeholder="Input" className="text-sm font-mono" />
                  <Input value={tc.expected_output} onChange={(e) => updateTestCase(tIdx, { expected_output: e.target.value })} placeholder="Expected output" className="text-sm font-mono" />
                  <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
                    <input type="checkbox" checked={tc.is_hidden} onChange={(e) => updateTestCase(tIdx, { is_hidden: e.target.checked })} />
                    Hidden
                  </label>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeTestCase(tIdx)}><Trash2 size={12} /></Button>
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={addTestCase} className="text-xs"><Plus size={14} /> Add Test Case</Button>
            </div>
          </div>
        </div>
      )}

      {/* Case Study Sub-Questions */}
      {q.question_type === "case_study" && (
        <div className="mt-4 space-y-3">
          <Label className="text-sm font-medium">Sub-Questions</Label>
          {q.sub_questions.map((sub, sIdx) => (
            <div key={sub.id} className="ml-4 rounded-lg border border-border/60 bg-background/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-steel">Q{qIdx + 1}.{sIdx + 1}</span>
                  <Select
                    value={sub.question_type}
                    onValueChange={(v) => updateSubQuestion(sIdx, { question_type: v as QuestionType })}
                  >
                    <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mcq">MCQ</SelectItem>
                      <SelectItem value="short_answer">Short Answer</SelectItem>
                      <SelectItem value="long_answer">Long Answer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Label className="text-xs">Marks:</Label>
                    <Input type="number" value={sub.marks} onChange={(e) => updateSubQuestion(sIdx, { marks: Number(e.target.value) })} min={0} className="w-14 h-7 text-xs" />
                  </div>
                  {q.sub_questions.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeSubQuestion(sIdx)}>
                      <Trash2 size={12} />
                    </Button>
                  )}
                </div>
              </div>
              <Textarea
                value={sub.question_text}
                onChange={(e) => updateSubQuestion(sIdx, { question_text: e.target.value })}
                placeholder="Sub-question text..."
                rows={2}
                className="text-sm"
              />
              {sub.question_type === "mcq" && (
                <div className="space-y-1 mt-2">
                  {sub.options.map((opt, oIdx) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <button
                        onClick={() => updateSubQuestion(sIdx, { options: sub.options.map((o, j) => ({ ...o, is_correct: j === oIdx })) })}
                        className={`h-4 w-4 shrink-0 rounded-full border-2 transition-colors ${opt.is_correct ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground"}`}
                      />
                      <Input
                        value={opt.option_text}
                        onChange={(e) => updateSubQuestion(sIdx, { options: sub.options.map((o, j) => (j === oIdx ? { ...o, option_text: e.target.value } : o)) })}
                        placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                        className="flex-1 h-8 text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}
              {(sub.question_type === "short_answer" || sub.question_type === "long_answer") && (
                <Input
                  value={sub.expected_answer}
                  onChange={(e) => updateSubQuestion(sIdx, { expected_answer: e.target.value })}
                  placeholder="Expected answer..."
                  className="mt-2 text-sm"
                />
              )}
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={addSubQuestion} className="text-xs ml-4">
            <Plus size={14} /> Add Sub-Question
          </Button>
        </div>
      )}
    </div>
  );
};

export default QuestionEditor;
