// Canonical SEO category slugs mapped to the human label stored on `academy_courses.category`.
// When adding a new public category landing page, add it here.

export interface AcademyCategory {
  slug: string;
  label: string;
  // Substrings (lowercase) that match the free-text `category` column on courses.
  matches: string[];
  title: string;
  description: string;
}

export const ACADEMY_CATEGORIES: AcademyCategory[] = [
  {
    slug: "data-science",
    label: "Data Science",
    matches: ["data science", "data-science", "ds"],
    title: "Data Science Courses Online in India",
    description:
      "Master data science with Instruvex Academy — Python, statistics, ML, and real-world projects. Industry-recognized certification on completion.",
  },
  {
    slug: "artificial-intelligence",
    label: "Artificial Intelligence",
    matches: ["ai", "artificial intelligence", "machine learning", "ml", "deep learning"],
    title: "AI & Machine Learning Courses — Instruvex Academy",
    description:
      "Hands-on AI and machine learning courses for students and professionals in India. Build real projects, earn a certificate, and prepare for placements.",
  },
  {
    slug: "web-development",
    label: "Web Development",
    matches: ["web", "web development", "web dev", "frontend", "backend", "full stack", "fullstack"],
    title: "Web Development Courses in India — React, Node, Full Stack",
    description:
      "Learn full-stack web development with Instruvex Academy. HTML, CSS, JavaScript, React, Node.js — beginner to advanced, with certification.",
  },
  {
    slug: "programming",
    label: "Programming",
    matches: ["programming", "python", "java", "c++", "javascript", "coding"],
    title: "Programming Courses — Python, Java, C++ | Instruvex Academy",
    description:
      "Learn programming languages from scratch with structured courses, hands-on coding, and verifiable certificates from Instruvex Academy.",
  },
  {
    slug: "gate-preparation",
    label: "GATE Preparation",
    matches: ["gate", "gate da", "gate cs", "gate preparation"],
    title: "GATE Preparation Courses — Instruvex Academy",
    description:
      "Crack GATE with focused preparation courses, mock tests, and expert mentorship from Instruvex Academy.",
  },
];

export function findCategoryBySlug(slug: string): AcademyCategory | undefined {
  return ACADEMY_CATEGORIES.find((c) => c.slug === slug);
}

export function categoryMatchesCourse(category: AcademyCategory, courseCategory: string | null | undefined): boolean {
  if (!courseCategory) return false;
  const c = courseCategory.toLowerCase();
  return category.matches.some((m) => c.includes(m));
}