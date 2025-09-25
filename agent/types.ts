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
  message?: string;
  fieldsFilled?: string[];
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
  city?: string;
  [key: string]: any;
}

export interface JobProcessingResult {
  jobName: string;
  jobLink: string;
  status: 'success' | 'failed' | 'skipped' | 'error';
  imageOfLastContact: string;
  description: string;
  successMessage: string;
  fieldsFilled: string[];
  errorMessage: string;
  processingTimeMs: number;
  startTime: string;
  endTime: string;
}

