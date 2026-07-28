import { Link } from "react-router-dom";
import Reveal from "@/components/marketing/Reveal";
import BrowserFrame from "@/components/marketing/BrowserFrame";
import ExamBuilderDemo from "@/components/marketing/demos/ExamBuilderDemo";
import AttendanceDemo from "@/components/marketing/demos/AttendanceDemo";
import CoursePlayerDemo from "@/components/marketing/demos/CoursePlayerDemo";

const products = [
  {
    tag: "Instruvex Exams",
    title: "Question papers written by AI, owned by your faculty",
    description:
      "Describe the syllabus and difficulty. Get MCQ, subjective, coding and case-study questions tagged by Bloom's level — every one editable before it ships.",
    points: [
      "Proctoring with fullscreen lock and tab-switch tracking",
      "Code execution grading and semantic scoring for written answers",
      "Plagiarism similarity analysis across the whole cohort",
    ],
    url: "instruvex.in/dashboard/exams/create",
    href: "/#book-demo",
    linkLabel: "See the exam engine",
    Demo: ExamBuilderDemo,
  },
  {
    tag: "Instruvex ERP",
    title: "Institute operations that stop living in spreadsheets",
    description:
      "Departments, batches, students and daily attendance in one hierarchy — with row-level isolation so every institute sees only its own data.",
    points: [
      "Daily and lecture-wise attendance with CSV export",
      "Automatic warnings when a student drops below 75%",
      "Assignments, deadlines and submission tracking",
    ],
    url: "instruvex.in/dashboard/attendance",
    href: "/#book-demo",
    linkLabel: "Explore the ERP",
    Demo: AttendanceDemo,
  },
  {
    tag: "Instruvex Academy",
    title: "Courses, quizzes and credentials in one continuous track",
    description:
      "Build modules and lectures, gate progress behind quizzes, and issue a verifiable certificate the moment a learner passes.",
    points: [
      "Resumable video progress across devices",
      "Passing scores enforced before certification",
      "INR pricing with public course pages built for search",
    ],
    url: "instruvex.in/academy/course/ai-machine-learning",
    href: "/academy",
    linkLabel: "Browse the Academy",
    Demo: CoursePlayerDemo,
  },
];

const ProductsSection = () => (
  <section id="products" className="relative hairline-t py-24 md:py-32">
    <div className="container mx-auto px-4">
      <Reveal className="mb-16 max-w-2xl">
        <p className="eyebrow mb-3">Three products</p>
        <h2 className="font-display text-3xl font-semibold leading-tight text-foreground md:text-[2.75rem]">
          Built as one platform, adopted one module at a time
        </h2>
      </Reveal>

      <div className="space-y-24 md:space-y-32">
        {products.map((p, i) => (
          <div
            key={p.tag}
            className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
          >
            <Reveal className={i % 2 === 1 ? "lg:order-2" : undefined}>
              <p className="eyebrow mb-3">{p.tag}</p>
              <h3 className="font-display text-2xl font-semibold leading-snug text-foreground md:text-[1.9rem]">
                {p.title}
              </h3>
              <p className="mt-4 text-muted-foreground">{p.description}</p>
              <ul className="mt-6 space-y-3 border-l border-border pl-5">
                {p.points.map((pt) => (
                  <li key={pt} className="text-sm leading-relaxed text-foreground">
                    {pt}
                  </li>
                ))}
              </ul>
              <Link
                to={p.href}
                className="nav-underline mt-7 inline-block text-sm font-medium text-steel"
              >
                {p.linkLabel} →
              </Link>
            </Reveal>

            <Reveal delay={0.08} className={i % 2 === 1 ? "lg:order-1" : undefined}>
              <BrowserFrame url={p.url}>
                <p.Demo />
              </BrowserFrame>
            </Reveal>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ProductsSection;
