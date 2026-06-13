import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient, Prisma } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name)

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    })

    // Log slow queries only (>200 ms) in dev so we catch N+1 problems early
    if (process.env.NODE_ENV !== 'production') {
      (this as any).$on('query', (e: Prisma.QueryEvent) => {
        if (e.duration > 200) {
          this.logger.warn(`Slow query (${e.duration}ms): ${e.query.slice(0, 120)}`)
        }
      })
    }
  }

  async onModuleInit() {
    await this.$connect()
    this.logger.log('✅ Database connected')
  }

  async onModuleDestroy() {
    await this.$disconnect()
    this.logger.log('Database disconnected')
  }

  /** Convenience: run a health-check ping. Used by liveness probes. */
  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`
      return true
    } catch {
      return false
    }
  }
}
