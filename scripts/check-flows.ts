/**
 * End-to-end check of the redesigned journeys, through the real server actions.
 * Run with the dev server up:
 *
 *   node --experimental-strip-types scripts/check-flows.ts
 *
 * Posts forms the way a browser without JavaScript would — Next renders every
 * server-action form with its action id as a hidden field — so this exercises
 * exactly the code a person's clicks run. It writes to data/runtime.json and
 * puts the previous contents back when it finishes; set KEEP=1 to leave the
 * test student in place (useful for screenshots).
 */
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'

const base = process.env.RELAY_URL ?? 'http://localhost:4287'
const runtimeFile = 'data/runtime.json'
const before = existsSync(runtimeFile) ? readFileSync(runtimeFile, 'utf8') : null

type Jar = { cookie: string }
type Field = { name: string; value: string; type: string }
type Form = { fields: Field[]; text: string }
type Page = { status: number; loc: string; html: string }

const decode = (s: string) =>
  s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
const text = (html: string) =>
  decode(html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '))
const path = (loc: string) => {
  if (!loc) return ''
  const u = new URL(loc, base)
  return u.pathname + u.search
}

async function get(jar: Jar, p: string): Promise<Page> {
  const r = await fetch(base + p, { headers: { cookie: jar.cookie }, redirect: 'manual' })
  return { status: r.status, loc: r.headers.get('location') ?? '', html: await r.text() }
}

function forms(html: string): Form[] {
  return [...html.matchAll(/<form\b[^>]*>([\s\S]*?)<\/form>/g)].map((m) => {
    const fields: Field[] = []
    for (const t of m[1].matchAll(/<input\b[^>]*>/g)) {
      const name = /\bname="([^"]*)"/.exec(t[0])?.[1]
      const value = /\bvalue="([^"]*)"/.exec(t[0])?.[1] ?? ''
      const type = /\btype="([^"]*)"/.exec(t[0])?.[1] ?? 'text'
      if (name) fields.push({ name: decode(name), value: decode(value), type })
    }
    return { fields, text: text(m[1]) }
  })
}

const has = (form: Form, name: string) => form.fields.some((f) => f.name === name)
const hidden = (form: Form | undefined, name: string) =>
  form?.fields.find((f) => f.name === name && f.type === 'hidden')?.value

/** Submit a form: its hidden fields (action id included) plus whatever the person chose. */
async function post(jar: Jar, p: string, form: Form | undefined, entries: [string, string][] = []) {
  if (!form) return { status: 0, loc: 'form not found' }
  const body = new FormData()
  for (const f of form.fields) if (f.type === 'hidden') body.append(f.name, f.value)
  for (const [k, v] of entries) body.append(k, v)
  const r = await fetch(base + p, {
    method: 'POST',
    body,
    headers: { cookie: jar.cookie, origin: base },
    redirect: 'manual',
  })
  for (const c of r.headers.getSetCookie()) {
    const pair = c.split(';')[0]
    if (pair.startsWith('relay-user=')) jar.cookie = pair === 'relay-user=' ? '' : pair
  }
  return { status: r.status, loc: r.headers.get('location') ?? '' }
}

