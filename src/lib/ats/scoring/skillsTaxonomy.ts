export const SKILL_TAXONOMY: Record<string, string[]> = {
  Programming: [
    "javascript", "typescript", "python", "java", "c++", "c#", "go", "golang", "rust", "ruby",
    "php", "kotlin", "swift", "scala", "r", "dart", "objective-c", "perl", "shell", "bash",
  ],
  Frameworks: [
    "react", "next.js", "nextjs", "vue", "nuxt", "angular", "svelte", "remix", "astro",
    "node.js", "nodejs", "express", "nestjs", "django", "flask", "fastapi", "spring", "spring boot",
    "rails", "laravel", ".net", "asp.net", "flutter", "react native",
  ],
  Cloud: [
    "aws", "amazon web services", "azure", "gcp", "google cloud", "cloudflare", "vercel", "netlify",
    "heroku", "digitalocean", "firebase", "supabase", "s3", "ec2", "lambda", "cloudfront",
  ],
  Databases: [
    "postgresql", "postgres", "mysql", "mongodb", "redis", "sqlite", "dynamodb", "cassandra",
    "elasticsearch", "neo4j", "snowflake", "bigquery", "clickhouse", "mariadb", "oracle",
  ],
  Tools: [
    "git", "github", "gitlab", "bitbucket", "docker", "kubernetes", "k8s", "terraform", "ansible",
    "jenkins", "circleci", "github actions", "jira", "figma", "postman", "webpack", "vite", "npm", "yarn",
  ],
  "AI / ML": [
    "tensorflow", "pytorch", "keras", "scikit-learn", "sklearn", "hugging face", "huggingface",
    "openai", "langchain", "llm", "gpt", "transformers", "nlp", "computer vision", "opencv",
    "machine learning", "deep learning", "neural network", "reinforcement learning",
  ],
  Data: [
    "pandas", "numpy", "matplotlib", "seaborn", "tableau", "power bi", "powerbi", "excel",
    "sql", "etl", "airflow", "spark", "hadoop", "kafka", "dbt", "looker",
  ],
  Soft: [
    "leadership", "communication", "teamwork", "collaboration", "problem solving", "problem-solving",
    "critical thinking", "adaptability", "time management", "mentoring", "presentation",
    "stakeholder management", "public speaking",
  ],
};

export const ACTION_VERBS = new Set([
  "achieved", "architected", "built", "created", "delivered", "designed", "developed", "drove",
  "engineered", "established", "executed", "generated", "implemented", "improved", "increased",
  "initiated", "launched", "led", "managed", "optimized", "orchestrated", "pioneered", "produced",
  "reduced", "refactored", "shipped", "spearheaded", "streamlined", "transformed", "boosted",
  "accelerated", "automated", "authored", "coordinated", "founded", "generated", "mentored",
  "negotiated", "owned", "presented", "researched", "scaled", "secured", "solved", "supervised",
  "trained", "unified", "validated",
]);

export const WEAK_VERBS = new Set([
  "worked", "helped", "assisted", "did", "made", "handled", "responsible", "involved",
  "participated", "tried", "attempted", "used",
]);

export const BUZZWORDS = new Set([
  "synergy", "rockstar", "ninja", "guru", "results-driven", "team player", "hard worker",
  "go-getter", "detail-oriented", "self-starter", "think outside the box",
]);

export const SECTION_HEADERS: Record<string, string[]> = {
  summary: ["summary", "professional summary", "profile", "objective", "about"],
  skills: ["skills", "technical skills", "core competencies", "technologies"],
  experience: ["experience", "work experience", "employment", "professional experience", "work history"],
  projects: ["projects", "personal projects", "notable projects", "selected projects"],
  education: ["education", "academic background", "qualifications"],
  certifications: ["certifications", "certificates", "licenses", "certification"],
  achievements: ["achievements", "awards", "honors", "accomplishments"],
  languages: ["languages", "language proficiency"],
};