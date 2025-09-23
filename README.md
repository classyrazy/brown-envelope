# Job Applier with Stagehand

An automated job application system using Stagehand for browser automation and AI-powered form filling.

## Project Structure

```
├── index.ts                    # Main entry point
├── jobs.ts                     # Job listings to process
├── agent/
│   ├── types.ts               # Shared TypeScript interfaces
│   └── applier/
│       ├── applier.ts         # Main JobApplier class
│       └── rules.ts           # Page extraction rules
├── .env.example               # Environment variables template
└── package.json               # Dependencies and scripts
```

## Features

- 🤖 **AI-powered page analysis** - Automatically detects job detail pages, application forms, sign-in pages, etc.
- 🔄 **Retry logic** - Handles temporary failures with configurable retry attempts
- 🌐 **Multi-language support** - Automatically detects and attempts to translate non-English pages
- 📝 **Form automation** - Fills out application forms with your personal information
- 📸 **Screenshot debugging** - Takes screenshots at key points for troubleshooting
- 🔐 **LinkedIn SSO** - Handles LinkedIn sign-in when required
- ⚡ **Error resilience** - Continues processing other jobs even if one fails

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Required environment variables:**
   ```
   GOOGLE_API_KEY=your_google_api_key_here
   APPLICANT_FIRST_NAME=Your_First_Name
   APPLICANT_LAST_NAME=Your_Last_Name
   APPLICANT_EMAIL=your.email@example.com
   APPLICANT_PHONE=+1234567890
   APPLICANT_LINKEDIN=https://linkedin.com/in/yourprofile
   RESUME_PATH=/path/to/your/resume.pdf
   ```

4. **Add your job listings:**
   - Edit `jobs.ts` to include the jobs you want to apply to
   - Each job should have: `job_title`, `company_name`, `job_url`

## Usage

### Basic Usage

```bash
npm start
```

### Using the JobApplier Class

```typescript
import { JobApplier } from './agent/applier/applier.js';
import { Job } from './agent/types.js';

const jobApplier = new JobApplier(page);
const job: Job = {
  job_title: "Software Engineer",
  company_name: "Tech Corp",
  job_url: "https://example.com/job"
};

await jobApplier.processJobApplication(job);
```

## Architecture

### JobApplier Class

The main `JobApplier` class handles the entire job application workflow:

- **Page Analysis**: Uses AI to determine page type (job detail, application form, etc.)
- **Flow Control**: Handles different page types with appropriate actions
- **Form Filling**: Automatically fills out application forms
- **Error Handling**: Robust error handling with retry logic

### Page Types

The system recognizes these page types:

- `job_detail`: Job posting with description and apply button
- `application_form`: Form with fields to fill out
- `signin_page`: Authentication required (LinkedIn, company portal)
- `job_not_found`: Job no longer available or expired
- `other`: Unknown page type

### Handlers

Each page type has a dedicated handler:

- `handleJobDetailPage()` - Clicks apply buttons
- `handleApplicationForm()` - Fills out forms and submits
- `handleSignInPage()` - Handles authentication
- `handleJobNotFound()` - Logs and skips expired jobs

## Customization

### Adding New Page Types

1. Update the `extractJobDetailRules` in `rules.ts`
2. Add new case to `handlePageType()` switch statement
3. Implement new handler method

### Custom Form Fields

Extend the `fillApplicationForm()` method to handle specific form fields:

```typescript
private async fillCustomFields(job: Job): Promise<void> {
  await this.page.act(`Fill in the "Why do you want this job?" field with a compelling reason`);
  await this.page.act(`Select "Senior" from the experience level dropdown`);
}
```

### Adding File Uploads

The system supports resume uploads via the `RESUME_PATH` environment variable. Extend `uploadResume()` for additional files:

```typescript
private async uploadCoverLetter(): Promise<void> {
  const coverLetterPath = process.env.COVER_LETTER_PATH;
  if (coverLetterPath) {
    await this.page.act(`Upload "${coverLetterPath}" to the cover letter field`);
  }
}
```

## Debugging

### Screenshots

The system automatically takes screenshots for:
- Application forms (`application_form_CompanyName.png`)
- Errors (`error_CompanyName_timestamp.png`)
- Unknown pages (`unknown_page_CompanyName.png`)
- Job not found (`job_not_found_CompanyName.png`)

### Logs

Detailed console logs show:
- 🔄 Processing status
- 📍 Page navigation
- 🔍 Page analysis results
- ✅ Success indicators
- ❌ Error messages

### Browser Session

Monitor live browser activity:
```
Watch live: https://browserbase.com/sessions/[session-id]
```

## Error Handling

The system handles various error scenarios:

1. **Network issues**: Automatic retries with exponential backoff
2. **Missing elements**: Graceful fallback and error logging  
3. **Authentication failures**: Retry with manual intervention points
4. **Form submission errors**: Screenshot capture and continuation

## Built with Stagehand

This project is built with [Stagehand](https://github.com/browserbase/stagehand) - an SDK for automating browsers with AI.

## License

MIT License
