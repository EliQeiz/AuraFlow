import "dotenv/config";

const runtimeEnv =
  (globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

function readEnv(name: string, fallback?: string) {
  const value = runtimeEnv[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getServerEnv() {
  return {
    supabaseUrl: readEnv("SUPABASE_URL", runtimeEnv.VITE_SUPABASE_URL),
    supabaseServiceRoleKey: readEnv("SUPABASE_SERVICE_ROLE_KEY"),
    publicSiteUrl: runtimeEnv.PUBLIC_SITE_URL ?? runtimeEnv.VERCEL_URL ?? "http://127.0.0.1:5173",
  };
}

export function getWorkerEnv() {
  return {
    ...getServerEnv(),
    workerPollMs: Number(runtimeEnv.WORKER_POLL_MS ?? 2500),
    workerBatchLimit: Number(runtimeEnv.WORKER_BATCH_LIMIT ?? 1),
    processorMode: runtimeEnv.WORKER_PROCESSOR_MODE ?? "local",
    tempDir: runtimeEnv.WORKER_TEMP_DIR ?? ".auraflow-tmp",
  };
}
