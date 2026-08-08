import { BookOpen } from "lucide-react";

export interface PaletteItem {
  index: number;
  answered: boolean;
  marked: boolean;
  isCaseStudy: boolean;
}

interface Props {
  items: PaletteItem[];
  current: number;
  onSelect: (index: number) => void;
}

const QuestionPalette = ({ items, current, onSelect }: Props) => (
  <div>
    <p className="mb-3 font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      Questions
    </p>
    <div className="grid grid-cols-5 gap-2">
      {items.map((item) => {
        const active = item.index === current;
        const tone = active
          ? "bg-steel text-primary-foreground shadow-glow"
          : item.marked
            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
            : item.answered
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              : "bg-muted/60 text-muted-foreground border border-border hover:text-foreground";
        return (
          <button
            key={item.index}
            type="button"
            onClick={() => onSelect(item.index)}
            aria-current={active}
            aria-label={`Question ${item.index + 1}${item.answered ? ", answered" : ""}${item.marked ? ", marked for review" : ""}`}
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-medium transition-all ${tone}`}
          >
            {item.isCaseStudy ? <BookOpen size={13} /> : item.index + 1}
          </button>
        );
      })}
    </div>

    <div className="mt-4 space-y-1.5 text-[11px] text-muted-foreground">
      <Legend className="bg-emerald-500/60" label="Answered" />
      <Legend className="bg-amber-500/60" label="Marked for review" />
      <Legend className="bg-muted" label="Unanswered" />
      <Legend className="bg-steel" label="Current" />
    </div>
  </div>
);

const Legend = ({ className, label }: { className: string; label: string }) => (
  <div className="flex items-center gap-2">
    <span className={`h-2.5 w-2.5 rounded-full ${className}`} />
    {label}
  </div>
);

export default QuestionPalette;