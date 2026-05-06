import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.cron(
  "send daily birthday email reminders",
  "0 8 * * *",
  internal.emails.runDailyEmailNotifications,
  {},
);

export default crons;
