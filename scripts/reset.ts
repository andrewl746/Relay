/** Wipe user-created rows before a demo run. Run: npm run reset */
import { clearRuntime } from '../lib/relay/runtime.ts'
clearRuntime()
console.log('runtime cleared - seed corpus untouched')
