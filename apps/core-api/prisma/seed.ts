import { PrismaClient, UserRole, ExamMode, QuestionType, Difficulty, RegistrationType } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const inst = await prisma.institution.create({ data: { name: 'Demo University' } })
  const pw = await hash('Password123!', 10)

  const [admin, examiner, invig] = await Promise.all([
    prisma.user.create({ data: { institutionId: inst.id, role: UserRole.ADMIN, name: 'Admin User', email: 'admin@demo.edu', passwordHash: pw, emailVerified: true } }),
    prisma.user.create({ data: { institutionId: inst.id, role: UserRole.EXAMINER, name: 'Examiner User', email: 'examiner@demo.edu', passwordHash: pw, emailVerified: true } }),
    prisma.user.create({ data: { institutionId: inst.id, role: UserRole.INVIGILATOR, name: 'Proctor User', email: 'proctor@demo.edu', passwordHash: pw, emailVerified: true } }),
  ])

  // calibrated question bank across all difficulties
  for (let i = 0; i < 60; i++) {
    const d = i % 3 === 0 ? Difficulty.EASY : i % 3 === 1 ? Difficulty.MEDIUM : Difficulty.HARD
    await prisma.question.create({
      data: {
        institutionId: inst.id,
        type: QuestionType.MCQ,
        stem: `Sample Question ${i}: What is 2 + ${i}?`,
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
        calibrationStatus: 'CALIBRATED',
        topicTags: ['arithmetic'],
      },
    })
  }

  console.log('🌱 Seed complete:', { institutionId: inst.id, admin: admin.email })
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
