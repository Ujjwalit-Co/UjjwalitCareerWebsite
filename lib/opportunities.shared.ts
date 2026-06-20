export type Opportunity = {
  id: string;
  slug: string;
  type: 'internship' | 'event' | 'project';
  title: string;
  short_title: string | null;
  tagline: string;
  description: string;
  details_markdown: string | null;
  status: 'draft' | 'open' | 'closed' | 'archived';
  visibility: 'public' | 'private';
  price_inr: number;
  stipend_label: string;
  duration_label: string;
  location_label: string;
  cohort_label: string | null;
  starts_on: string | null;
  ends_on: string | null;
  apply_by: string | null;
  capacity: number | null;
  display_order: number;
  accent: 'teal' | 'orange' | 'blue' | 'amber';
  cover_image_url: string | null;
  features: string[];
  outcomes: string[];
  eligibility: string[];
  project_links: Array<{ label: string; url: string }>;
};

export const fallbackOpportunities: Opportunity[] = [
  {
    id: 'fallback-web-development',
    slug: 'web-development-internship',
    type: 'internship',
    title: 'Web Development Internship Program',
    short_title: 'Web Dev',
    tagline: 'Learn by Building. Grow by Creating.',
    description: 'The Ujjwalit Developers Program (UDP) is a hands-on training and internship initiative designed for students, aspiring developers, and beginners who want to gain practical industry experience by building real-world software projects. Participants work on guided projects, modern development tools, deployment workflows, and industry practices used by professional software teams.',
    details_markdown: `## Program Structure
- **Duration**: 4 Weeks
- **Sessions**: 2 Sessions per Week (2 Hours per Session)
- **Format**: 100% Remote / Online

## Projects You Will Build
1. **Minor Project: Honey Store Business Website**
   - Build a modern responsive business landing page while learning the fundamentals of HTML, CSS layouts, styling, responsiveness, and user experience.
2. **Major Project: Hospital & Clinic Management System**
   - Build a complete web application with responsive frontend, client-ready workflows, authentication principles, patient booking slots, database concepts, and version checks.`,
    status: 'open',
    visibility: 'public',
    price_inr: 299,
    stipend_label: 'Not Applicable',
    duration_label: '4 Weeks',
    location_label: 'Remote',
    cohort_label: 'UDP Cohort 2026',
    starts_on: null,
    ends_on: null,
    apply_by: null,
    capacity: 100,
    display_order: 10,
    accent: 'teal',
    cover_image_url: null,
    features: [
      'Modern Web Development (HTML, CSS, Tailwind CSS)',
      'Interactive Interfaces (JavaScript, React)',
      'Backend Concepts (APIs, Authentication, Database Integration)',
      'Developer Tooling (Git, GitHub, VS Code, Hosting)',
      'Freelancing & Client-Ready Project Delivery Basics'
    ],
    outcomes: [
      'Minor Project: Honey Store Business Landing Page',
      'Major Project: Hospital & Clinic Management System',
      'Tamper-Proof QR-linked verification certificate (registry verified)',
      'Letter of Recommendation & Future Priority Consideration (for top performers)'
    ],
    eligibility: [
      'Beginner friendly - open to students and aspiring developers',
      'Must maintain at least 70% attendance',
      'Mandatory submission of both minor and major project work',
      'Must follow student program guidelines'
    ],
    project_links: [
      { label: 'Ujjwalit Technologies', url: 'https://ujjwalit.co.in' },
      { label: 'Verify Registry', url: 'https://verify.ujjwalit.co.in' }
    ],
  },
  {
    id: 'fallback-full-stack-ai',
    slug: 'full-stack-ai-internship',
    type: 'internship',
    title: 'Full Stack + AI Engineering Cohort',
    short_title: 'Full Stack AI',
    tagline: 'Ship full-stack features and learn how AI APIs fit into real products.',
    description: 'An advanced software track for participants ready to connect databases, serverless code engines, AI model endpoints, cryptographically checked document systems, and production pipelines.',
    details_markdown: `## Program Structure
- **Duration**: 8 Weeks
- **Sessions**: 3 Sessions per Week (2 Hours per Session)
- **Format**: 100% Remote / Online`,
    status: 'open',
    visibility: 'public',
    price_inr: 499,
    stipend_label: 'Not Applicable',
    duration_label: '8 Weeks',
    location_label: 'Remote',
    cohort_label: 'AI Cohort 2026',
    starts_on: null,
    ends_on: null,
    apply_by: null,
    capacity: 60,
    display_order: 20,
    accent: 'orange',
    cover_image_url: null,
    features: [
      'Next.js Server Actions & Route Handlers',
      'AI Integration (Gemini & OpenAI API structures)',
      'Relational Database Modeling (Supabase SQL / schemas)',
      'Cryptographic Hashing & Registry Logs',
      'Vercel Serverless Hosting Pipelines'
    ],
    outcomes: [
      'Enterprise Capstone Project',
      'QR-verifiable verification certificate (Registry logged)',
      'Plagiarism-free code portfolio uploaded to GitHub',
      'Letter of Recommendation & prioritized hiring pipeline'
    ],
    eligibility: [
      'Familiar with HTML/CSS and JavaScript loops/promises',
      'Must maintain at least 70% attendance',
      'Must submit the required Capstone code repository',
      'Completed at least one clean frontend web project'
    ],
    project_links: [
      { label: 'Ujjwalit Technologies', url: 'https://ujjwalit.co.in' },
      { label: 'Verify Registry', url: 'https://verify.ujjwalit.co.in' }
    ],
  },
];

export function normalizeOpportunity(row: any): Opportunity {
  return {
    ...row,
    features: Array.isArray(row.features) ? row.features : [],
    outcomes: Array.isArray(row.outcomes) ? row.outcomes : [],
    eligibility: Array.isArray(row.eligibility) ? row.eligibility : [],
    project_links: Array.isArray(row.project_links) ? row.project_links : [],
  };
}

export function formatFee(price: number) {
  return price > 0 ? `₹${price.toLocaleString('en-IN')}` : 'Free';
}

