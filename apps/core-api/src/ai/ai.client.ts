import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { createHmac } from 'crypto'
import { firstValueFrom } from 'rxjs'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

@Injectable()
export class AiClient {
  private readonly logger = new Logger(AiClient.name)
  private breakerOpenUntil = 0

  constructor(private http: HttpService, private cfg: ConfigService) {}

  private sign(body: string) {
    const ts = Math.floor(Date.now() / 1000).toString()
    const mac = createHmac('sha256', this.cfg.get('INTERNAL_SERVICE_SECRET')!)
      .update(`${ts}.${body}`)
      .digest('hex')
    return { 'X-Timestamp': ts, 'X-Signature': mac, 'Content-Type': 'application/json' }
  }

  private async call<T>(path: string, payload: unknown, opts?: { timeoutMs?: number; retries?: number }): Promise<T> {
    if (Date.now() < this.breakerOpenUntil) {
      throw new ServiceUnavailableException('AI service circuit open — using fallback')
    }
    const body = JSON.stringify(payload)
    const headers = this.sign(body)
    const retries = opts?.retries ?? 2
    let lastErr: any

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await firstValueFrom(
          this.http.post(`${this.cfg.get('AI_SVC_URL')}${path}`, body, {
            headers,
            timeout: opts?.timeoutMs ?? 8000,
          }),
        )
        return res.data
      } catch (e) {
        lastErr = e
        this.logger.warn(`AI call ${path} attempt ${attempt + 1} failed: ${e?.message}`)
        if (attempt < retries) await sleep(200 * 2 ** attempt)
      }
    }
    this.breakerOpenUntil = Date.now() + 15_000
    throw new ServiceUnavailableException(`AI service failed after ${retries + 1} attempts`)
  }

  // Hot path — short timeout, called in live exam request
  selectNextItem(payload: object) {
    return this.call<any>('/adaptive/select', payload, { timeoutMs: 3000, retries: 1 })
  }
  updateTheta(payload: object) {
    return this.call<any>('/adaptive/theta', payload, { timeoutMs: 3000, retries: 1 })
  }

  // Batch path — long timeout, called from BullMQ worker
  gradeSubjective(payload: object) {
    return this.call<any>('/grading/subjective', payload, { timeoutMs: 60000, retries: 2 })
  }
  generateQuestions(payload: object) {
    return this.call<any>('/generation', payload, { timeoutMs: 60000, retries: 1 })
  }
  computeEmbedding(payload: object) {
    return this.call<any>('/embeddings/embed', payload, { timeoutMs: 10000, retries: 1 })
  }
}
