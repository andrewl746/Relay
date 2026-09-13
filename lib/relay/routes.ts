/**
 * Where Relay's server actions send people afterwards.
 *
 * The borrow/lend screens these actions were written for aren't on main, so
 * each target is the existing screen that does the same job. When Relay gets
 * screens of its own, change the targets here rather than in the actions.
 */
export const routes = {
  /** Not signed in to Relay. */
  signIn: '/login',
  /** Signed in, but hasn't said where and when they can meet. */
  setup: '/settings',
  /** Asking for something; carries ?q=&from=&to=. */
  need: '/',
  /** What they lend. */
  shelf: '/posts',
  /** Their details and what Relay remembers. */
  profile: '/settings',
  handoffs: '/handoffs',
} as const
