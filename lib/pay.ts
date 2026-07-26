// Resolves the effective hourly pay rate for a time entry: a per-job-type
// override if the manager set one for that job, otherwise the employee's
// base hourlyRate.
export function resolveRate(entryJobType, baseRate, jobRates) {
  if (entryJobType) {
    const override = jobRates.find((r) => r.jobType === entryJobType);
    if (override) return override.rate;
  }
  return baseRate;
}
