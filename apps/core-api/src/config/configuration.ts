import { z } from 'zod'

const schema = z.object({
  NODE_ENV:                  z.enum(['development', 'test', 'production']).default('development'),
  PORT:                      z.coerce.number().default(3000),

  // Supabase / PostgreSQL — runtime queries use DATABASE_URL (pooled via pgBouncer)
  DATABASE_URL:              z.string().min(1),
  // DIRECT_URL is consumed directly by Prisma (migrations), not by NestJS
  DIRECT_URL:                z.string().min(1).optional(),

  REDIS_URL:                 z.string().min(1),

  JWT_SECRET:                z.string().min(16),
  JWT_ACCESS_TTL:            z.coerce.number().default(900),
  JWT_REFRESH_TTL:           z.coerce.number().default(2592000),

  AI_SVC_URL:                z.string().url(),
  INTERNAL_SERVICE_SECRET:   z.string().min(16),

  ANTHROPIC_API_KEY:         z.string().optional(),
  GEMINI_API_KEY:            z.string().optional(),

  EXAM_TIMER_GRACE_SECONDS:  z.coerce.number().default(120),
  SESSION_HEARTBEAT_TIMEOUT: z.coerce.number().default(45),

  WEB_ORIGIN:                z.string().optional().default('http://localhost:3001'),
})

export type AppConfig = z.infer<typeof schema>

export function loadConfig(): AppConfig {
  const parsed = schema.safeParse(process.env)
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:\n', JSON.stringify(parsed.error.flatten().fieldErrors, null, 2))
    process.exit(1)
  }
  return parsed.data
}
