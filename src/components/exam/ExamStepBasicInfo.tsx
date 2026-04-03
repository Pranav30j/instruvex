import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ExamBasicInfo {
  title: string;
  description: string;
  duration: number;
  passingMarks: number;
  shuffleQuestions: boolean;
  showResults: boolean;
  examType: string;
}

interface Props {
  info: ExamBasicInfo;
  onChange: (updates: Partial<ExamBasicInfo>) => void;
}

const ExamStepBasicInfo = ({ info, onChange }: Props) => (
  <div className="rounded-xl border border-border bg-card-gradient p-6 shadow-card">
    <h2 className="font-display text-lg font-semibold text-foreground mb-4">Exam Details</h2>
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label>Title *</Label>
        <Input value={info.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="e.g. Midterm Data Structures" className="mt-1" />
      </div>
      <div className="sm:col-span-2">
        <Label>Description</Label>
        <Textarea value={info.description} onChange={(e) => onChange({ description: e.target.value })} placeholder="Optional description..." className="mt-1" rows={3} />
      </div>
      <div>
        <Label>Duration (minutes)</Label>
        <Input type="number" value={info.duration} onChange={(e) => onChange({ duration: Number(e.target.value) })} min={1} className="mt-1" />
      </div>
      <div>
        <Label>Passing Marks</Label>
        <Input type="number" value={info.passingMarks} onChange={(e) => onChange({ passingMarks: Number(e.target.value) })} min={0} className="mt-1" />
      </div>
      <div>
        <Label>Exam Type</Label>
        <Select value={info.examType} onValueChange={(v) => onChange({ examType: v })}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="practice">Practice</SelectItem>
            <SelectItem value="final">Final Exam</SelectItem>
            <SelectItem value="university">University Level</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Switch checked={info.shuffleQuestions} onCheckedChange={(v) => onChange({ shuffleQuestions: v })} />
          <Label>Shuffle Questions</Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={info.showResults} onCheckedChange={(v) => onChange({ showResults: v })} />
          <Label>Show Results to Students</Label>
        </div>
      </div>
    </div>
  </div>
);

export default ExamStepBasicInfo;
export type { ExamBasicInfo };
