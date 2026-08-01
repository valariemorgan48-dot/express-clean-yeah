export function resolveRate(entryJobType, baseRate, jobRates, overrideRate) {
  if (overrideRate !== undefined && overrideRate !== null) return overrideRate;
  if (entryJobType) {
    const override = jobRates.find((r) => r.jobType === entryJobType);
    if (override) return override.rate;
  }
  return baseRate;
}
