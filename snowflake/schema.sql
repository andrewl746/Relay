-- Relay corpus in Snowflake. Run on a fresh account:  Snowsight -> SQL file -> Run all
--
-- TRIAL LIMITATION, verified 2026-09-13 on a standard 30-day trial:
--   AI_EMBED    -> "AI function _AI_EMBED_WITH_PROMPT_1024 is not available for trial accounts"
--   AI_COMPLETE -> "AI function _COMPLETE_WITH_PROMPT_HISTORY_LLM is not available for trial accounts"
--   VECTOR_COSINE_SIMILARITY -> works
--
-- So the LLM functions are gated but the vector engine is not. The PivotHacks
-- handbook promises a *120-day student trial*, which is a different SKU -- get
-- that one from an organizer before writing off the track.
--
-- Fallback if Cortex stays gated: embed locally, store the vectors here, and
-- run retrieval as SQL. The corpus and the similarity search still live in
-- Snowflake; only the embedding function moves.

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
