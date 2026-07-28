import Reveal from "@/components/marketing/Reveal";
import Counter from "@/components/marketing/Counter";

const metrics = [
  { to: 50, suffix: "+", label: "Institutes onboarded" },
  { to: 10000, suffix: "+", label: "Students managed" },
  { to: 25000, suffix: "+", label: "Exams conducted" },
  { to: 4.8, decimals: 1, suffix: "/5", label: "Satisfaction rating" },
];

const testimonials = [
  {
    quote:
      "Question paper prep used to take our faculty two full evenings per subject. With Instruvex it's a review job, not a writing job.",
    name: "Dr. Meera Kulkarni",
    role: "Dean of Academics, Nalanda Polytechnic",
    initials: "MK",
  },
  {
    quote:
      "Attendance defaulters used to surface at the end of term. Now we catch them in week three, and parents get told the same day.",
    name: "Rajat Bhosale",
    role: "Administrator, Sinhgad Institutes",
    initials: "RB",
  },
  {
    quote:
      "Our certificates are verifiable on a public link. That single change ended every 'is this genuine?' email from recruiters.",
    name: "Sneha Pillai",
    role: "Programme Head, Skillbridge Academy",
    initials: "SP",
  },
];

const SocialProofSection = () => (
  <section className="relative hairline-t py-24 md:py-32">
    <div className="container mx-auto px-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m, i) => (
          <Reveal key={m.label} delay={i * 0.05}>
            <div className="surface rounded-xl p-6">
              <div className="font-display text-3xl font-semibold tracking-tight text-foreground">
                <Counter to={m.to} suffix={m.suffix} decimals={m.decimals} />
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">{m.label}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal className="mb-10 mt-20 max-w-2xl">
        <p className="eyebrow mb-3">Why teams stay</p>
        <h2 className="font-display text-3xl font-semibold leading-tight text-foreground md:text-[2.5rem]">
          Administrators, faculty and students — on the same record
        </h2>
      </Reveal>

      <div className="grid gap-4 lg:grid-cols-3">
        {testimonials.map((t, i) => (
          <Reveal key={t.name} delay={i * 0.06}>
            <figure className="surface lift flex h-full flex-col rounded-xl p-6">
              <blockquote className="text-sm leading-relaxed text-foreground">“{t.quote}”</blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-steel/10 text-xs font-semibold text-steel">
                  {t.initials}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

export default SocialProofSection;
