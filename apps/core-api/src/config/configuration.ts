import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.coerce.number().default(900),
  JWT_REFRESH_TTL: z.coerce.number().default(2592000),
  AI_SVC_URL: z.string().url(),
  INTERNAL_SERVICE_SECRET: z.string().min(16),
  EXAM_TIMER_GRACE_SECONDS: z.coerce.number().default(120),
  SESSION_HEARTBEAT_TIMEOUT: z.coerce.number().default(45),
})

export type AppConfig = z.infer<typeof schema>

export function loadConfig(): AppConfig {
  const parsed = schema.safeParse(process.env)
  if (!parsed.success) {
    console.error('❌ Invalid environment config:', parsed.error.flatten().fieldErrors)
    process.exit(1)
  }
  return parsed.data
}
