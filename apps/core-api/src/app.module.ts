import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { loadConfig } from './config/configuration'
import { AuthGuard } from './common/guards/auth.guard'
import { PrismaModule } from './prisma/prisma.module'
import { RedisModule } from './redis/redis.module'
import { AiModule } from './ai/ai.module'
import { QueueModule } from './queue/queue.module'
import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'
import { ExamsModule } from './modules/exams/exams.module'
import { SectionsModule } from './modules/sections/sections.module'
import { QuestionsModule } from './modules/questions/questions.module'
import { EnrolmentModule } from './modules/enrolment/enrolment.module'
import { SessionsModule } from './modules/sessions/sessions.module'
import { ProctoringModule } from './modules/proctoring/proctoring.module'
import { EvaluationModule } from './modules/evaluation/evaluation.module'
import { ResultsModule } from './modules/results/results.module'
import { GrievanceModule } from './modules/grievance/grievance.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [loadConfig] }),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    AiModule,
    QueueModule,
    // AuthModule must come before any module that uses JwtService
    // (it is @Global so JwtService is available everywhere after this)
    AuthModule,
    UsersModule,
    ExamsModule,
    SectionsModule,
    QuestionsModule,
    EnrolmentModule,
    SessionsModule,
    ProctoringModule,
    EvaluationModule,
    ResultsModule,
    GrievanceModule,
  ],
  providers: [
    // Global JWT guard — every HTTP route is protected by default.
    // Mark public endpoints with @Public() from common/decorators/public.decorator.ts
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}
