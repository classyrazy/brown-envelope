import "dotenv/config";
import { Stagehand } from "@browserbasehq/stagehand";
import { AvailableJobs } from "./jobs.js";
import { JobApplier } from './agent/applier/applier.js';

async function main() {
  const stagehand = new Stagehand({
    env: "LOCAL",
    modelName: "google/gemini-2.5-flash",
    modelClientOptions: {
      apiKey: process.env.GOOGLE_API_KEY,
    },
  });

  await stagehand.init();

  console.log(`Stagehand Session Started`);
  console.log(`Watch live: https://browserbase.com/sessions/${stagehand.browserbaseSessionID}`);

  const page = stagehand.page;
  const jobs = AvailableJobs;
  
  // Create a JobApplier instance
  const jobApplier = new JobApplier(page);
  
  for (const job of jobs) {
    try {
      console.log(`\n� Processing job: ${job.job_title} at ${job.company_name}`);
      await jobApplier.processJobApplication(job);
    } catch (error) {
      console.error(`❌ Error processing job ${job.job_title} at ${job.company_name}:`, error);
      await page.screenshot({ path: `error_${job.company_name.replace(/\s+/g, '_')}_${Date.now()}.png` });
      continue; // Continue to next job
    }
  }

  await stagehand.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
