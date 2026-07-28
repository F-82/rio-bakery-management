import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { ConsolePrinter, EscPosPrinter, Printer } from "./printer";
import { renderCustomerReceipt, renderKitchenTicket, PrintJobPayload } from "./renderer";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MAX_ATTEMPTS = 3;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Use ConsolePrinter by default until ESC/POS hardware is known.
// You could also toggle this with an environment variable later.
const printer: Printer = new ConsolePrinter();

type PrintJob = {
  id: string;
  business_id: string;
  order_id: string;
  target: 'customer_receipt' | 'kitchen_ticket';
  payload: PrintJobPayload;
  status: 'queued' | 'printing' | 'done' | 'failed';
  attempts: number;
  last_error: string | null;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function processJob(job: PrintJob) {
  console.log(`[Job ${job.id}] Processing ${job.target}...`);
  
  // Optimistically mark as printing
  await supabase
    .from("print_jobs")
    .update({ status: 'printing', updated_at: new Date().toISOString() })
    .eq("id", job.id);

  let attempt = job.attempts;
  let success = false;
  let lastError = null;

  while (attempt < MAX_ATTEMPTS && !success) {
    try {
      attempt++;
      
      const text = job.target === 'customer_receipt' 
        ? renderCustomerReceipt(job.payload)
        : renderKitchenTicket(job.payload);

      await printer.print(text);
      success = true;
    } catch (err: any) {
      lastError = err.message || "Unknown error";
      console.error(`[Job ${job.id}] Attempt ${attempt} failed: ${lastError}`);
      if (attempt < MAX_ATTEMPTS) {
        const backoffMs = Math.pow(2, attempt) * 1000;
        console.log(`[Job ${job.id}] Retrying in ${backoffMs}ms...`);
        await delay(backoffMs);
      }
    }
  }

  // Write back status
  const finalStatus = success ? 'done' : 'failed';
  console.log(`[Job ${job.id}] Finished with status: ${finalStatus}`);
  
  await supabase
    .from("print_jobs")
    .update({
      status: finalStatus,
      attempts: attempt,
      last_error: success ? null : lastError,
      updated_at: new Date().toISOString()
    })
    .eq("id", job.id);
}

async function recoverPendingJobs() {
  console.log("Checking for pending or stuck jobs...");
  const { data: jobs, error } = await supabase
    .from("print_jobs")
    .select("*")
    .in("status", ["queued", "printing"])
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch pending jobs:", error.message);
    return;
  }

  if (jobs && jobs.length > 0) {
    console.log(`Found ${jobs.length} pending job(s) on startup.`);
    for (const job of jobs) {
      await processJob(job);
    }
  }
}

function startSubscription() {
  console.log("Subscribing to new print jobs...");
  
  supabase
    .channel('print_jobs_changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'print_jobs' },
      (payload) => {
        const newJob = payload.new as PrintJob;
        // Ignore jobs that are already finished (e.g. historical imports, though unlikely)
        if (newJob.status === 'queued') {
          processJob(newJob);
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'print_jobs' },
      (payload) => {
        const updatedJob = payload.new as PrintJob;
        // Specifically look for queued jobs in case of a 'Reprint' (which actually creates a new row,
        // but just in case we allow updating status back to queued in the future)
        if (updatedJob.status === 'queued' && payload.old.status !== 'queued') {
          processJob(updatedJob);
        }
      }
    )
    .subscribe((status) => {
      console.log(`Subscription status: ${status}`);
    });
}

async function main() {
  console.log("Starting Rio Bakers Hut Print Agent...");
  
  // Process any jobs that were queued while the agent was offline
  await recoverPendingJobs();
  
  // Listen for realtime inserts
  startSubscription();
}

main().catch(console.error);
