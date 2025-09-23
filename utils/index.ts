import { PersonalInfo } from "../agent/types.js";

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
});