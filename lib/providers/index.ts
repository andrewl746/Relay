import type { MatchProvider } from '../types.ts'
import { StubProvider } from './stub.ts'
import { SnowflakeProvider, snowflakeMeta } from './snowflake.ts'

/**
 * The provider seam. Abandoning a provider track should be an env var change,
 * not a refactor.
 *
 *   MATCH_PROVIDER=stub       offline, deterministic, no keys       (default)
 *   MATCH_PROVIDER=snowflake  Cortex inference:embed + chat/completions
 */
export function providerName(): string {
  return process.env.MATCH_PROVIDER ?? 'stub'
}

export function getProvider(): MatchProvider {
  const name = providerName()
  switch (name) {
    case 'stub':
      return StubProvider
    case 'snowflake':
      return SnowflakeProvider
    default:
      throw new Error(
        `MATCH_PROVIDER="${name}" is not implemented. Available: stub, snowflake.`,
      )
  }
}

/**
 * What the current provider will produce. Stamped into dataset.json by the
 * pipeline so a later run can refuse to mix vector spaces.
 *
 * This guard is not theoretical: the stub emits 256 dimensions and Cortex emits
 * 768 or 1024, and lib/vector.cosine compares over min(a.length, b.length). A
 * mixed dataset would not crash — it would quietly return meaningless
 * similarities, which is far worse.
 */
export function providerMeta(): {
  provider: string
  embedModel: string
  chatModel: string | null
  dim: number | null
} {
  return providerName() === 'snowflake'
    ? snowflakeMeta()
    : { provider: 'stub', embedModel: 'hashed-bag-256', chatModel: null, dim: 256 }
}
