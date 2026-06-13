import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'
import { ResponseInterceptor } from './common/interceptors/response.interceptor'
import { RedisIoAdapter } from './modules/proctoring/redis-io.adapter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  app.enableShutdownHooks()
  app.setGlobalPrefix('api/v1')
  app.useGlobalFilters(new AllExceptionsFilter())
  app.useGlobalInterceptors(new ResponseInterceptor())
  app.enableCors({
    origin: process.env.WEB_ORIGIN?.split(',') ?? '*',
    credentials: true,
  })
  const redisAdapter = new RedisIoAdapter(app)
  await redisAdapter.connectToRedis()
  app.useWebSocketAdapter(redisAdapter)
  await app.listen(process.env.PORT ?? 3000)
  console.log(`🚀 Core API running on port ${process.env.PORT ?? 3000}`)
}
bootstrap()
