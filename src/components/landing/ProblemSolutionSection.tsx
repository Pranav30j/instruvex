import Reveal from "@/components/marketing/Reveal";

const problems = [
  "Manual paper-based exams waste time and resources",
  "Scattered systems for attendance, exams, and grades",
  "No plagiarism detection or anti-cheat monitoring",
  "Delayed result processing and certificate generation",
];

const solutions = [
  "AI generates question papers in seconds with Bloom's taxonomy",
  "One unified platform for exams, attendance, LMS, and certificates",
  "Built-in proctoring, plagiarism detection, and security monitoring",
  "Instant auto-grading with real-time analytics and digital certificates",
];

const ProblemSolutionSection = () => (
  <section className="relative hairline-t py-24 md:py-28">
    <div className="container mx-auto px-4">
      <Reveal className="mb-14 max-w-2xl">
        <p className="eyebrow mb-3">The shift</p>
        <h2 className="font-display text-3xl font-semibold leading-tight text-foreground md:text-[2.5rem]">
          What changes on the day you switch
        </h2>
      </Reveal>

      <Reveal className="overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
          <div className="bg-navy-deep/50 p-8">
            <p className="eyebrow mb-6 text-muted-foreground">Before</p>
            <ul className="space-y-5">
              {problems.map((p) => (
                <li key={p} className="flex gap-3 text-sm text-muted-foreground">
                  <span className="mt-2 h-px w-4 shrink-0 bg-border" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-navy-elevated/30 p-8">
            <p className="eyebrow mb-6">With Instruvex</p>
            <ul className="space-y-5">
              {solutions.map((s) => (
                <li key={s} className="flex gap-3 text-sm text-foreground">
                  <span className="mt-2 h-px w-4 shrink-0 bg-steel" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>
    </div>
  </section>
);

export default ProblemSolutionSection;
