import { PersonalInfo } from "../agent/types.js";
const projects =  [
  {
        title: "Boost",
        description: "Boost is an app that revolutionizes car rentals, providing innovative solutions for seamless mobility",
        skills: ["Nuxt", "vue3", "TailwindCSS", "GSAP", 'Dashboard'],
        url: "https://boostco.net/"
    },
    {
        title: "Zinex",
        description: "Zinex is an all-in-one platform for seamless gift card trading, crypto asset management, and quick airtime/data purchases.",
        skills: ["Nuxt", "vue3", "TailwindCSS", "GSAP"],
        url: "https://zinex.ng/"
    },
    {
        title: "BoostMySocial",
        description: "BoostMySocial is a platform that helps you grow your social media presence by providing real followers, likes, and comments.",
        skills: ["Nuxt", "vue3", "TailwindCSS", "GSAP"],
        url: "https://boost-my-social.vercel.app/"
    },
    {
        title: "Stonkas",
        description: "Stonkers is a web 3 platform that rewards people for tweeting positive tweets about stonkerss. ",
        skills: ["Nuxt", "vue3", "TailwindCSS", "GSAP"],
        url: "https://stonkers.gg/"
    },
    {
        title: "AskYourTelegram",
        description: "AskYourTelegram is an app that helps discover instant answers, seamless connections, and personalized recommendations to revolutionize your knowledge journey.",
        skills: ["Nuxt", "vue3", "TailwindCSS", "GSAP"],
        url: "https://www.askyourtelegram.com/"
    },
    {
        title: "Digital Purse",
        description: "Digital Purse is an app that redefines the way you make transactions. With complete anonymity and no need for KYC verification, it offers smooth, secure, and private payments at your fingertips.",
        skills: ["Nuxt", "vue3", "TailwindCSS", "GSAP"],
        url: "https://digital-purse.vercel.app/"
    },
    {
        title: "Hiree Server",
        description: "Hiree is a web app for developers looking for jobs and employers looking for developers.",
        skills: ["Nodejs", "Express", "HaperDB", "JWT", "Bcrypt", "Nodemailer", "Sendgrid", "Heroku"],
        github: "https://github.com/classyrazy/hiree-server"
    },
    {
        title: "Abinibi",
        description: "an online clothing store that blends African heritage with modern fashion, offering vibrant collections for men, women, and children.",
        skills: ["TailwindCSS", "Typescript", "Vue3", "Nuxt3", "Nodejs"],
        url: "https://abinibi.shop/"
    },
    {
        title: "Hiree",
        description: "Hiree is a web app for developers looking for jobs and employers looking for developers.",
        skills: ["TailwindCSS", "Typescript", "Vue3", "Nuxt"],
        github: "https://github.com/classyrazy/hiree",
        url: "https://hiree.vercel.app/"
    },
    {
        title: "Avanda Docs",
        description: "Documentation for a nodejs backend framework Avanda",
        skills: ["TailwindCSS", "Typescript", "Vue3", "Nuxt", "Nuxt Content", "Markdown"],
        github: "https://github.com/avandajs/docs",
        url: "https://avanda-docs.vercel.app/"
    },
    {
        title: "Kiakia",
        description: "Web for kiakia app",
        skills: ["SASS(parrot css)", "Typescript", "Nuxt"],
        url: "https://kiakia.africa/"
    },
    {
        title: "Corep",
        description: 'Corep is a web app for university students giving them real-time update about their courses Still in progress',
        skills: ["SASS(parrot css)", "Vue3", "Nuxt 3", "Nodejs", "Avanda", "Typescript"],
        url: "https://corep.ng/",
        github: "https://github.com/classyrazy/corep-dashboard-user/tree/develop"
    },
    {
        title: "Contact App",
        description: 'A localStorage based contact app that enable you to contact saved numbers by call and whatApp',
        skills: ["HTML", "CSS", "Vanilla JS"],
        url: "https://contact-app-new.netlify.app/",
        github: "https://github.com/classyrazy/contact-App"
    },
      {
        title: "Billpoint",
        description: "Billpoint is an app that allows you to pay your electricity, internet, and other utility bills quickly and easily from the palm of your hand.",
        skills: ["Nuxt3", "vue3", "TailwindCSS", "GSAP", 'Dashboard'],
        url: "https://app.billpoint.co/"
    },
      {
        title: "Bitshop",
        description: "Bitshop is an app that allows you to send cryptocurrency to your friends and family",
        skills: ["Nuxt", "vue3", "TailwindCSS", "GSAP", 'Dashboard'],
        url: "https://app.bitshop.ng/"
    },
    {
        title: "Zuri ChatApp",
        description: 'A simple chat app to chat with people just by sending them an invite',
        skills: ["HTML", "CSS", "Vanilla JS", "Nodejs", "Socket.io"],
        url: "https://zuri-chat-app-by-classydev.herokuapp.com/",
        github: "https://github.com/classyrazy/chat-app-zuri"
    },
    // give some projects with react
    {
        title: "Movie App",
        description: 'A simple movie app that allows you to search for movies and see their details',
        skills: ["React", "CSS", "TMDB API"],
        url: "https://movie-app-by-classydev.netlify.app/",
        github: "https://github.com/classyrazy/movie-app"
    },
]
export const getPersonalInfoFromEnv = (): PersonalInfo => ({
  firstName: process.env.APPLICANT_FIRST_NAME || 'John',
  lastName: process.env.APPLICANT_LAST_NAME || 'Doe',
  email: process.env.APPLICANT_EMAIL || 'john.doe@example.com',
  phone: process.env.APPLICANT_PHONE || '+2349019441762',
  linkedinUrl: process.env.APPLICANT_LINKEDIN || 'https://linkedin.com/in/johndoe',
  resumePath: process.env.RESUME_PATH,
  countryCode: process.env.APPLICANT_COUNTRY_CODE || '+234',
  country: process.env.APPLICANT_COUNTRY || 'Nigeria',
  phoneWithoutCountryCode: process.env.APPLICANT_PHONE_WITHOUT_COUNTRY_CODE || '9019441762',
  city: process.env.APPLICANT_CITY || 'Lagos',
  experienceLevel: process.env.APPLICANT_EXPERIENCE_LEVEL || 'Mid-level',
  educationLevel: process.env.APPLICANT_EDUCATION_LEVEL || 'Bachelor\'s Degree',
  skills: process.env.APPLICANT_SKILLS ? process.env.APPLICANT_SKILLS.split(',').map(s => s.trim()) : ['JavaScript', 'TypeScript', 'Node.js'],
  portfolioUrl: process.env.APPLICANT_PORTFOLIO_URL || 'https://classydev.me',
  githubUrl: process.env.APPLICANT_GITHUB_URL || 'https://github.com/classyrazy',
  projects: JSON.stringify(projects),
  salaryRangeUsd: process.env.APPLICANT_SALARY_RANGE || '$50,000 - $70,000',
  salaryRangeNaira: process.env.APPLICANT_SALARY_RANGE_NAIRA || '₦800,0000 - ₦1,200,0000',

});