let passed = 0
let failed = 0
function check(label: string, ok: boolean, detail: string | number = '') {
  if (ok) passed++
  else failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail !== '' ? `  -- ${detail}` : ''}`)
}

async function newStudent() {
  console.log('--- a new student borrows, then lends ---')
  const jar: Jar = { cookie: '' }

  let page = await get(jar, '/hello')
  check('hello renders', page.status === 200, page.status)
  let res = await post(jar, '/hello', forms(page.html).find((f) => has(f, 'name') && !has(f, 'personId')), [['name', 'Test S.']])
  check('start -> /start, signed in', res.status === 303 && path(res.loc) === '/start' && jar.cookie.startsWith('relay-user=u-p-'), `${res.status} ${res.loc}`)

  page = await get(jar, '/')
  check('unfinished setup is sent to /start', page.status === 307 && path(page.loc) === '/start', `${page.status} ${page.loc}`)

  page = await get(jar, '/start')
  res = await post(jar, '/start', forms(page.html).find((f) => has(f, 'neighbourhood')), [
    ['name', 'Test S.'],
    ['neighbourhood', 'Lester'],
    ['windows', 'afternoon'],
    ['windows', 'evening'],
    ['awayFrom', ''],
    ['awayUntil', ''],
  ])
  check('setup saves -> /', res.status === 303 && path(res.loc) === '/', `${res.status} ${res.loc}`)

  page = await get(jar, '/')
  check('need page greets them by name', page.status === 200 && text(page.html).includes('Welcome, Test'), page.status)

  res = await post(jar, '/', forms(page.html).find((f) => has(f, 'q')), [
    ['q', 'need a drill saturday, putting up shelves'],
    ['from', '2026-10-03'],
    ['to', '2026-10-05'],
  ])
  const results = path(res.loc)
  check('find -> results', res.status === 303 && results.startsWith('/?q='), `${res.status} ${res.loc}`)

  page = await get(jar, results)
  let body = text(page.html)
  check('results show routed answers', page.status === 200 && /has one\./.test(body), `${(body.match(/has one\./g) ?? []).length} answer(s)`)
  console.log('      lead:', /\S+ has one\./.exec(body)?.[0], '|', /You hand it to [^.]*\.|goes back to [^.]*\.|It's yours once you collect it\./.exec(body)?.[0] ?? '(no next-hop line)')

  let cards = forms(page.html).filter((f) => hidden(f, 'itemId'))
  const dismissed = hidden(cards[0], 'itemId')
  res = await post(jar, results, cards[1])
  check('not this one -> back to results', res.status === 303 && path(res.loc).startsWith('/?q='), `${res.status} ${res.loc}`)

  page = await get(jar, results)
  cards = forms(page.html).filter((f) => hidden(f, 'itemId'))
  check('the dismissed item is not offered again', !cards.some((f) => hidden(f, 'itemId') === dismissed), `was ${dismissed}, lead now ${hidden(cards[0], 'itemId') ?? 'none'}`)

  if (cards.length > 0) {
    res = await post(jar, results, cards[0])
    const booked = path(res.loc)
    check('book it -> /handoffs?booked=', res.status === 303 && booked.startsWith('/handoffs?booked='), `${res.status} ${res.loc}`)
    page = await get(jar, booked)
    body = text(page.html)
    check('handoffs confirms the booking with a pickup slip', page.status === 200 && body.includes('Booked.') && body.includes('Pick up'), /Booked\. [^;]*;/.exec(body)?.[0] ?? '')
    const receipt = /href="(\/handoffs\/u-h-[^"]+)"/.exec(page.html)?.[1] ?? '/handoffs/missing'
    page = await get(jar, receipt)
    check('receipt renders', page.status === 200 && text(page.html).includes('Receipt'), receipt)
  } else {
    check('an alternative remained to book', false)
  }

  page = await get(jar, '/shelf')
  res = await post(jar, '/shelf', forms(page.html).find((f) => has(f, 'deal')), [
    ['text', 'folding table + 4 chairs, good for a party. lester'],
    ['deal', 'rent'],
    ['price', '6'],
    ['freeFrom', '2026-09-13'],
    ['freeUntil', '2027-01-01'],
  ])
  check('lend -> /shelf?added=', res.status === 303 && path(res.loc).startsWith('/shelf?added='), `${res.status} ${res.loc}`)
  page = await get(jar, path(res.loc))
  body = text(page.html)
  check('shelf shows the new item', page.status === 200 && body.includes('On your shelf.') && body.includes('folding table'), /On your shelf\. [^.]*\./.exec(body)?.[0] ?? '')

  page = await get(jar, '/you')
  body = text(page.html)
  check(
    '/you shows what is remembered',
    page.status === 200 && body.includes('need a drill saturday') && body.includes('Hidden from your answers 1'),
    (body.match(/Recent asks \d+|Hidden from your answers \d+|Handoffs marked done \d+/g) ?? []).join(' · '),
  )

  page = await get(jar, '/network')
  check('network renders', page.status === 200, page.status)
  return jar.cookie
}

async function returningNeighbour() {
  console.log('--- a returning neighbour checks their shelf and handoffs ---')
  const jar: Jar = { cookie: '' }

  let page = await get(jar, '/hello')
  let res = await post(jar, '/hello', forms(page.html).find((f) => hidden(f, 'personId') === 'p9'))
  check('continue as p9 -> /', res.status === 303 && path(res.loc) === '/' && jar.cookie === 'relay-user=p9', `${res.status} ${res.loc}`)

  page = await get(jar, '/shelf')
  let body = text(page.html)
  check('their shelf shows routes', page.status === 200 && (body.match(/Held by \d+/g) ?? []).length >= 3, (body.match(/Held by \d+ \w+/g) ?? []).join(' | '))

  page = await get(jar, '/handoffs')
  body = text(page.html)
  check('their handoffs list slips', page.status === 200 && /To give \d+/.test(body), (body.match(/To give \d+|To collect \d+/g) ?? []).join(' · '))

  page = await get(jar, '/you')
  res = await post(jar, '/you', forms(page.html).find((f) => f.text.includes('Sign out')))
  check('sign out -> /hello', res.status === 303 && path(res.loc) === '/hello' && jar.cookie === '', `${res.status} ${res.loc}`)

  page = await get(jar, '/')
  check('signed out is gated again', page.status === 307 && path(page.loc) === '/hello', `${page.status} ${page.loc}`)
}

try {
  const cookie = await newStudent()
  await returningNeighbour()
  console.log(`\n${passed} passed, ${failed} failed.${process.env.KEEP ? ` Kept test student: ${cookie}` : ''}`)
} finally {
  if (!process.env.KEEP) {
    if (before === null) rmSync(runtimeFile, { force: true })
    else writeFileSync(runtimeFile, before)
  }
  process.exitCode = failed > 0 ? 1 : 0
}
