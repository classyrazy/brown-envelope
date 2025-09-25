
import { analyseAndSignInWithDetails, extractJobDetailRules, submtApplicationRules } from './rules.js';
import { formPageAnalysis, Job, JobApplicationResult, JobProcessingResult, PersonalInfo } from '../types.js';
import { getPersonalInfoFromEnv } from '../../utils/index.js';
import { useApplierFiller, FieldMapping } from '../system/filler';

export class JobApplier {
  private page: any;

  constructor(page: any) {
    this.page = page;
  }

  async processJobApplication(job: Job, maxRetries = 2): Promise<JobProcessingResult> {
    const startTime = new Date().toISOString();
    const processingStart = Date.now();
    let currentRetry = 0;
    let lastScreenshot = '';
    let fieldsFilled: string[] = [];
    let errorMessage = '';
    let successMessage = '';
    let description = '';
    
    while (currentRetry <= maxRetries) {
      try {
        console.log(`📍 Navigating to: ${job.job_url}`);
        await this.page.goto(job.job_url);
        
        // Take initial screenshot
        lastScreenshot = await this.takeScreenshot(`${job.job_title}-initial-${Date.now()}`);
        
        // First, analyze the page to understand what we're dealing with
        const initialExtraction = await this.page.extract(extractJobDetailRules) as { extraction: string };
        console.log(`🔍 Initial page analysis:`, initialExtraction);
        description = initialExtraction.extraction;
        
        // Handle different page types
        const result = await this.handlePageType(initialExtraction.extraction, job);
        
        if (result.fieldsFilled) {
          fieldsFilled = [...fieldsFilled, ...result.fieldsFilled];
        }
        
        if (result.success) {
          console.log(`✅ Successfully processed job: ${job.job_title}`);
          successMessage = `Application completed successfully after ${currentRetry + 1} attempt(s)`;
          lastScreenshot = await this.takeScreenshot(`${job.job_title}-success-${Date.now()}`);
          
          return {
            jobName: job.job_title,
            jobLink: job.job_url,
            status: 'success',
            imageOfLastContact: lastScreenshot,
            description,
            successMessage,
            fieldsFilled: [...new Set(fieldsFilled)], // Remove duplicates
            errorMessage: '',
            processingTimeMs: Date.now() - processingStart,
            startTime,
            endTime: new Date().toISOString()
          };
        } else if (result.shouldRetry && currentRetry < maxRetries) {
          console.log(`🔄 Retrying... (${currentRetry + 1}/${maxRetries})`);
          errorMessage = result.message || 'Unknown error, retrying';
          currentRetry++;
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
        } else {
          console.log(`⏭️ Skipping job after ${currentRetry + 1} attempts`);
          errorMessage = result.message || 'Max retries exceeded';
          lastScreenshot = await this.takeScreenshot(`${job.job_title}-skipped-${Date.now()}`);
          
          return {
            jobName: job.job_title,
            jobLink: job.job_url,
            status: 'skipped',
            imageOfLastContact: lastScreenshot,
            description,
            successMessage: '',
            fieldsFilled: [...new Set(fieldsFilled)],
            errorMessage,
            processingTimeMs: Date.now() - processingStart,
            startTime,
            endTime: new Date().toISOString()
          };
        }
      } catch (error) {
        console.error(`Error in attempt ${currentRetry + 1}:`, error);
        errorMessage = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        currentRetry++;
        
        if (currentRetry > maxRetries) {
          lastScreenshot = await this.takeScreenshot(`${job.job_title}-error-${Date.now()}`);
          
          return {
            jobName: job.job_title,
            jobLink: job.job_url,
            status: 'error',
            imageOfLastContact: lastScreenshot,
            description: description || 'Failed to analyze page',
            successMessage: '',
            fieldsFilled: [...new Set(fieldsFilled)],
            errorMessage,
            processingTimeMs: Date.now() - processingStart,
            startTime,
            endTime: new Date().toISOString()
          };
        }
      }
    }

    // Fallback return (shouldn't reach here)
    return {
      jobName: job.job_title,
      jobLink: job.job_url,
      status: 'error',
      imageOfLastContact: lastScreenshot,
      description: description || 'Unknown processing error',
      successMessage: '',
      fieldsFilled: [...new Set(fieldsFilled)],
      errorMessage: errorMessage || 'Unexpected processing error',
      processingTimeMs: Date.now() - processingStart,
      startTime,
      endTime: new Date().toISOString()
    };
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
          // TODO: Implement LinkedIn specific sign-in
          return await this.handleSignInPage(job, extraction);
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
    return { success: false, shouldRetry: false, message: 'Job not found or expired', fieldsFilled: [] };
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
      return { success: false, shouldRetry: true, message: `Sign-in failed: ${error instanceof Error ? error.message : 'Unknown error'}`, fieldsFilled: [] };
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
        return { success: true, shouldRetry: false, message: 'Application completed successfully', fieldsFilled: fillResult.fieldsFilled || [] };
      } else {
        await this.page.screenshot({ path: `application_failed_${job.company_name.replace(/\s+/g, '_')}.png` });
        return { success: false, shouldRetry: fillResult.shouldRetry, message: fillResult.message || 'Application form submission failed', fieldsFilled: fillResult.fieldsFilled || [] };
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
    let fieldsFilled: string[] = [];
    
    try {
      // Basic form filling logic - you can expand this based on your needs
      console.log('📝 Starting form fill process...', parsedAnalysis);
      const personalInfo = getPersonalInfoFromEnv();
      // Separate upload fields from other fields
      // const uploadFields = parsedAnalysis.filter(field => 
      //   field.description.toLowerCase().includes('upload') || 
      //   field.description.toLowerCase().includes('resume') || 
      //   field.description.toLowerCase().includes('cv') ||
      //   field.description.toLowerCase().includes('file')
      // );
      
      // // Fill basic info fields first
      // const basicFields = await this.fillBasicInfo(personalInfo, parsedAnalysis);
      // fieldsFilled = [...fieldsFilled, ...basicFields];
      
      // // Then handle file uploads
      // if (uploadFields.length > 0) {
      //   await this.uploadResume(parsedAnalysis);
      //   fieldsFilled.push('Resume Upload');
      // }

      for(const field of parsedAnalysis) {
        if (field.description.toLowerCase().includes('upload') ||
            field.description.toLowerCase().includes('resume') ||
            field.description.toLowerCase().includes('cv') ||
            field.description.toLowerCase().includes('file')) {
          await this.uploadResume(parsedAnalysis);
          fieldsFilled.push('Resume Upload');
        }else {
          const filled = await this.fillBasicInfo(personalInfo, [field]);
          fieldsFilled = [...fieldsFilled, ...filled];

        }
      }
      
      // Check for form errors after filling all fields
      await this.handleFormErrors();

      // Observe page and check if it is a submit button or a continue/proceed button
      const observedElements = await this.page.observe("What buttons are available? List all buttons and their labels, if label is not in english add an english translation in bracket like a short word (e.g. Weiter (Continu))");
      console.log('🔍 Observed elements:', observedElements);
      // consider the case for continue or proceed button
      const continueButton = observedElements.find((button: any) => 
        button.description && (
          button.description.toLowerCase().includes('continue') || 
          button.description.toLowerCase().includes('proceed') ||
          button.description.toLowerCase().includes('next')
        )
      );
      
      if (continueButton) {
        const selector = continueButton.selector || continueButton.selectors || '';
        await this.page.act(`Click on the continue button: ${continueButton.description}${selector ? ` with selector ${selector}` : ''}`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for submission to process
        console.log('✅ Continued to next step');
        const postNavigateToNextForm = await this.page.extract(extractJobDetailRules) as { extraction: string };
        return await this.handlePageType(postNavigateToNextForm.extraction, job);
      } else {
        // If no continue button, try to handle the page type again (might be a submit button)
        console.log('🔍 No continue button found, checking for submit button or final submission...');
        // ensure all required fields has been fields and no form errors
          await this.handleFormErrors();
          // ensure all required fields are filled
          fieldsFilled = [...fieldsFilled, ...(await this.fillBasicInfo(personalInfo, parsedAnalysis))];
        await this.submitApplication();
        return { success: true, shouldRetry: false, message: 'Application submitted successfully', fieldsFilled };
      }
      
    } catch (error) {
      console.error('❌ Error filling application form:', error);
      return { success: false, shouldRetry: true, message: `Form filling error: ${error instanceof Error ? error.message : 'Unknown error'}`, fieldsFilled };
    }
  }

  private async fillBasicInfo(info: PersonalInfo, analysis: formPageAnalysis[]): Promise<string[]> {
    const filledFields: string[] = [];
    const { fieldMappings } = useApplierFiller();
    try {
      // This is a basic implementation - you might need to customize based on actual form fields
      for (const field of analysis) {
        // check if field is required and skip
        if(!field.description.toLowerCase().includes('required')) {
          continue;
        }
        const mapping = fieldMappings.find((m: FieldMapping) => m.keywords.some((keyword: string) => field.description.toLowerCase().includes(keyword)));
        if (mapping) {
          await this.page.act(mapping.instruction);
          filledFields.push(mapping.label);
        }else{
          console.log(`⚠️ No mapping found for field: ${field.description}`);
          // If no mapping is found, you might want to handle it differently
          await this.page.act(`Fill in the ${field.description} with appropiate data using the personal info ${JSON.stringify(info)}`);
          filledFields.push(field.description);
        }
      }

      console.log(`✅ Basic information filled: ${filledFields.join(', ')}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log('⚠️ Some basic fields could not be filled:', errorMessage);
    }
    
    return filledFields;
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
      await this.page.act(submtApplicationRules);
      console.log('✅ Application submitted');
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for submission to process
      // check if submission was successful by observing the page and access and fix and resubmit if not
      const submissionSuccess = await this.page.observe("Observe the page and determine if the application was submitted successfully. Look for confirmation messages, thank you notes, or any indication that the submission was successful.");
      console.log('🔍 Submission success status:', submissionSuccess);
      if (!submissionSuccess) {
        // console.log('⚠️ Application submission failed, attempting to fix and resubmit...');
        await this.handleFormErrors();
        // await this.page.act(submtApplicationRules);
        this.submitApplication();
      }
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
      if (typeof error === 'object' && error.description) {
        console.log(`⚠️ Form error detected: ${error.description}`);
        // suggest fixes based on error description and do the act
        const selector = error.selector || error.selectors || '';
        await this.page.act(`Fix the form error: ${error.description}${selector ? ` with the selector ${selector}` : ''}`);
      } else if (typeof error === 'string') {
        console.log(`⚠️ Form error detected: ${error}`);
        await this.page.act(`Fix the form error: ${error}`);
      }
      console.log('Fixed the form error, attempting to resubmit...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for fix to process
    }
    console.log('✅ Attempted to handle form errors');
    return;
  }

  private async takeScreenshot(fileName: string): Promise<string> {
    try {
      const screenshotDir = './screenshots';
      const screenshotPath = `${screenshotDir}/${fileName}.png`;
      
      // Create screenshots directory if it doesn't exist
      const fs = await import('fs/promises');
      try {
        await fs.access(screenshotDir);
      } catch {
        await fs.mkdir(screenshotDir, { recursive: true });
      }
      
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`📸 Screenshot saved: ${screenshotPath}`);
      return screenshotPath;
    } catch (error) {
      console.error('Error taking screenshot:', error);
      return '';
    }
  }
}
