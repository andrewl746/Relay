import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { findPerson, getProfile } from './memory.ts'
import { routes } from './routes.ts'
import type { Profile } from './runtime.ts'
import type { Person } from '../types.ts'

/**
 * Relay's own identity cookie. Deliberately not `relay-user`: the hub's demo
 * login owns that name for its mock users (lib/hub/dev-login.ts), and sharing
 * it meant signing in on one side quietly signed you out of the other.
 */
export const PERSON_COOKIE = 'relay-person'

export type Me = { id: string; person: Person; profile: Profile }

/**
 * The signed-in student, or null.
 *
 * Identity is the httpOnly `relay-person` cookie set by the sign-in actions in
 * ./ui-actions.ts. A cookie pointing at someone without a profile counts as
 * signed out, so they choose again and get one.
 */
export async function getMe(): Promise<Me | null> {
  const id = (await cookies()).get(PERSON_COOKIE)?.value
  if (!id) return null
  const person = findPerson(id)
  const profile = getProfile(id)
  if (!person || !profile) return null
  return { id, person, profile }
}

export async function requireMe({ allowUnfinished = false } = {}): Promise<Me> {
  const me = await getMe()
  if (!me) redirect(routes.signIn)
  if (!me.profile.setupDone && !allowUnfinished) redirect(routes.setup)
  return me
}
