// Route protection is handled per-layout via getServerSession instead of
// edge middleware, avoiding next-auth's edge-runtime middleware helper
// (which has caused Vercel Edge Function build issues).
export {};
