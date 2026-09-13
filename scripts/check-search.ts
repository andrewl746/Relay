/**
 * The bookshelf test: someone types the word they know, not the word the
 * seller typed. Run with `npm run check:search`.
 */
import assert from 'node:assert/strict'
import { searchTerms } from '../lib/hub/search.ts'

const matches = (query: string, text: string) =>
  searchTerms(query).every((group) => group.some((w) => text.toLowerCase().includes(w)))

// the one that was broken
assert.ok(matches('bookshelf', '3-shelf bookcase'), 'bookshelf should find a bookcase')
assert.ok(matches('bookcase', '5-shelf bookcase, solid pine'))

// synonyms are OR'd, tokens are AND'd — "desk lamp" is not any desk
assert.ok(matches('desk lamp', 'Desk lamp with USB port'))
assert.ok(!matches('desk lamp', 'IKEA Micke desk, white'))

// filler words don't make a query impossible to satisfy
assert.ok(matches('I need a mini fridge', 'Danby mini fridge, 3.1 cu ft'))

// a word with no group still matches literally, and still excludes
assert.ok(matches('danby', 'Danby mini fridge'))
assert.ok(!matches('danby', 'Mesh desk chair'))

console.log('search ok')
