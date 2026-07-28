import Reveal from "@/components/marketing/Reveal";

const STEPS = [
  {
    step: "01",
    title: "Set up your institute",
    body: "Import departments, batches and students in one pass. Roles and permissions are scoped automatically.",
    meta: "Day 1",
  },
  {
    step: "02",
    title: "Generate an exam with AI",
    body: "Describe the syllabus; get MCQ, subjective, coding and case-study questions tagged by Bloom's level.",
    meta: "Minutes, not evenings",
  },
  {
    step: "03",
    title: "Conduct it securely",
    body: "Fullscreen proctoring, tab-switch tracking and plagiarism similarity analysis run during the attempt.",
    meta: "Exam day",
  },
  {
    step: "04",
    title: "Grade and publish",
    body: "Server-side grading with code execution and semantic scoring. Results and analytics publish together.",
    meta: "Same hour",
  },
  {
    step: "05",
    title: "Certify and track outcomes",
    body: "Issue verifiable certificates, watch attendance and performance trends, intervene early.",
    meta: "Ongoing",
  },
];

const WorkflowTimeline = () => (
  <section className="relative hairline-t py-24 md:py-32">
    <div className="container mx-auto px-4">
      <div className="grid gap-14 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow mb-3">How it works</p>
          <h2 className="font-display text-3xl font-semibold leading-tight text-foreground md:text-[2.5rem]">
            From onboarding to outcomes, in one continuous flow
          </h2>
          <p className="mt-4 max-w-md text-muted-foreground">
            Most institutes stitch together spreadsheets, a form builder and a messaging group.
            Instruvex replaces the whole chain.
          </p>
        </Reveal>

        <ol className="relative">
          <span className="absolute left-[15px] top-2 h-[calc(100%-2rem)] w-px bg-border" aria-hidden />
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.step} delay={i * 0.05} className="relative flex gap-5 pb-9 last:pb-0">
              <span className="relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-navy-elevated font-mono text-[10px] text-steel">
                {s.step}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <h3 className="font-display text-lg font-semibold text-foreground">{s.title}</h3>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.meta}</span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </div>
  </section>
);

export default WorkflowTimeline;