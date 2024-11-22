// eslint-disable-next-line simple-import-sort/imports
import {ArrowDownTrayIcon, CalendarIcon, FlagIcon, MapIcon, SparklesIcon} from '@heroicons/react/24/outline';

// eslint-disable-next-line simple-import-sort/imports
import {FaTelegramPlane} from 'react-icons/fa';

import GithubIcon from '../components/Icon/GithubIcon';
import InstagramIcon from '../components/Icon/InstagramIcon';
import LinkedInIcon from '../components/Icon/LinkedInIcon';
import TwitterIcon from '../components/Icon/TwitterIcon';

import heroImage from '../images/background-2.jpg';
import porfolioImage2 from '../images/portfolio/joi.jpg';
import porfolioImage3 from '../images/portfolio/uzchess-bots.jpg';
import porfolioImage4 from '../images/portfolio/flappybird.png';
import porfolioImage5 from '../images/portfolio/currecny-converter.png';
import profilepic from '../images/profile-pic.jpg';

import {
  About,
  ContactSection,
  ContactType,
  Hero,
  HomepageMeta,
  PortfolioItem,
  SkillGroup,
  Social,
  TestimonialSection,
  TimelineItem,
} from './dataDef';

/**
 * Page meta data
 */
export const homePageMeta: HomepageMeta = {
  title: "Navfal's Nebula",
  description: "Navfal's personal webpage",
};

/**
 * Section definition
 */
export const SectionId = {
  Hero: 'hero',
  About: 'about',
  Contact: 'contact',
  Portfolio: 'portfolio',
  Resume: 'resume',
  Skills: 'skills',
  Stats: 'stats',
  Testimonials: 'testimonials',
} as const;

export type SectionId = (typeof SectionId)[keyof typeof SectionId];

/**
 * Hero section
 */
export const heroData: Hero = {
  imageSrc: heroImage,
  name: <span style={{fontSize: '55px'}}>I'm Navfal Makhfuzullaev</span>,
  // name: `I'm Navfal Makhfuzullaev.`,
  description: (
    <>
      <p className="prose-sm text-stone-200 sm:prose-base lg:prose-lg">
        I'm a student at <strong className="text-stone-100">Inha University in Tashkent</strong>, majoring in Computer
        Science. My primary focus and Interests are Machine Learning and Space Exploration.
      </p>
      <p className="prose-sm text-stone-200 sm:prose-base lg:prose-lg">
        In my free time time, I like to <strong className="text-stone-100">Volunteer</strong> in the events,{' '}
        <strong className="text-stone-100">Running</strong> and to watch{' '}
        <strong className="text-stone-100">Amine</strong>.
      </p>
    </>
  ),
  actions: [
    {
      href: 'https://drive.google.com/file/d/1FIDri7RKfwO0KS1k7jIJ8ca9zFF8Rz0u/view?usp=sharing',
      text: 'Resume',
      primary: true,
      Icon: ArrowDownTrayIcon,
    },
    {
      href: `#${SectionId.Contact}`,
      text: 'Contact',
      primary: false,
    },
  ],
};

/*
 *  Calculating age
 */

const birthDate = new Date('2004-04-11');
const currentAge =
  new Date().getFullYear() -
  birthDate.getFullYear() -
  (new Date().getMonth() < birthDate.getMonth() ||
  (new Date().getMonth() === birthDate.getMonth() && new Date().getDate() < birthDate.getDate())
    ? 1
    : 0);

/**
 * About section
 */
export const aboutData: About = {
  profileImageSrc: profilepic,
  description: `Hello Crew! I'm Navfal Makhfuzullaev a senior student at Inha University in Tashkent`,
  aboutItems: [
    {label: 'Location', text: 'Uzbekistan, Fergana', Icon: MapIcon},
    {label: 'Age', text: `${currentAge}`, Icon: CalendarIcon},
    {label: 'Nationality', text: 'Uzbek', Icon: FlagIcon},
    {label: 'Interests', text: 'Space, Piano, Hiking, Traveling', Icon: SparklesIcon},
    //   {label: 'Study', text: (
    //       <a
    //         href='https://inha.uz/'
    //         target='_blank'
    //         rel='noopenner noreferrer'
    //       >
    //         Inha University in Tashkent
    //       </a>
    //     ), Icon: AcademicCapIcon},
    //   {label: 'Employment', text: 'Instant Domains, inc.', Icon: BuildingOffice2Icon},
  ],
};

/**
 * Skills section
 */
export const skills: SkillGroup[] = [
  {
    text: (
      <p>
        <b style={{fontWeight: '700'}}>Skills:</b> Python, Managing Databases (MySQL, PostgreSQL), Deep learning,
        TensorFlow, OpenCV, Matplotlip, Scikit-learn, Numpy, Machine Learning, Pandas, Scipy
      </p>
    ),
  },
  {
    text: (
      <p>
        <b style={{fontWeight: '700'}}>Developer Tools:</b> Git, Visual Studio, PyCharm, Linux, LateX, Tableau
      </p>
    ),
  },
];

/**
 * Portfolio section
 */
