export type CategoryKey =
  | "contact"
  | "sections"
  | "formatting"
  | "readability"
  | "skills"
  | "experience"
  | "projects"
  | "education"
  | "compliance";

export interface CheckResult {
  key: CategoryKey;
  label: string;
  score: number;
  max: number;
  passed: string[];
  failed: string[];
  details?: Record<string, unknown>;
}

export interface Suggestion {
  section: string;
  before: string;
  after: string;
  rationale?: string;
}

export interface AnalysisResult {
  overallScore: number;
  categories: Record<CategoryKey, CheckResult>;
  strengths: string[];
  warnings: string[];
  suggestions: Suggestion[];
  keywords: { group: string; items: string[] }[];
  aiSummary?: string;
  passProbability: number;
  recruiterImpression: string;
  resumeText: string;
  fileName: string;
  fileSize: number;
}

export interface ExtractedResume {
  text: string;
  fileName: string;
  fileSize: number;
  layout?: {
    columns: number;
    imageCount: number;
    fontSizes: number[];
    pageCount: number;
  };
  warnings: string[];
}