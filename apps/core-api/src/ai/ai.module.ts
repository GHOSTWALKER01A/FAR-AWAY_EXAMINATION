import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { AiClient } from './ai.client'

@Module({
  imports: [HttpModule],
  providers: [AiClient],
  exports: [AiClient],
})
export class AiModule {}
