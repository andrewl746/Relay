import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { USER_COOKIE } from '../hub/dev-login.ts'
import { findPerson, getProfile } from './memory.ts'
import type { Profile } from './runtime.ts'
import type { Person } from '../types.ts'

export type Me = { id: string; person: Person; profile: Profile }

/**
 * The signed-in student, or null.
 *
 * Identity is the httpOnly `relay-user` cookie set by the actions on /hello.
 * A cookie pointing at someone without a profile (for example one set by the
 * old demo picker) counts as signed out, so they choose again and get one.
 */
export async function getMe(): Promise<Me | null> {
  const id = (await cookies()).get(USER_COOKIE)?.value
  if (!id) return null
  const person = findPerson(id)
  const profile = getProfile(id)
  if (!person || !profile) return null
  return { id, person, profile }
}

export async function requireMe({ allowUnfinished = false } = {}): Promise<Me> {
  const me = await getMe()
  if (!me) redirect('/hello')
  if (!me.profile.setupDone && !allowUnfinished) redirect('/start')
  return me
}
