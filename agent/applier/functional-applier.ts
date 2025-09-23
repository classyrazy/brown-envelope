import { extractJobDetailRules } from './rules.js';
import { Job, JobApplicationResult, PersonalInfo, getPersonalInfoFromEnv } from '../types.js';

export interface JobApplierContext {
  page: any;
  maxRetries?: number;
}

export const processJobApplication = async (
  context: JobApplierContext, 
  job: Job
): Promise<void> => {
  const { page, maxRetries = 2 } = context;
  let currentRetry = 0;
  
  while (currentRetry <= maxRetries) {
    try {
      console.log(`📍 Navigating to: ${job.job_url}`);
      await page.goto(job.job_url);
      
      const initialExtraction = await page.extract(extractJobDetailRules) as { extraction: string };
      console.log(`🔍 Initial page analysis:`, initialExtraction);
      
      const result = await handlePageType(context, initialExtraction.extraction, job);
      
      if (result.success) {
        console.log(`✅ Successfully processed job: ${job.job_title}`);
        break;
      } else if (result.shouldRetry && currentRetry < maxRetries) {
        console.log(`🔄 Retrying... (${currentRetry + 1}/${maxRetries})`);
        currentRetry++;
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.log(`⏭️ Skipping job after ${currentRetry + 1} attempts`);
        break;
      }
    } catch (error) {
      console.error(`Error in attempt ${currentRetry + 1}:`, error);
      currentRetry++;
      if (currentRetry > maxRetries) throw error;
    }
  }
};

const handlePageType = async (
  context: JobApplierContext, 
  extract: string, 
  job: Job
): Promise<JobApplicationResult> => {
  const { page } = context;
  let extraction = JSON.parse(extract);
  
  // Handle non-English content first
  if (extraction.details.toLowerCase().includes('translate') || 
      extraction.details.toLowerCase().includes('language')) {
    console.log('🌐 Non-English content detected, attempting translation...');
    try {
      await page.act("Click on Google Translate or language selector to translate to English");
      const reExtraction = await page.extract(extractJobDetailRules) as { extraction: string };
      extraction = JSON.parse(reExtraction.extraction);
      console.log(`🔍 Post-translation analysis:`, extraction);
    } catch (error) {
      console.log('⚠️ Translation failed, continuing with original content');
    }
  }

  const handlers: Record<string, (context: JobApplierContext, job: Job, extraction?: any) => Promise<JobApplicationResult>> = {
    job_not_found: handleJobNotFound,
    signin_page: handleSignInPage,
    job_detail: handleJobDetailPage,
    application_form: handleApplicationForm,
  };

  const handler = handlers[extraction.pageType] || handleUnknownPage;
  return handler(context, job, extraction);
};

const handleJobNotFound = async (context: JobApplierContext, job: Job): Promise<JobApplicationResult> => {
  const { page } = context;
  console.log(`❌ Job not found or expired: ${job.job_title}`);
  await page.screenshot({ path: `job_not_found_${job.company_name.replace(/\s+/g, '_')}.png` });
  return { success: false, shouldRetry: false };
};

const handleSignInPage = async (context: JobApplierContext, job: Job): Promise<JobApplicationResult> => {
  const { page } = context;
  console.log('🔐 Sign-in required, attempting LinkedIn SSO...');
  try {
    await page.act("Sign in using LinkedIn SSO or click the LinkedIn login button");
    await new Promise(resolve => setTimeout(resolve, 3000));
    const postSignInExtraction = await page.extract(extractJobDetailRules) as { extraction: string };
    return handlePageType(context, postSignInExtraction.extraction, job);
  } catch (error) {
    console.error('🚫 Sign-in failed:', error);
    return { success: false, shouldRetry: true };
  }
};

