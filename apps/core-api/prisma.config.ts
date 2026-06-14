import { defineConfig } from 'prisma/config'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Prisma 7 skips .env auto-loading when prisma.config.ts is present — load manually.
dotenv.config({ path: path.resolve(__dirname, '.env') })

export default defineConfig({
  schema: './prisma/schema.prisma',

  // Classic engine: uses the Prisma binary for `migrate dev/deploy/reset`.
  // URLs are NOT in schema.prisma anymore (Prisma 7 breaking change).
  // directUrl bypasses pgBouncer for migrations (safe for DDL statements).
  engine: 'classic',
  datasource: {
    url: process.env.DATABASE_URL!,
    directUrl: process.env.DIRECT_URL,
  },
})
