export interface NavSection {
  id: string;
  label: string;
}

export interface SocialLink {
  label: string;
  href: string;
  external: boolean;
}

export interface Fact {
  label: string;
  value: string;
}

export interface TimelineEntry {
  date: string;
  title: string;
  org: string;
  detail?: string;
  points?: string[];
}

export interface Project {
  name: string;
  shortTag: string;
  description: string;
}

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
}

/** Sections used by the nav bar and the right-hand dot rail. */
export const sections: NavSection[] = [
  { id: 'about', label: 'About' },
  { id: 'resume', label: 'Resume' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'testimonials', label: 'Testimonials' },
  { id: 'contact', label: 'Contact' },
];

export const socials: SocialLink[] = [
  { label: 'EMAIL ↗', href: 'mailto:navfalbek.uz@gmail.com', external: false },
  { label: 'LINKEDIN ↗', href: 'https://www.linkedin.com/in/navfalbek/', external: true },
  { label: 'INSTAGRAM ↗', href: 'https://www.instagram.com/navfalbek.m/', external: true },
  { label: 'X ↗', href: 'https://x.com/mnavfalbek', external: true },
];

export const email = 'navfalbek.uz@gmail.com';

export const facts: Fact[] = [
  { label: 'Location', value: 'Fergana, Uzbekistan' },
  { label: 'Age', value: '22' },
  { label: 'Currently', value: 'Preparing for an M.Sc. in Computer Science' },
  { label: 'Interests', value: 'Space · Piano · Hiking · Traveling' },
];

export const education: TimelineEntry[] = [
  {
    date: 'Sep 2021 — May 2025',
    title: 'B.Sc. in Information & Communication Engineering',
    org: 'Inha University in Tashkent · Tashkent, Uzbekistan',
    detail:
      'Inha University (Korea) Summer School · Lecturer & Instructor, Continuing Education Center · Assistant, Student Support Center · Volunteer, Google Developers Group Tashkent · Huawei MECA Seeds for the Future.',
  },
  {
    date: 'Feb 2025 — Jul 2025',
    title: 'B.Eng. in Electrical Engineering & IT — Exchange',
    org: 'University of Žilina · Žilina, Slovakia',
    detail:
      'National Scholarship Programme of the Slovak Republic. Courses: Multimedia Signals Distribution, IoT, Biomedical Image Processing, Robotic Systems, Control Systems.',
  },
];

export const experience: TimelineEntry[] = [
  {
    date: '2025 — Present',
    title: 'Data Analyst',
    org: 'National Statistics Committee of Uzbekistan',
    points: ['Working with national-scale datasets to support statistical analysis and reporting.'],
  },
  {
    date: 'Jun 2024 — Aug 2024',
    title: 'Software Engineer Intern',
    org: 'GlobalMove — UzChess Academy',
    points: [
      'Built 15+ chess bots emulating Grandmasters from lichess.org and chess.com game data.',
      'Developed engine opening books for integration with chess engines.',
      'Parsed FEN→PGN and added 21,000+ puzzles to the UzChess platform.',
    ],
  },
  {
    date: 'Feb 2024 — May 2024',
    title: 'ML Engineer Intern',
    org: 'Mutolaa',
    points: [
      'Built Uzbek TTS by voice-synthesizing voice actors (Appleo + OpenAI API) to cut audiobook production time.',
      'Cleaned noisy raw audio data to make it trainable for voice synthesis.',
    ],
  },
];

export const skills: string[] = [
  'Python',
  'Machine Learning',
  'Deep Learning',
  'TensorFlow',
  'Scikit-learn',
  'OpenCV',
  'NumPy',
  'Pandas',
  'SciPy',
  'Matplotlib',
  'MySQL',
  'PostgreSQL',
];

export const tools: string[] = [
  'Git',
  'Visual Studio',
  'PyCharm',
  'DataGrip',
  'Linux',
  'LaTeX',
  'Tableau',
];

export const projects: Project[] = [
  {
    name: 'Personal Assistant "Joi"',
    shortTag: 'PYTHON · VOICE',
    description: 'A lightweight personal voice assistant that handles everyday automations on your PC.',
  },
  {
    name: 'Personal Website',
    shortTag: 'WEB',
    description: 'My personal résumé site — the origin point this very page grew from.',
  },
  {
    name: 'UzChess Bots',
    shortTag: 'PYTHON · DATA',
    description: 'Chess bots modeled on Uzbek Grandmasters, integrated into the UzChess platform.',
  },
  {
    name: 'Flappy Bird — Deep RL',
    shortTag: 'TENSORFLOW · RL',
    description: 'A Flappy Bird agent that learns to fly using a Deep Q-Learning network.',
  },
  {
    name: 'Currency Converter',
    shortTag: 'APP · API',
    description: 'Real-time currency converter covering 180+ live exchange rates.',
  },
  {
    name: 'Air Quality Management',
    shortTag: 'RESEARCH · ML',
    description:
      'A comprehensive study of air-quality forecasting — modeling, data assimilation, and ML techniques.',
  },
];

export const testimonials: Testimonial[] = [
  {
    quote:
      'Add a recommendation here — a mentor, teammate, or colleague describing what it was like to work with you.',
    name: 'Your reference',
    role: 'Title · Company',
  },
  {
    quote:
      'A second short quote can sit here. Keep it focused on impact, collaboration, or a specific win.',
    name: 'Your reference',
    role: 'Title · Company',
  },
  {
    quote:
      'And a third. Three balanced cards read best — swap this copy for the real words when you have them.',
    name: 'Your reference',
    role: 'Title · Company',
  },
];
