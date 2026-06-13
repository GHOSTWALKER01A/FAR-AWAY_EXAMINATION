export type UserRole = 'ADMIN' | 'EXAMINER' | 'INVIGILATOR' | 'CANDIDATE'

export interface JwtPayload {
  sub: string
  role: UserRole
  institutionId: string
  perms: string[]
  iat: number
  exp: number
}
