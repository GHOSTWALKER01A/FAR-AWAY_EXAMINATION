import { PrismaClient, UserRole, QuestionType, Difficulty } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

// Fixed UUID so re-running the seed never creates duplicate rows
const DEMO_INST_ID = '00000000-0000-0000-0000-000000000001'

async function main() {
  // ── Institution ─────────────────────────────────────────────────────────────
  const inst = await prisma.institution.upsert({
    where: { id: DEMO_INST_ID },
    update: { name: 'Demo University' },
    create: { id: DEMO_INST_ID, name: 'Demo University' },
  })

  const pw = await hash('Password123!', 10)

  // ── Staff users ──────────────────────────────────────────────────────────────
  const [admin, examiner, invig] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@demo.edu' },
      update: {},
      create: {
        institutionId: inst.id,
        role: UserRole.ADMIN,
        name: 'Admin User',
        email: 'admin@demo.edu',
        passwordHash: pw,
        emailVerified: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'examiner@demo.edu' },
      update: {},
      create: {
        institutionId: inst.id,
        role: UserRole.EXAMINER,
        name: 'Examiner User',
        email: 'examiner@demo.edu',
        passwordHash: pw,
        emailVerified: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'proctor@demo.edu' },
      update: {},
      create: {
        institutionId: inst.id,
        role: UserRole.INVIGILATOR,
        name: 'Proctor User',
        email: 'proctor@demo.edu',
        passwordHash: pw,
        emailVerified: true,
      },
    }),
  ])

  // ── Demo student (OTP login — uses 000000 master OTP in dev) ─────────────────
  await prisma.user.upsert({
    where: { email: 'student@demo.edu' },
    update: {},
    create: {
      institutionId: inst.id,
      role: UserRole.CANDIDATE,
      name: 'Demo Student',
      email: 'student@demo.edu',
      emailVerified: true,
      // No passwordHash — students always authenticate via OTP
    },
  })

  // ── Question bank (60 calibrated MCQs) ──────────────────────────────────────
  const existingCount = await prisma.question.count({ where: { institutionId: inst.id } })
  if (existingCount === 0) {
    const questions = Array.from({ length: 60 }, (_, i) => {
      const d = i % 3 === 0 ? Difficulty.EASY : i % 3 === 1 ? Difficulty.MEDIUM : Difficulty.HARD
      return {
        institutionId: inst.id,
        type: QuestionType.MCQ,
        stem: `Sample Question ${i + 1}: What is 2 + ${i}?`,
        options: [
          { id: 'a', text: `${2 + i}` },
          { id: 'b', text: `${3 + i}` },
          { id: 'c', text: `${1 + i}` },
          { id: 'd', text: `${4 + i}` },
        ],
        correctKey: { optionIds: ['a'] },
        marks: 1,
        difficulty: d,
        irtA: 1.0,
        irtB: d === Difficulty.EASY ? -1.0 : d === Difficulty.MEDIUM ? 0.0 : 1.2,
        irtC: 0.25,
        calibrationStatus: 'CALIBRATED' as const,
        topicTags: ['arithmetic'],
      }
    })
    await prisma.question.createMany({ data: questions })
  }

  console.log('\n✅ Seed complete\n')
  console.log('  Institution :', inst.id, '—', inst.name)
  console.log('\n  Demo accounts (password: Password123!)')
  console.log('  ┌─ Admin       admin@demo.edu')
  console.log('  ├─ Examiner    examiner@demo.edu')
  console.log('  ├─ Invigilator proctor@demo.edu')
  console.log('  └─ Student     student@demo.edu  (OTP login — use 000000 in dev)')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
