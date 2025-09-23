
import { analyseAndSignInWithDetails, extractJobDetailRules } from './rules.js';
import { formPageAnalysis, Job, JobApplicationResult, PersonalInfo } from '../types.js';
import { getPersonalInfoFromEnv } from '../../utils/index.js';

export class JobApplier {
  private page: any;

  constructor(page: any) {
    this.page = page;
  }

  async processJobApplication(job: Job, maxRetries = 2): Promise<void> {
    let currentRetry = 0;
    
    while (currentRetry <= maxRetries) {
      try {
        console.log(`📍 Navigating to: ${job.job_url}`);
        await this.page.goto(job.job_url);
        
        // First, analyze the page to understand what we're dealing with
        const initialExtraction = await this.page.extract(extractJobDetailRules) as { extraction: string };
        console.log(`🔍 Initial page analysis:`, initialExtraction);
        
        // Handle different page types
        const result = await this.handlePageType(initialExtraction.extraction, job);
        
        if (result.success) {
          console.log(`✅ Successfully processed job: ${job.job_title}`);
          break; // Exit retry loop on success
        } else if (result.shouldRetry && currentRetry < maxRetries) {
          console.log(`🔄 Retrying... (${currentRetry + 1}/${maxRetries})`);
          currentRetry++;
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
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
  }

  private async handlePageType(extract: string, job: Job): Promise<JobApplicationResult> {
    let extraction = JSON.parse(extract);
    
    // Handle non-English content first
    console.log('🌍 Checking for non-English content...', extraction);
    if (extraction.details.toLowerCase().includes('translate') || 
        extraction.details.toLowerCase().includes('language')) {
      console.log('🌐 Non-English content detected, attempting translation...');
      try {
        await this.page.act("Click on Google Translate or language selector to translate to English");
        // Re-analyze after translation
        const reExtraction = await this.page.extract(extractJobDetailRules) as { extraction: string };
        extraction = JSON.parse(reExtraction.extraction);
        console.log(`🔍 Post-translation analysis:`, extraction);
      } catch (error) {
        console.log('⚠️ Translation failed, continuing with original content');
      }
    }

    switch (extraction.pageType) {
      case 'job_not_found':
        return await this.handleJobNotFound(job);

      case 'signin_page':
        if (extraction.details.toLowerCase().includes('linkedin')) {
          console.log('🔐 LinkedIn sign-in detected, attempting LinkedIn SSO...');
          // return await this.handleLinkedInSignIn(job);
        } else {
          console.log('🔐 Non-LinkedIn sign-in detected, attempting standard sign-in...');
          return await this.handleSignInPage(job, extraction);
        }
      case 'job_detail':
        return await this.handleJobDetailPage(job);

      case 'application_form':
        return await this.handleApplicationForm(job);

      case 'other':
      default:
        return await this.handleUnknownPage(extraction, job);
    }
  }

  private async handleJobNotFound(job: Job): Promise<JobApplicationResult> {
    console.log(`❌ Job not found or expired: ${job.job_title}`);
    await this.page.screenshot({ path: `job_not_found_${job.company_name.replace(/\s+/g, '_')}.png` });
    return { success: false, shouldRetry: false };
  }

  private async handleSignInPage(job: Job, extraction: {pageType: string, details: string}): Promise<JobApplicationResult> {
    try {
      console.log('🔐 Sign-in required, attempting sign-in with provided details...');
      await this.page.act(analyseAndSignInWithDetails);
      await this.page.act("Click on continue button if any")
      // Wait and re-analyze the page after sign-in
      // await new Promise(resolve => setTimeout(resolve, 3000));
      const postSignInExtraction = await this.page.extract(extractJobDetailRules) as { extraction: string };
      return await this.handlePageType(postSignInExtraction.extraction, job);
    } catch (error) {
      console.error('🚫 Sign-in failed:', error);
      return { success: false, shouldRetry: true };
    }
  }

  private async handleJobDetailPage(job: Job): Promise<JobApplicationResult> {
    console.log('📋 Job details page found, looking for Apply button...');
    try {
      await this.page.act("Click a button that says 'Apply', 'Easy Apply', or 'Apply Now'");
      // Wait and check what page we're on now
      await new Promise(resolve => setTimeout(resolve, 2000));
      const postApplyExtraction = await this.page.extract(extractJobDetailRules) as { extraction: string };
      const parsedPostApply = JSON.parse(postApplyExtraction.extraction);
      
      if (parsedPostApply.pageType === 'application_form') {
        return await this.handleApplicationForm(job);
      } else {
        return await this.handlePageType(postApplyExtraction.extraction, job);
      }
    } catch (error) {
      console.error('🚫 Failed to click Apply button:', error);
      return { success: false, shouldRetry: true };
    }
  }

  private async handleApplicationForm(job: Job): Promise<JobApplicationResult> {
    console.log('📝 Application form detected');
    try {
      // Observe form fields
      const formAnalysis = await this.page.observe("What form fields are available? List all input fields, dropdowns, file uploads, and required information.");
      console.log('📋 Form analysis:', formAnalysis);
      
      // Fill the application form
      const fillResult = await this.fillApplicationForm(job, formAnalysis);
      
      if (fillResult.success) {
        await this.page.screenshot({ path: `application_completed_${job.company_name.replace(/\s+/g, '_')}.png` });
        console.log('✅ Application form completed successfully');
        return { success: true, shouldRetry: false };
      } else {
        await this.page.screenshot({ path: `application_failed_${job.company_name.replace(/\s+/g, '_')}.png` });
        return { success: false, shouldRetry: fillResult.shouldRetry };
      }
    } catch (error) {
      console.error('🚫 Error handling application form:', error);
      await this.page.screenshot({ path: `application_error_${job.company_name.replace(/\s+/g, '_')}.png` });
      return { success: false, shouldRetry: true };
    }
  }

  private async handleUnknownPage(extraction: any, job: Job): Promise<JobApplicationResult> {
    console.log(`❓ Unknown page type: ${extraction.pageType}`);
    console.log(`Details: ${extraction.details}`);
    await this.page.screenshot({ path: `unknown_page_${job.company_name.replace(/\s+/g, '_')}.png` });
    return { success: false, shouldRetry: true };
  }

  private async fillApplicationForm(job: Job, parsedAnalysis: formPageAnalysis[]): Promise<JobApplicationResult> {
    try {
      // Basic form filling logic - you can expand this based on your needs
      console.log('📝 Starting form fill process...', parsedAnalysis);
      const personalInfo = getPersonalInfoFromEnv();
      // Fill form based on analysis
      for (const field of parsedAnalysis) {
        // analyse the description and fill accordingly wither basic info or resume upload
        if(field.description.toLowerCase().includes('upload') || field.description.toLowerCase().includes('resume') || field.description.toLowerCase().includes('cv')) {
          await this.uploadResume(parsedAnalysis);
        }else {
          await this.fillBasicInfo(personalInfo, parsedAnalysis);
          await this.handleFormErrors();
        }
      }

      // Observe page and check if it is a submit button or a continue/proceed button
      const observedElements = await this.page.observe("What buttons are available? List all buttons and their labels, if label is not in english add an english translation in bracket like a short word (e.g. Weiter (Continu))");
      console.log('🔍 Observed elements:', observedElements);
      // consider the case for continue or proceed button
      const continueButton = observedElements.find((button: any) => button.description.toLowerCase().includes('continue') || button.description.toLowerCase().includes('proceed'));
      if (continueButton) {
        await this.page.act(`Click on the continue button: ${continueButton.description} selector ${continueButton.selector}`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for submission to process
        console.log('✅ Continued to next step');
        const postNavigateToNextForm = await this.page.extract(extractJobDetailRules) as { extraction: string };
        return await this.handlePageType(postNavigateToNextForm.extraction, job);
      } else {
        // If no continue button, try to handle the page type again (might be a submit button)
        console.log('🔍 No continue button found, checking for submit button or final submission...');
        await this.submitApplication();
        return { success: true, shouldRetry: false };
      }
      
    } catch (error) {
      console.error('❌ Error filling application form:', error);
      return { success: false, shouldRetry: true };
    }
  }

  private async fillBasicInfo(info: PersonalInfo, analysis: formPageAnalysis[]): Promise<void> {
    try {
      // This is a basic implementation - you might need to customize based on actual form fields
     if(analysis.some(field => field.description.toLowerCase().includes('first name'))) {
        await this.page.act(`Fill in the first name field with "${info.firstName}"`);
      }
      if(analysis.some(field => field.description.toLowerCase().includes('last name'))) {
        await this.page.act(`Fill in the last name field with "${info.lastName}"`);
      }
      if(analysis.some(field => field.description.toLowerCase().includes('email'))) {
        await this.page.act(`Fill in the email field with "${info.email}"`);
      }
      if(analysis.some(field => field.description.toLowerCase().includes('phone'))) {
        await this.page.act(`Fill in the phone number field with "${info.phone}". 
          If there's a country code dropdown and it is not set to ${info.countryCode}, 
          select the appropriate country code first.
          then fill the phone number field with ${info.phoneWithoutCountryCode},
           If the field doesn't accept the country code, try the ${info.phone}`);
      }
      console.log('✅ Basic information filled');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log('⚠️ Some basic fields could not be filled:', errorMessage);
    }
  }

  private async uploadResume(formAnalysis?: formPageAnalysis[]): Promise<void> {
    try {
      const personalInfo = getPersonalInfoFromEnv();
      if (personalInfo.resumePath) {
        console.log('🔍 Looking for resume-related file input fields...');
        
        let uploadSuccess = false;
        
        // First priority: Use selector from form analysis if available
        if (formAnalysis) {
          const resumeField = formAnalysis.find(field => 
            field.description.toLowerCase().includes('upload') || 
            field.description.toLowerCase().includes('resume') || 
            field.description.toLowerCase().includes('cv') ||
            field.description.toLowerCase().includes('file')
          );
          
          if (resumeField && resumeField.selectors) {
            try {
              console.log(`🎯 Using form analysis selector: ${resumeField.selectors}`);
              const fileInput = this.page.locator(resumeField.selectors);
              await fileInput.setInputFiles(personalInfo.resumePath);
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for submission to process
              console.log('✅ Resume uploaded via form analysis selector');
              await this.page.screenshot({ path: `resume_upload_success_checker_1${Date.now()}.png` });
              uploadSuccess = true;
            } catch (error) {
              console.log('⚠️ Form analysis selector failed, trying other methods...', error);
            }
          }
        }
        
        // Second priority: Try ResumeField test ID
        if (!uploadSuccess) {
          try {
            const fileInput = this.page.getByTestId('ResumeField').locator('input[type="file"]');
            await fileInput.setInputFiles(personalInfo.resumePath);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for submission to process
            console.log('✅ Resume uploaded via ResumeField test ID');
            await this.page.screenshot({ path: `resume_upload_success_checker_2${Date.now()}.png` });
            uploadSuccess = true;
          } catch (error) {
            console.log('⚠️ ResumeField test ID not found, trying other methods...', error);
          }
        }
        
        // Third priority: Try PDF file input
        if (!uploadSuccess) {
          try {
            const fileInput = this.page.locator('input[type="file"][accept*=".pdf"]').first();
            await fileInput.setInputFiles(personalInfo.resumePath);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for submission to process
            console.log('✅ Resume uploaded via PDF file input (first match)');
            await this.page.screenshot({ path: `resume_upload_success_checker_3${Date.now()}.png` });
            uploadSuccess = true;
          } catch (error) {
            console.log('⚠️ PDF file input method failed, trying act method...', error);
          }
        }
        
        // Fourth priority: Use act method as fallback
        if (!uploadSuccess) {
          try {
            await this.page.act(`Upload the file "${personalInfo.resumePath}" to the resume upload field. Look for file upload areas, dropzones, or "Choose File" buttons related to resume or CV.`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for submission to process

            console.log('✅ Resume uploaded via act method');
            await this.page.screenshot({ path: `resume_upload_success_checker_4${Date.now()}.png` });
            uploadSuccess = true;
          } catch (error) {
            console.log('⚠️ Act method failed, trying manual file input selection...');
          }
        }
        
        // Final fallback: Check all file inputs with context analysis
        if (!uploadSuccess) {
          try {
            const fileInputs = await this.page.locator('input[type="file"]').all();
            console.log(`🔍 Found ${fileInputs.length} file input(s), checking for resume-related ones...`);
            
            for (let i = 0; i < fileInputs.length; i++) {
              const input = fileInputs[i];
              try {
                // Get the context around the file input to see if it's resume-related
                const parentElement = input.locator('..');
                const contextText = await parentElement.textContent();
                console.log(`📝 File input ${i + 1} context: ${contextText}`);
                
                if (contextText && (
                  contextText.toLowerCase().includes('resume') || 
                  contextText.toLowerCase().includes('cv') ||
                  contextText.toLowerCase().includes('upload')
                )) {
                  await input.setInputFiles(personalInfo.resumePath);
                  console.log(`✅ Resume uploaded via file input ${i + 1} (context-matched)`);
                  await this.page.screenshot({ path: `resume_upload_success_checker_5${Date.now()}.png` });
                  uploadSuccess = true;
                  break;
                }
              } catch (error) {
                console.log(`⚠️ Failed to check context for file input ${i + 1}:`, error);
              }
            }
            
            // If no context-matched input found, use the first one
            if (!uploadSuccess && fileInputs.length > 0) {
              await fileInputs[0].setInputFiles(personalInfo.resumePath);
              console.log('✅ Resume uploaded via first available file input');
              await this.page.screenshot({ path: `resume_upload_success_checker_6${Date.now()}.png` });
              uploadSuccess = true;
            }
          } catch (error) {
            console.log('⚠️ Manual file input selection failed:', error);
          }
        }
        
        if (!uploadSuccess) {
          throw new Error('All resume upload methods failed');
        }
        
      } else {
        console.log('⚠️ No resume path configured in environment variables');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log('⚠️ Resume upload failed:', errorMessage);
      await this.page.screenshot({ path: `resume_upload_error_${Date.now()}.png` });
    }
  }

  private async submitApplication(): Promise<void> {
    try {
      await this.page.act("Click the submit button or 'Submit Application' button to complete the application, click on submit  button or continue button to proceed");
      console.log('✅ Application submitted');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for submission to process
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log('⚠️ Could not submit application automatically:', errorMessage);
      throw error;
    }
  }

  private async handleFormErrors(): Promise<void> {
    // Implement logic to detect and handle form errors if needed
    // basically check for variants of red colored text or borders under the form fields then suggest and apply the fix 
    const observedErrors = await this.page.observe("Are there any error messages or highlighted fields indicating form errors? List them.");
    console.log('🔍 Observed form errors:', observedErrors);
    // You can implement specific error handling logic based on observed errors
    // For example, if a required field is missing, try to fill it again or notify the user
    if(!observedErrors || observedErrors.length === 0) {
      console.log('✅ No form errors detected');
      return;
    }
    for (const error of observedErrors) {
      console.log(`⚠️ Form error detected: ${error.description}`);
      // suggest fixes based on error description and do the act
      await this.page.act(`Fix the form error: ${error.description} with the selector ${error.selector}`);
      console.log('Fixed the form error, attempting to resubmit...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for fix to process
    }
    console.log('✅ Attempted to handle form errors');
    return;
  }
}