const handleJobDetailPage = async (context: JobApplierContext, job: Job): Promise<JobApplicationResult> => {
  const { page } = context;
  console.log('📋 Job details page found, looking for Apply button...');
  try {
    await page.act("Click a button that says 'Apply', 'Easy Apply', or 'Apply Now'");
    await new Promise(resolve => setTimeout(resolve, 2000));
    const postApplyExtraction = await page.extract(extractJobDetailRules) as { extraction: string };
    const parsedPostApply = JSON.parse(postApplyExtraction.extraction);
    
    if (parsedPostApply.pageType === 'application_form') {
      return handleApplicationForm(context, job);
    } else {
      return handlePageType(context, postApplyExtraction.extraction, job);
    }
  } catch (error) {
    console.error('🚫 Failed to click Apply button:', error);
    return { success: false, shouldRetry: true };
  }
};

const handleApplicationForm = async (context: JobApplierContext, job: Job): Promise<JobApplicationResult> => {
  const { page } = context;
  console.log('📝 Application form detected');
  try {
    const formAnalysis = await page.observe("What form fields are available?");
    console.log('📋 Form analysis:', formAnalysis);
    
    const fillResult = await fillApplicationForm(context, job);
    
    if (fillResult.success) {
      await page.screenshot({ path: `application_completed_${job.company_name.replace(/\s+/g, '_')}.png` });
      console.log('✅ Application form completed successfully');
      return { success: true, shouldRetry: false };
    } else {
      await page.screenshot({ path: `application_failed_${job.company_name.replace(/\s+/g, '_')}.png` });
      return { success: false, shouldRetry: fillResult.shouldRetry };
    }
  } catch (error) {
    console.error('🚫 Error handling application form:', error);
    await page.screenshot({ path: `application_error_${job.company_name.replace(/\s+/g, '_')}.png` });
    return { success: false, shouldRetry: true };
  }
};

const handleUnknownPage = async (context: JobApplierContext, job: Job, extraction: any): Promise<JobApplicationResult> => {
  const { page } = context;
  console.log(`❓ Unknown page type: ${extraction.pageType}`);
  console.log(`Details: ${extraction.details}`);
  await page.screenshot({ path: `unknown_page_${job.company_name.replace(/\s+/g, '_')}.png` });
  return { success: false, shouldRetry: true };
};

const fillApplicationForm = async (context: JobApplierContext, job: Job): Promise<JobApplicationResult> => {
  try {
    console.log('📝 Starting form fill process...');
    const personalInfo = getPersonalInfoFromEnv();

    await fillBasicInfo(context, personalInfo);
    await uploadResume(context);
    await submitApplication(context);
    
    return { success: true, shouldRetry: false };
  } catch (error) {
    console.error('❌ Error filling application form:', error);
    return { success: false, shouldRetry: true };
  }
};

const fillBasicInfo = async (context: JobApplierContext, info: PersonalInfo): Promise<void> => {
  const { page } = context;
  try {
    await page.act(`Fill in the first name field with "${info.firstName}"`);
    await page.act(`Fill in the last name field with "${info.lastName}"`);
    await page.act(`Fill in the email field with "${info.email}"`);
    await page.act(`Fill in the phone number field with "${info.phone}"`);
    console.log('✅ Basic information filled');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log('⚠️ Some basic fields could not be filled:', errorMessage);
  }
};

const uploadResume = async (context: JobApplierContext): Promise<void> => {
  const { page } = context;
  try {
    const personalInfo = getPersonalInfoFromEnv();
    if (personalInfo.resumePath) {
      await page.act(`Upload the file "${personalInfo.resumePath}" to any file upload field for resume or CV`);
      console.log('✅ Resume uploaded');
    } else {
      console.log('⚠️ No resume path configured in environment variables');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log('⚠️ Resume upload failed:', errorMessage);
  }
};

const submitApplication = async (context: JobApplierContext): Promise<void> => {
  const { page } = context;
  try {
    await page.act("Click the submit button or 'Submit Application' button to complete the application");
    console.log('✅ Application submitted');
    await new Promise(resolve => setTimeout(resolve, 2000));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log('⚠️ Could not submit application automatically:', errorMessage);
    throw error;
  }
};

// Usage:
// const context: JobApplierContext = { page, maxRetries: 3 };
// await processJobApplication(context, job);
