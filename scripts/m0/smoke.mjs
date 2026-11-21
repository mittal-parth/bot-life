import { randomUUID } from 'node:crypto'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const [bot, thread] = process.argv.slice(2)
if (!bot || !thread || typeof EventSource === 'undefined') {
  console.error('Usage: node --experimental-eventsource scripts/m0/smoke.mjs BOT_ID THREAD_ID')
  process.exit(2)
}
const port = Number(process.env.OMB_PORT || 8799)
const base = new URL('http://127.0.0.1:' + port)
const signal = AbortSignal.timeout(120_000)
async function post(path, body) {
  const response = await fetch(new URL(path, base), {
    method: 'POST', redirect: 'error', signal,
    headers: { 'Content-Type': 'application/json', ...(process.env.OPENMAUSBOT_TOKEN && { Authorization: 'Bearer ' + process.env.OPENMAUSBOT_TOKEN }) },
    body: JSON.stringify(body)
  })
  if (!response.ok) throw new Error(path + ' returned HTTP ' + response.status)
  return response.json()
}

const challenge = randomUUID()
const receipt = randomUUID()
const directory = join(tmpdir(), 'town-spike-' + challenge)
await mkdir(directory, { mode: 0o700 })
let stream
try {
  await writeFile(join(directory, 'receipt'), receipt, { mode: 0o600 })
  const { ticket } = await post('/api/auth/stream-ticket', {})
  const url = new URL('/api/events?screens=off&frames=thread', base)
  if (ticket) url.searchParams.set('ticket', ticket)
  stream = new EventSource(url)
  await new Promise((resolve, reject) => {
    let sent = false
    signal.addEventListener('abort', () => reject(new Error('Timed out waiting for the bot receipt')), { once: true })
    stream.onerror = () => reject(new Error('Harness event stream disconnected'))
    stream.onmessage = ({ data }) => {
      try {
        const frame = JSON.parse(data)
        if (frame.kind === 'hello' && !sent) {
          sent = true
          post('/api/bots/' + encodeURIComponent(bot) + '/messages', {
            threadId: thread, sendId: randomUUID(),
            text: 'Call the town_ping MCP tool with challenge ' + challenge + '. Reply with its receipt.'
          }).catch(reject)
        }
        if (sent && frame.kind === 'message' && frame.threadId === thread &&
            frame.message?.role === 'bot' && frame.message.kind === 'text' && frame.message.text?.includes(receipt)) resolve()
      } catch (error) { reject(error) }
    }
  })
  console.log('Received the probe receipt in the selected bot thread.')
} catch (error) {
  console.error(error.message, error.cause?.code ?? '')
  process.exitCode = 1
} finally {
  stream?.close()
  await rm(directory, { recursive: true })
}
