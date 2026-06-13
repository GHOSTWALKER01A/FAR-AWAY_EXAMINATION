import { Injectable } from '@nestjs/common'
import { RedisService } from './redis.service'

@Injectable()
export class LockService {
  constructor(private redis: RedisService) {}

  async acquireSession(examId: string, userId: string, deviceToken: string) {
    const key = `lock:session:${examId}:${userId}`
    await this.redis.client.set(key, deviceToken, 'EX', 7200)
  }

  async releaseSession(examId: string, userId: string) {
    await this.redis.client.del(`lock:session:${examId}:${userId}`)
  }

  async getHolder(examId: string, userId: string): Promise<string | null> {
    return this.redis.client.get(`lock:session:${examId}:${userId}`)
  }
}
