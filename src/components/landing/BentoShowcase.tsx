import { Link } from "react-router-dom";
import Reveal from "@/components/marketing/Reveal";
import BrowserFrame from "@/components/marketing/BrowserFrame";
import AnalyticsDemo from "@/components/marketing/demos/AnalyticsDemo";
import AttendanceDemo from "@/components/marketing/demos/AttendanceDemo";
import CertificateDemo from "@/components/marketing/demos/CertificateDemo";
import CoursePlayerDemo from "@/components/marketing/demos/CoursePlayerDemo";

const BentoShowcase = () => (
  <section id="features" className="relative py-24 md:py-32">
    <div className="container mx-auto px-4">
      <Reveal className="mb-12 max-w-2xl">
        <p className="eyebrow mb-3">The platform</p>
        <h2 className="font-display text-3xl font-semibold leading-tight text-foreground md:text-[2.75rem]">
          One system for the entire academic operation
        </h2>
        <p className="mt-4 text-muted-foreground">
          Not a bundle of features — a connected workflow. Exams feed analytics, attendance feeds
          eligibility, learning feeds certification.
        </p>
      </Reveal>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Large tile */}
        <Reveal className="lg:col-span-2">
          <article className="surface lift flex h-full flex-col overflow-hidden rounded-xl">
            <div className="flex flex-col gap-3 p-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-md">
                <p className="eyebrow mb-2">Analytics</p>
                <h3 className="font-display text-xl font-semibold text-foreground">
                  Performance you can act on, not just read
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Cohort trends, question-level difficulty, and automatic flags for students falling
                  behind — updated the moment an exam closes.
                </p>
              </div>
            </div>
            <div className="mt-auto px-6 pb-6">
              <BrowserFrame url="instruvex.in/dashboard/analytics">
                <AnalyticsDemo />
              </BrowserFrame>
            </div>
          </article>
        </Reveal>

        {/* Attendance tile */}
        <Reveal delay={0.06}>
          <article className="surface lift flex h-full flex-col overflow-hidden rounded-xl">
            <div className="p-6">
              <p className="eyebrow mb-2">ERP</p>
              <h3 className="font-display text-xl font-semibold text-foreground">Attendance, lecture by lecture</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Mark a full roll in seconds. Automatic warnings below 75%.
              </p>
            </div>
            <div className="mt-auto max-h-[260px] overflow-hidden border-t border-border">
              <AttendanceDemo />
            </div>
          </article>
        </Reveal>

        {/* Certificate tile */}
        <Reveal delay={0.04}>
          <article className="surface lift flex h-full flex-col overflow-hidden rounded-xl">
            <div className="p-6 pb-0">
              <p className="eyebrow mb-2">Credentials</p>
              <h3 className="font-display text-xl font-semibold text-foreground">
                Certificates anyone can verify
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Every certificate carries a public ID employers can check instantly.
              </p>
            </div>
            <div className="mt-auto border-t border-border">
              <CertificateDemo />
            </div>
            <div className="border-t border-border px-6 py-3">
              <Link to="/verify" className="nav-underline text-xs font-medium text-steel">
                Try the verification portal
              </Link>
            </div>
          </article>
        </Reveal>

        {/* Academy tile */}
        <Reveal delay={0.08} className="lg:col-span-2">
          <article className="surface lift flex h-full flex-col overflow-hidden rounded-xl">
            <div className="p-6">
              <p className="eyebrow mb-2">Academy</p>
              <h3 className="font-display text-xl font-semibold text-foreground">
                A learning experience students actually finish
              </h3>
              <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                Structured modules, in-lesson quizzes, resumable progress, and a certificate at the
                end — all tracked against the same student record as their exams.
              </p>
            </div>
            <div className="mt-auto border-t border-border">
              <CoursePlayerDemo />
            </div>
          </article>
        </Reveal>
      </div>
    </div>
  </section>
);

export default BentoShowcase;