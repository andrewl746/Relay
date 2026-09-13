-- Relay corpus in Snowflake. Run on a fresh account:  Snowsight -> SQL file -> Run all
--
-- CORTEX AI IS GATED ON TRIAL ACCOUNTS. Verified twice, 2026-09-13:
--   30-day trial  (yclkqnw-kf57737) and
--   120-day STUDENT trial (nakkqzo-wk53488) -- the one the handbook promises.
--
--   AI_EMBED                      -> "not available for trial accounts"
--   AI_COMPLETE                   -> "not available for trial accounts"
--   SNOWFLAKE.CORTEX.EMBED_TEXT_768 -> "not available for trial accounts"
--   SNOWFLAKE.CORTEX.COMPLETE     -> "not available for trial accounts"
--   VECTOR_COSINE_SIMILARITY      -> WORKS
--   ALTER ACCOUNT SET CORTEX_ENABLED_CROSS_REGION='ANY_REGION' -> ran clean,
--     changed nothing. It is a SKU gate, not a region problem.
--
-- So the LLM functions are unavailable but the vector engine is not. That still
-- leaves a real and defensible use of Snowflake:
--
--   corpus lives here  ->  embeddings stored as VECTOR columns
--                      ->  retrieval runs HERE as SQL vector search
--   only the embedding FUNCTION moves off-platform (lib/providers/*)
--
-- Ask an organizer before writing the track off: if Cortex is gated for
-- everyone, every Snowflake-track team is blocked and they need to know.

CREATE DATABASE IF NOT EXISTS RELAY;
CREATE SCHEMA IF NOT EXISTS RELAY.CORE;

CREATE OR REPLACE TABLE RELAY.CORE.PEOPLE (
  id STRING, label STRING, location STRING,
  away_from DATE, away_until DATE
);

CREATE OR REPLACE TABLE RELAY.CORE.ITEMS (
  id STRING, holder_id STRING, raw_text STRING,
  deal STRING,            -- 'rent' | 'sale'
  price NUMBER,           -- per day for rent, total for sale
  free_from DATE, free_until DATE,
  embedding VECTOR(FLOAT, 256)   -- 256 = the stub's dimension; 768/1024 with Cortex
);

CREATE OR REPLACE TABLE RELAY.CORE.NEEDS (
  id STRING, person_id STRING, raw_text STRING,
  need_from DATE, need_until DATE,
  embedding VECTOR(FLOAT, 256)
);

-- Retrieval, the shape lib/match.ts calls. Top-K candidates for one need.
-- SELECT i.id, VECTOR_COSINE_SIMILARITY(i.embedding, n.embedding) AS sim
-- FROM RELAY.CORE.ITEMS i, RELAY.CORE.NEEDS n
-- WHERE n.id = ? ORDER BY sim DESC LIMIT 10;
