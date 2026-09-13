import type { MatchProvider } from '../types.ts'
import { StubProvider } from './stub.ts'

/**
 * The provider seam. Abandoning a provider track should be an env var change,
 * not a refactor.
 *
 *   MATCH_PROVIDER=stub       offline, deterministic, no keys       (default)
 *   MATCH_PROVIDER=snowflake  Cortex EMBED_TEXT_1024 + COMPLETE     (not built)
 *   MATCH_PROVIDER=local      any embedding API + any chat model    (not built)
 */
export function getProvider(): MatchProvider {
  const name = process.env.MATCH_PROVIDER ?? 'stub'
  switch (name) {
    case 'stub':
      return StubProvider
    default:
      throw new Error(
        `MATCH_PROVIDER="${name}" is not implemented. Available: stub.`,
      )
  }
}
