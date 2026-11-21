import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createInterface } from 'node:readline'

const name = 'town_ping'
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const tool = {
  name, description: 'Return the receipt for a local town smoke test.',
  inputSchema: { type: 'object', properties: { challenge: { type: 'string' } }, required: ['challenge'] }
}

for await (const line of createInterface({ input: process.stdin })) {
  let id = null
  try {
    const call = JSON.parse(line)
    if (call.id === undefined) continue
    id = call.id
    let result
    switch (call.method) {
      case 'initialize':
        result = {
          protocolVersion: ['2024-11-05', '2025-03-26', '2025-06-18', '2025-11-25'].includes(call.params?.protocolVersion)
            ? call.params.protocolVersion : '2025-11-25',
          capabilities: { tools: {} }, serverInfo: { name: 'town-spike', version: '1' }
        }
        break
      case 'ping': result = {}; break
      case 'tools/list': result = { tools: [tool] }; break
      case 'tools/call': {
        const challenge = call.params?.arguments?.challenge
        if (call.params?.name !== name || typeof challenge !== 'string' || !uuid.test(challenge)) {
          throw { code: -32602, message: 'Expected town_ping with a challenge UUID' }
        }
        const receipt = await readFile(join(tmpdir(), 'town-spike-' + challenge, 'receipt'), 'utf8')
        result = { content: [{ type: 'text', text: receipt }] }
        break
      }
      default: throw { code: -32601, message: 'Unknown method' }
    }
    console.log(JSON.stringify({ jsonrpc: '2.0', id, result }))
  } catch (error) {
    const code = Number.isInteger(error.code) ? error.code : -32603
    console.log(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message: code === -32603 ? 'Probe request failed' : error.message } }))
  }
}
