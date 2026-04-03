import { useState } from "react";
import { Play, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface TestCaseResult {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
}

interface Props {
  code: string;
  language: string;
  onCodeChange: (code: string) => void;
  testCases?: { input: string; expected_output: string }[];
  readOnlyLanguage?: boolean;
}

const LANG_MAP: Record<string, { id: number; label: string }> = {
  python: { id: 71, label: "Python" },
  javascript: { id: 63, label: "JavaScript" },
  java: { id: 62, label: "Java" },
  cpp: { id: 54, label: "C++" },
  c: { id: 50, label: "C" },
};

const CodeEditor = ({ code, language, onCodeChange, testCases, readOnlyLanguage }: Props) => {
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<string>("");
  const [results, setResults] = useState<TestCaseResult[]>([]);
  const [customInput, setCustomInput] = useState("");

  const runCode = async (stdin?: string) => {
    setRunning(true);
    setOutput("");
    setResults([]);

    try {
      const { data, error } = await supabase.functions.invoke("run-code", {
        body: {
          source_code: code,
          language_id: LANG_MAP[language]?.id || 71,
          stdin: stdin || "",
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setOutput(data?.stdout || data?.stderr || data?.compile_output || "No output");
      return data?.stdout?.trim() || "";
    } catch (e: any) {
      setOutput(`Error: ${e.message}`);
      return "";
    } finally {
      setRunning(false);
    }
  };

  const runWithTestCases = async () => {
    if (!testCases?.length) return;
    setRunning(true);
    setResults([]);
    const res: TestCaseResult[] = [];

    for (const tc of testCases) {
      try {
        const { data } = await supabase.functions.invoke("run-code", {
          body: {
            source_code: code,
            language_id: LANG_MAP[language]?.id || 71,
            stdin: tc.input,
          },
        });
        const actual = (data?.stdout || "").trim();
        res.push({
          input: tc.input,
          expected: tc.expected_output.trim(),
          actual,
          passed: actual === tc.expected_output.trim(),
        });
      } catch {
        res.push({ input: tc.input, expected: tc.expected_output, actual: "Error", passed: false });
      }
    }
    setResults(res);
    setRunning(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Language:</span>
        <span className="text-xs font-medium text-foreground">{LANG_MAP[language]?.label || language}</span>
      </div>

      <div className="relative">
        <Textarea
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          className="font-mono text-sm min-h-[300px] bg-[hsl(var(--navy-deep))] text-foreground"
          placeholder="Write your code here..."
        />
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => runCode(customInput)} disabled={running}>
          {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          Run Code
        </Button>
        {testCases && testCases.length > 0 && (
          <Button variant="hero" size="sm" onClick={runWithTestCases} disabled={running}>
            {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            Run Test Cases ({testCases.length})
          </Button>
        )}
      </div>

      {/* Custom input */}
      <div>
        <span className="text-xs text-muted-foreground">Custom Input (stdin):</span>
        <Textarea value={customInput} onChange={(e) => setCustomInput(e.target.value)} className="mt-1 font-mono text-sm" rows={2} placeholder="Enter input..." />
      </div>

      {/* Output */}
      {output && (
        <div className="rounded-lg border border-border bg-[hsl(var(--navy-deep))] p-4">
          <span className="text-xs text-muted-foreground block mb-1">Output:</span>
          <pre className="text-sm text-foreground font-mono whitespace-pre-wrap">{output}</pre>
        </div>
      )}

      {/* Test case results */}
      {results.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground">
            Test Results: {results.filter((r) => r.passed).length}/{results.length} passed
          </span>
          {results.map((r, i) => (
            <div key={i} className={`rounded-lg border p-3 text-sm ${r.passed ? "border-emerald-500/30 bg-emerald-500/5" : "border-destructive/30 bg-destructive/5"}`}>
              <div className="flex items-center gap-2 mb-1">
                {r.passed ? <CheckCircle2 size={14} className="text-emerald-500" /> : <XCircle size={14} className="text-destructive" />}
                <span className="font-medium">Test Case {i + 1}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div><span className="text-muted-foreground">Input:</span> {r.input}</div>
                <div><span className="text-muted-foreground">Expected:</span> {r.expected}</div>
                <div><span className="text-muted-foreground">Got:</span> {r.actual}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
