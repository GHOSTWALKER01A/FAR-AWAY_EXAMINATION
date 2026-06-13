import { NestFactory } from '@nestjs/core'
import { Logger } from '@nestjs/common'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'
import { ResponseInterceptor } from './common/interceptors/response.interceptor'
import { ZodValidationPipe } from './common/pipes/zod-validation.pipe'
import { RedisIoAdapter } from './modules/proctoring/redis-io.adapter'

const logger = new Logger('Bootstrap')

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })

  // ── Shutdown ─────────────────────────────────────────────────────────────────
  app.enableShutdownHooks()

  // ── Global prefix ─────────────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1')

  // ── Global exception filter (shapes all errors into { success, error }) ───────
  app.useGlobalFilters(new AllExceptionsFilter())

  // ── Global response interceptor (wraps all responses in { success, data }) ───
  app.useGlobalInterceptors(new ResponseInterceptor())

  // ── CORS ─────────────────────────────────────────────────────────────────────
  const origins = process.env.WEB_ORIGIN?.split(',').map((o) => o.trim()) ?? []
  app.enableCors({
    origin: origins.length ? origins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  // ── Redis Socket.IO adapter (horizontal scaling) ──────────────────────────────
  const redisAdapter = new RedisIoAdapter(app)
  await redisAdapter.connectToRedis()
  app.useWebSocketAdapter(redisAdapter)

  const port = process.env.PORT ?? 3000
  await app.listen(port)
  logger.log(`🚀 Core API listening on http://localhost:${port}/api/v1`)
  logger.log(`   NODE_ENV: ${process.env.NODE_ENV ?? 'development'}`)
}

bootstrap().catch((err) => {
  logger.error('Bootstrap failed', err)
  process.exit(1)
})
