export const extractJobDetailRules = `
  Analyze this webpage and determine its type. Return a JSON object with the following structure:
  {pageType: 'job_detail' | 'application_form' | 'signin_page' | 'job_not_found' | 'other', details: string}
  
  Page type definitions:
  - 'job_detail': A page showing job information, description, requirements, company info
  - 'application_form': A page with form fields to fill out for job application (name, email, resume upload, etc.)
  - 'signin_page': A page requiring login/authentication (LinkedIn, company portal, etc.)
  - 'job_not_found': A page indicating the job posting is no longer available, expired, removed, or showing 404/error related to missing job
  - 'other': Any other type of page (error, redirect, company homepage, etc.)
  
  In the details field, provide a brief description of what you see on the page.
  
  IMPORTANT: If the page content appears to be in a language other than English, and you can see a Google Translate option or language selector, mention this in the details field so the automation can click on it to translate the page to English.
  
  Example responses:
  {pageType: 'job_detail', details: 'Job posting for Software Engineer at TechCorp with requirements and description'}
  {pageType: 'signin_page', details: 'LinkedIn login page with email/password fields'}
  {pageType: 'application_form', details: 'Application form with fields for personal info and resume upload'}
  {pageType: 'job_not_found', details: 'Page shows "This job is no longer available" or 404 error'}
  {pageType: 'other', details: 'Page in Spanish language, Google Translate button visible in top right'}
`
const signinDetails = {
  email: process.env.APPLICANT_EMAIL,
  defaultPassword: process.env.DEFAULT_PASSWORD || 'DefaultPassword123!',
  linkedinPassword: process.env.LINKEDIN_PASSWORD || 'LinkedInPassword123!'
}
export const analyseAndSignInWithDetails = `
  You are on a sign-in page. Determine if you can sign in using just an email address (no password required).
  You have the following email: ${signinDetails.email}
  You have the following default password: ${signinDetails.defaultPassword}
  You have the following LinkedIn password: ${signinDetails.linkedinPassword}
  If the page indicates you can sign in with just an email (e.g. "Continue with email", "Email only", "No password required"), return:
  {canSignInWithEmailOnly: true, email: "the email to use"}

  If the page requires both email and password, and you see fields for both, return:
  {canSignInWithEmailOnly: false, email: "the email to use", password: "the password to use"}

  If the page is specifically for LinkedIn sign-in (e.g. LinkedIn logo, URL contains linkedin.com), return:
  {canSignInWithEmailOnly: false, email: "the email to use", password: "the LinkedIn password to use"}

  If you cannot determine how to sign in, return:
  {canSignInWithEmailOnly: false, email: null, password: null}

  IMPORTANT: Only return valid JSON with the exact fields specified above. Do not include any additional text or explanation.
`

export const submtApplicationRules = `Complete the job application submission by following these steps in order:

      1. FIRST - Look for and click any of these submission buttons (in order of preference):
         • "Submit Application" or "Submit"
         • "Apply Now" or "Apply" 
         • "Send Application"
         • "Complete Application"
         • "Finish" or "Done"
         • "Continue" or "Next" (if it's the final step)
         • "Proceed" or "Confirm"

      2. BUTTON IDENTIFICATION - The button should be:
         • Prominently placed (usually bottom right or center)
         • Primary colored (blue, green, or brand color)
         • NOT disabled/grayed out
         • May have icons like ➤ → ✓ or similar

      3. HANDLE DIFFERENT SCENARIOS:
         • If you see a confirmation dialog, click "Yes" or "Confirm"
         • If asked "Are you sure?", click "Yes" or "Submit"
         • if there is an agreement/terms checkbox, check it first
         • If there's a terms/privacy checkbox that's unchecked, check it first
         • If the button is disabled, check for missing required fields or errors

      4. AVOID CLICKING:
         • "Cancel", "Back", "Previous", "Save Draft"
         • Social media share buttons
         • "Edit" or "Modify" buttons
         • Navigation buttons that don't submit

      5. MULTI-LANGUAGE SUPPORT - Also look for these international variants:
         • "Enviar" (Spanish), "Soumettre" (French), "Absenden" (German)
         • "送信" (Japanese), "提交" (Chinese), "Отправить" (Russian)
         • "Invio" (Italian), "Verzenden" (Dutch), "Skicka" (Swedish)

      6. IF NO OBVIOUS SUBMIT BUTTON - Look for:
         • Buttons with icons: ➤, →, ✓, 📤
         • The most prominent call-to-action button
         • Buttons that are highlighted or have focus

      Be precise and only click the button that will actually submit/complete the application.
    `;
    export const simpleTickNecessaryCheckBoxes = ` check If there are any unchecked terms/agreement checkboxes, check them`
export const simpleSubmtApplicationRules = `Click the submit button or 'Submit Application' button to complete the application, click on submit  button or continue button to proceed`;

export const NoMAppingFoundImprovisingRule = `
`