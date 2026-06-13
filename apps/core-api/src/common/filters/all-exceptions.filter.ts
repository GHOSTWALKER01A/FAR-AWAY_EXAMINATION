import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common'
import { Response } from 'express'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private logger = new Logger('ExceptionFilter')

  catch(ex: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const res = ctx.getResponse<Response>()
    const isHttp = ex instanceof HttpException
    const status = isHttp ? ex.getStatus() : 500
    const payload = isHttp ? ex.getResponse() : 'Internal server error'
    if (status >= 500) this.logger.error(ex)
    res.status(status).json({
      success: false,
      error: {
        code: status,
        message: typeof payload === 'string' ? payload : (payload as any).message,
      },
      timestamp: new Date().toISOString(),
    })
  }
}
