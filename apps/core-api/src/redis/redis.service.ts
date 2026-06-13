import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  client: Redis

  constructor(private cfg: ConfigService) {
    this.client = new Redis(cfg.get<string>('REDIS_URL')!)
  }

  async onModuleInit() { await this.client.ping() }
  async onModuleDestroy() { this.client.disconnect() }

  // ── Session hot state (θ, SE, served items, deadline) ──────────────────────
  async setSessionState(sessionId: string, state: object) {
    await this.client.set(`sess:${sessionId}`, JSON.stringify(state), 'EX', 7200)
  }
  async getSessionState(sessionId: string): Promise<any> {
    const raw = await this.client.get(`sess:${sessionId}`)
    return raw ? JSON.parse(raw) : { theta: 0, se: 99, served: [], deadline: null }
  }
  async clearSessionState(sessionId: string) {
    await this.client.del(`sess:${sessionId}`)
  }

  // ── Monotonic sequence for answer append-order ──────────────────────────────
  async nextSequence(sessionId: string): Promise<number> {
    return this.client.incr(`seq:${sessionId}`)
  }

  // ── Bulk-preview stash (2-phase bulk import) ────────────────────────────────
  async stashPreview(institutionId: string, rows: any[]) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    await this.client.set(`preview:${institutionId}:${id}`, JSON.stringify(rows), 'EX', 600)
    return id
  }
  async popPreview(institutionId: string, previewId: string): Promise<any[] | null> {
    const key = `preview:${institutionId}:${previewId}`
    const raw = await this.client.get(key)
    if (!raw) return null
    await this.client.del(key)
    return JSON.parse(raw)
  }
}
