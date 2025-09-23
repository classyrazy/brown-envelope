export interface Job {
  job_title: string;
  company_name: string;
  job_url: string;
  application_status?: string;
  date_applied?: string;
  notes?: string;
}

export interface JobApplicationResult {
  success: boolean;
  shouldRetry: boolean;
}
export interface formPageAnalysis {
  description: string;
  method: string;
  arguments: string[];
  selectors: string;
}

export interface PageExtraction {
  pageType: 'job_detail' | 'application_form' | 'signin_page' | 'job_not_found' | 'other';
  details: string;
}

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  resumePath?: string;
  countryCode?: string;
  country?: string;
  phoneWithoutCountryCode?: string;
}

