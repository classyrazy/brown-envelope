import { getPersonalInfoFromEnv } from '../../utils/index.js';

export interface FieldMapping {
    keywords: string[];
    value: string;
    label: string;
    instruction: string;
}
export const useApplierFiller = () => {
    const info = getPersonalInfoFromEnv();
    const fieldMappings = [
    {
      keywords: ['first name', 'firstname', 'given name'],
      value: info.firstName,
      label: 'First Name',
      instruction: `Fill in the first name field with "${info.firstName}"`
    },
    {
      keywords: ['last name', 'lastname', 'surname', 'family name'],
      value: info.lastName,
      label: 'Last Name',
      instruction: `Fill in the last name field with "${info.lastName}"`
    },
    {
      keywords: ['email', 'e-mail', 'email address'],
      value: info.email,
      label: 'Email',
      instruction: `Fill in the email field with "${info.email}"`
    },
    {
      keywords: ['phone', 'telephone', 'mobile', 'cell'],
      value: info.phone,
      label: 'Phone Number',
      instruction: `Fill in the phone number field with "${info.phone}". 
        If there's a country code dropdown and it is not set to ${info.countryCode}, 
        select the appropriate country code first.
        Then fill the phone number field with ${info.phoneWithoutCountryCode}.
        If the field doesn't accept the country code, try the full number ${info.phone}`
    },
    {
      keywords: ['linkedin', 'linkedin url', 'linkedin profile'],
      value: info.linkedinUrl,
      label: 'LinkedIn URL',
      instruction: `Fill in the LinkedIn URL field with "${info.linkedinUrl}"`
    },
    {
      keywords: ['country', 'nationality'],
      value: info.country,
      label: 'Country',
      instruction: `Fill in the country field with "${info.country}"`
    },
    {
      keywords: ['city', 'location', 'current city'],
      value: info.city || 'Your City',
      label: 'City',
      instruction: `Fill in the city field with "${info.city || 'Your City'}"`
    },
    // salary related fields
    {
      keywords: ['salary', 'expected salary', 'desired salary', 'salary expectation'],
      value: info.salaryRangeNaira || '',
      label: 'Expected Salary',
      instruction: `Fill in the expected salary field with "${info.salaryRangeUsd}" or "${info.salaryRangeNaira}" based on the country mentioned in the job description.`
    },
    // github and portfolio,  experienceLevel, educationLevel, skills, projects
    {
      keywords: ['github', 'github url', 'github profile'],
      value: info.githubUrl,
      label: 'GitHub URL',
      instruction: `Fill in the GitHub URL field with "${info.githubUrl}"`
    },
    {
      keywords: ['portfolio', 'portfolio url', 'portfolio website'],
      value: info.portfolioUrl,
      label: 'Portfolio URL',
      instruction: `Fill in the portfolio URL field with "${info.portfolioUrl}"`
    },
    {
      keywords: ['experience', 'experience level', 'years of experience'],
      value: info.experienceLevel || 'Mid-level',
      label: 'Experience Level',
      instruction: `Fill in the experience level field with "${info.experienceLevel || 'Mid-level'}"`
    },
    {
      keywords: ['education', 'education level', 'highest qualification'],
      value: info.educationLevel || "Bachelor's Degree",
      label: 'Education Level',
      instruction: `Fill in the education level field with "${info.educationLevel || "Bachelor's Degree"}"`
    },
    {
      keywords: ['skills', 'technical skills', 'relevant skills'],
      value: info.skills ? info.skills.join(', ') : 'JavaScript, TypeScript, Node.js',
      label: 'Skills',
      instruction: `Fill in the skills field with "${info.skills ? info.skills.join(', ') : 'JavaScript, TypeScript, Node.js'}"`
    },
    {
      keywords: ['projects', 'notable projects', 'personal projects'],
      value: info.projects ? JSON.parse(info.projects).map((p: any) => p.title).join(', ') : 'Project A, Project B',
      label: 'Projects',
      instruction: `Fill in the projects field with "${info.projects ? JSON.parse(info.projects).map((p: any) => p.title).join(', ') : 'Project A, Project B'}". 
        If there's a larger text area, you can provide more details about a project that fits the job description.
        `
    },
  ];

  return { fieldMappings };
}