export const portfolioItems: PortfolioItem[] = [
  {
    title: 'Joi - voice assistant',
    description: 'A Simple personal voice assistant. Voice assistant that can handle some automations in the PC.',
    url: 'https://github.com/Navfalbek/Joi-assistant',
    image: porfolioImage2,
  },
  {
    title: 'My personal website',
    description: 'Give a short description of your project here.',
    url: 'https://reactresume.com',
    image: porfolioImage2,
  },
  {
    title: 'UzChess Bots',
    description: 'Chess bots of Uzbek Grandmasters implemented to UzChess platform.',
    url: 'https://play.google.com/store/search?q=uzchess&c=apps&hl=en',
    image: porfolioImage3,
  },
  {
    title: 'Deep learning project - Flappybird',
    description: 'Flappybird game trained with Deep Q-learning algorithm.',
    url: 'https://github.com/Navfalbek/dlcv',
    image: porfolioImage4,
  },
  {
    title: 'Currency converter',
    description: 'Currency converter app which contains more than 180+ real time currency rates.',
    url: 'https://github.com/Navfalbek/currency-converter',
    image: porfolioImage5,
  },
];

/**
 * Resume section -- TODO: Standardize resume contact format or offer MDX
 */
export const education: TimelineItem[] = [
  {
    date: 'Sep 2021 - May 2025',
    location: 'Tashkent, Uzbekistan',
    title: 'Inha University in Tashkent',
    content: (
      <>
        <strong style={{fontWeight: '700'}}>Bachelor of Science in Information and Communicatio Engineering</strong>
        <p>
          <i style={{fontWeight: '500'}}>Activities: </i>Inha University (Korea) Summer School program, Lecturer and
          Instructor at Continuing Education Center. Assistant at Student Support Center. Volunter at Google Developers
          Group Tashkent. Huawei MECA Seeds for the Future.
        </p>
      </>
    ),
  },
];

export const experience: TimelineItem[] = [
  {
    date: 'June 2024 - Aug 2024',
    location: 'GlobalMove',
    title: 'Software Engineer Intern',
    content: (
      <>
        <p>
          <b style={{fontWeight: '600'}}>Project: </b> UzChess Academy
        </p>
        <p>
          Created 15+ Chess bots of Grandmasters by analyzing their game data from lichess.org and chess.com platforms
          that play with their strategies. Also, created a chess bot opening books to integrate with chess engines.
        </p>
        <p>
          Worked with a database of chess puzzles. Parsed (FEN to PGN) and added 21000+ chess puzzles into UzChess
          platform.
        </p>
      </>
    ),
  },
  {
    date: 'Feb 2024 - May 2024',
    location: 'Mutolaa',
    title: 'ML engineer intern',
    content: (
      <>
        <p>
          Worked with voice synthesizing of Voice actors using Appleo platform and connecting it with OpenAi’s API for
          creating Uzbek TTS (Text-to-Speech) to reduce audiobook creation time.
        </p>
        <p>
          Cleaned raw data of audio actors from different noises to make the data more trainable for voice synthesizing.
        </p>
      </>
    ),
  },
];

/**
 * Testimonial section
 */
export const testimonial: TestimonialSection = {
  imageSrc: heroImage,
  testimonials: [
    {
      name: 'John Doe',
      text: 'Use this as an opportunity to promote what it is like to work with you. High value testimonials include ones from current or past co-workers, managers, or from happy clients.',
      image: 'https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/169.jpg',
    },
    {
      name: 'Jane Doe',
      text: 'Here you should write some nice things that someone has said about you. Encourage them to be specific and include important details (notes about a project you were on together, impressive quality produced, etc).',
      image: 'https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/14.jpg',
    },
    {
      name: 'Someone else',
      text: 'Add several of these, and keep them as fresh as possible, but be sure to focus on quality testimonials with strong highlights of your skills/work ethic.',
      image: 'https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/69.jpg',
    },
  ],
};

/**
 * Contact section
 */

export const contact: ContactSection = {
  headerText: 'Get in touch.',
  description: 'Here is a good spot for a message to your readers to let them know how best to reach out to you.',
  items: [
    {
      type: ContactType.Email,
      text: 'navfalbek.uz@gmail.com',
      href: 'mailto:navfalbek.uz@gmail.com',
    },
    {
      type: ContactType.Location,
      text: 'Uzbekistan, Fergana',
      href: 'https://www.google.com/maps/place/Fergana,+Fergana+Region,+Uzbekistan/@40.3798328,71.7491761,13z/data=!3m1!4b1!4m6!3m5!1s0x38bb83431937abc5:0xcfa4d876b34e7bbc!8m2!3d40.3733802!4d71.7978333!16zL20vMDQ0aGIy?entry=ttu&g_ep=EgoyMDI0MTExMy4xIKXMDSoASAFQAw%3D%3D',
    },
    {
      type: ContactType.Instagram,
      text: '@navfalbek.m',
      href: 'https://www.instagram.com/navfalbek.m/',
    },
    {
      type: ContactType.Github,
      text: 'Navfalbek',
      href: 'https://github.com/Navfalbek',
    },
  ],
};

/**
 * Social items
 */
export const socialLinks: Social[] = [
  {label: 'Github', Icon: GithubIcon, href: 'https://github.com/Navfalbek'},
  {label: 'LinkedIn', Icon: LinkedInIcon, href: 'https://www.linkedin.com/in/navfalbek/'},
  {label: 'Telegram', Icon: FaTelegramPlane, href: 'https://t.me/navfalbekm'},
  {label: 'Instagram', Icon: InstagramIcon, href: 'https://www.instagram.com/navfalbek.m/'},
  {label: 'Twitter', Icon: TwitterIcon, href: 'https://x.com/mnavfalbek'},
];
