import { IoAdapter } from '@nestjs/platform-socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import Redis from 'ioredis'

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>

  async connectToRedis() {
    const pub = new Redis(process.env.REDIS_URL!)
    const sub = pub.duplicate()
    this.adapterConstructor = createAdapter(pub, sub)
  }

  createIOServer(port: number, options?: any) {
    const server = super.createIOServer(port, options)
    server.adapter(this.adapterConstructor)
    return server
  }
}
