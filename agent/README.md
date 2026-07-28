# Rio Bakers Hut — Print Agent

This is a local Node.js service designed to run on the physical counter machine in the bakery. It listens to the Supabase `print_jobs` table via Realtime and sends tickets and receipts to the local ESC/POS printer.

Since browsers cannot communicate natively with raw ESC/POS printers over USB or local network without prompt interruptions (e.g., WebUSB), this background daemon bridges the cloud database to the local hardware.

## Features
- **Realtime Sync**: Subscribes to new orders instantly.
- **Offline Recovery**: On startup, it automatically pulls down any `queued` or `printing` jobs that were missed or interrupted during a power outage or restart.
- **Resilience**: Features automatic retry with exponential backoff on print failures.
- **Fail-safe Reporting**: Writebacks the status to Supabase so the cashier can see if a kitchen ticket failed to print and trigger a manual "Reprint" from the Dashboard.

## Setup & Installation

1. Install Node.js (v18+) on the counter machine.
2. Open a terminal in this `agent` directory.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file in the `agent` directory with your Supabase credentials:
   ```env
   SUPABASE_URL=https://<your-project-id>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   ```

## Running Manually

To start the agent for testing:
```bash
npm start
```
*Note: Currently, the printer driver defaults to a `ConsolePrinter` for development. The `EscPosPrinter` will be implemented once the exact hardware model is finalized.*

## Autostart (Production)

To ensure the agent survives reboots and crashes, run it as a background service using PM2.

1. Install PM2 globally:
   ```bash
   npm install -g pm2
   ```
2. Start the agent with PM2:
   ```bash
   pm2 start npm --name "rio-print-agent" -- start
   ```
3. Set PM2 to launch on system startup:
   ```bash
   pm2 startup
   ```
   *Follow the instructions printed in the terminal to configure the startup script for your specific OS.*
4. Save the current process list so it respawns on reboot:
   ```bash
   pm2 save
   ```
