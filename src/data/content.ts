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
  /** When present the value is rendered as a link. */
  href?: string;
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
  /** Where the card links to — repo, store listing or paper. */
  url: string;
  /** What sits behind that link, shown on the hover overlay. */
  linkLabel: string;
  /** Screenshot in /public/projects. */
  image: string;
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
  { label: 'GITHUB ↗', href: 'https://github.com/Navfalbek', external: true },
  { label: 'LINKEDIN ↗', href: 'https://www.linkedin.com/in/navfalbek/', external: true },
  { label: 'TELEGRAM ↗', href: 'https://t.me/navfalbekm', external: true },
  { label: 'INSTAGRAM ↗', href: 'https://www.instagram.com/navfalbek.m/', external: true },
  { label: 'X ↗', href: 'https://x.com/mnavfalbek', external: true },
];

export const email = 'navfalbek.uz@gmail.com';

/** Canonical origin — used for structured data and share cards. */
export const siteUrl = 'https://navfalbek.github.io';

/** Résumé PDF (Google Drive). */
export const resumeUrl =
  'https://drive.google.com/file/d/1xpEAqeJhp5To0iibzZrUYkxAVniT2OUo/view?usp=sharing';

export const locationLabel = 'Fergana, Uzbekistan';
export const locationUrl =
  'https://www.google.com/maps/place/Fergana,+Fergana+Region,+Uzbekistan/@40.3798328,71.7491761,13z';

const BIRTH_DATE = new Date('2004-04-11');

/** Age in whole years, so the About panel never goes stale. */
function currentAge(now = new Date()): number {
  let age = now.getFullYear() - BIRTH_DATE.getFullYear();
  const beforeBirthday =
    now.getMonth() < BIRTH_DATE.getMonth() ||
    (now.getMonth() === BIRTH_DATE.getMonth() && now.getDate() < BIRTH_DATE.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export const facts: Fact[] = [
  { label: 'Location', value: locationLabel, href: locationUrl },
  { label: 'Age', value: String(currentAge()) },
  {
    label: 'Currently',
    value: 'Data Analyst · preparing for an M.Sc. in Computer Science',
  },
  { label: 'Interests', value: 'Space · Piano · Violin · Hiking · Running · Anime · Traveling' },
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
    url: 'https://github.com/Navfalbek/Joi-assistant',
    linkLabel: 'VIEW ON GITHUB',
    image: '/projects/joi.webp',
  },
  {
    name: 'Personal Website',
    shortTag: 'WEB',
    description: 'My personal résumé site — the origin point this very page grew from.',
    url: 'https://github.com/Navfalbek/navfalbek.github.io',
    linkLabel: 'VIEW ON GITHUB',
    image: '/projects/website.webp',
  },
  {
    name: 'UzChess Bots',
    shortTag: 'PYTHON · DATA',
    description: 'Chess bots modeled on Uzbek Grandmasters, integrated into the UzChess platform.',
    url: 'https://play.google.com/store/search?q=uzchess&c=apps&hl=en',
    linkLabel: 'VIEW ON GOOGLE PLAY',
    image: '/projects/uzchess-bots.webp',
  },
  {
    name: 'Flappy Bird — Deep RL',
    shortTag: 'TENSORFLOW · RL',
    description: 'A Flappy Bird agent that learns to fly using a Deep Q-Learning network.',
    url: 'https://github.com/Navfalbek/dlcv',
    linkLabel: 'VIEW ON GITHUB',
    image: '/projects/flappybird.webp',
  },
  {
    name: 'Currency Converter',
    shortTag: 'APP · API',
    description: 'Real-time currency converter covering 180+ live exchange rates.',
    url: 'https://github.com/Navfalbek/currency-converter',
    linkLabel: 'VIEW ON GITHUB',
    image: '/projects/currency-converter.webp',
  },
  {
    name: 'Air Quality Management',
    shortTag: 'RESEARCH · ML',
    description:
      'A comprehensive study of air-quality forecasting — modeling, data assimilation, and ML techniques.',
    url: 'https://drive.google.com/file/d/10JwOjHy8pQwWt4sIfuqaJvIqUXq1UY9c/view?usp=sharing',
    linkLabel: 'READ THE PAPER',
    image: '/projects/air-quality.webp',
  },
];

export const testimonials: Testimonial[] = [
  {
    quote:
      'Navfal is a great partner to work with. We worked with him in several projects in the university, and he always was one of the most active students contributed to the project. He is responsible and has a strict discipline.',
    name: 'Shokhrukh Rustamov',
    role: 'Project partner · Inha University',
  },
  {
    quote:
      'Navfal is an incredibly curious individual who approaches every goal with determination and persistence.',
    name: 'Elbek Davron',
    role: 'Friend & colleague',
  },
];
