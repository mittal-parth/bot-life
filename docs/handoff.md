# Handoff: "Life as a town" (idea 5)

Starting context for a separate ideation chat. This idea is **separate from the Excel-agent idea**. Don't merge them or design a shared engine.

> **Superseded in parts (2026-11-21).** Decisions and the build plan now live in [plan.md](plan.md). In particular: no extraction/resolve pipeline (bots call the town's MCP tools instead), no SMS bridge (iMessage via MCP), SVG instead of react-three-fiber, and OpenMausBot on Codex as the harness. The text below is the original brainstorm.

## The hackathon

Equal AI x OpenAI hackathon, theme **"Build Creative: personal context, into everyday AI products"**.
- Brief: find a real user and an unmet need.
- Ideas suggested: Camera, Drive, SMS, Mail, anything personal.
- Show us: a working journey from raw input to a useful outcome.
- Stands out: an original idea, backed by a working product.

## The idea in one line

Gmail, Calendar, Drive and bank SMS become an **isometric town**, and overdue things **decay**: an unpaid bill smokes, an unanswered mail gets a cracked window. Tap a broken building, approve the fix the agent drafted, and watch it repair.

## Why it could win

- **Originality and demo wow:** highest of all the ideas considered. Nobody else will show this.
- **Biggest risk:** "a nice skin, so what?" The answer is a **real user**:
  - **People with ADHD / executive dysfunction.** Out of sight is really out of mind for them, and inbox shame makes them avoid things. The town turns invisible guilt into something spatial, glanceable and playful.
  - Get one real interview quote for slide 1.

## Mechanics brainstormed so far

**Decay grammar** (state → visual):
- Unpaid bill → smoke, then fire.
- Unanswered mail → cracked window.
- Expiring document (passport, insurance, PUC) → scaffolding.
- Unused subscription → a lit, empty building wasting power.
- Overdue promise to a friend → their house's garden wilts.

**World structure:**
- Districts are life domains: money (bank SMS), work (mail), people (contacts/WhatsApp), body (health, prescriptions), home.
- Each counterparty is a building (HDFC is the bank building, Mom is a house).
- Weather is cash flow (rain when the balance is low and a big debit is coming).

**Core loop:** tap a smoking building → the agent has already drafted the fix (pay link, reply, cancellation) → approve → repair animation → the town heals.

**Tangents to explore:**
- **Time-slider:** drag to "next Friday" and watch the town rot. A cheap, great demo moment.
- **Year time-lapse:** a "Wrapped"-style moment.
- **Storm forecast** for next week.
- **Shared family town.**
- **Live wallpaper / home-screen widget:** the glance *is* the product.
- **"Blame":** tap a building to see its history and the message that created it.
- **Tamagotchi-style attachment.**

## Technical sketch

### Why buildability was rated 3/5

It's two projects stacked together: (1) an agent pipeline that turns messy mail/SMS into clean "open loops" and auto-closes them, and (2) a small game that needs polish. An ugly town kills the wow.

| Hard part | Why | Mitigation |
|---|---|---|
| **Auto-closing loops** | Bill email + UPI debit SMS 3 days later: is it paid? Wrong answers mean buildings smoke forever and trust is lost | Rules first (amount ±1%, merchant alias table, 10-day window), then the LLM only for ambiguous cases |
| **Dedup / entity resolution** | "HDFC" / "HDFCBK" / "hdfcbank.net" are one building | Alias table + embedding similarity |
| **Stable layout** | Buildings must not move, or spatial memory breaks | `hash(entity_id)` gives a plot in its district, persisted |
| **Art** | Hand-drawn iso sprites are a trap | 3D low-poly kits + an orthographic camera |
| **Actions** | Paying, replying and cancelling need OAuth scopes and safety | Draft only, tap to approve, UPI deep links (`upi://pay?...`), never auto-pay |
| **Live demo** | Gmail push needs Pub/Sub; SMS needs a phone bridge | Poll every 10s for the demo + a seeded persona dataset as backup |

### Pipeline

```
Gmail / Calendar / Drive / SMS (Android bridge or forwarder app) / photo upload
  → raw_items
  → EXTRACT (LLM, structured output) → loop candidates
  → RESOLVE (rules + embeddings): dedupe, link entity, auto-close
  → loops + entities (world state)
  → DECAY (pure function, no LLM): health(loop, now) → fine/dusty/cracked/smoking/fire
  → WORLD MAPPER: entity → building, district, stable plot
  → RENDERER: react-three-fiber, ortho iso camera, Kenney City Kit (CC0) GLBs, particles
  → ACTION AGENT: draft reply / calendar event / UPI link / cancellation → approve → repair
```

### Data model draft

```ts
Loop {
  id, kind: "bill"|"reply_owed"|"renewal"|"promise"|"doc_expiry"|"subscription"|"event_prep",
  entity_id, title, amount?, due_at?, created_at,
  sources: [{type:"gmail"|"sms"|"photo", ref, snippet}],   // provenance / "blame"
  status: "open"|"snoozed"|"resolved",
  resolved_by?: source_ref,
  suggested_action?: {tool, args, preview}
}
Entity { id, name, aliases[], district, plot:{x,y} }
```

Effort split (rough): extraction + resolution 40%, decay + mapper 10%, renderer 30%, actions + repair loop 20%.

### Harness constraint (applies to both ideas)

Don't build an agent harness or tool-calling layer. Sit on an existing one: the OpenAI Agents API (sessions + scheduled automations), Codex SDK/CLI, [OpenMausBot](https://github.com/milind-soni/OpenMausBot) (local, Composio connectors, proactive routines, MCP server), or [OpenDots](https://github.com/CopilotKit/OpenDots) (AG-UI, CopilotKit). The town is a new *surface* over that harness.

Practical notes:
- Bank SMS needs Android; iOS can't read SMS in general.
- On a phone, an open-weight local model isn't realistic yet; a laptop is fine.

## Open questions for the next chat

1. Who exactly is the user (ADHD adults? students? the household finance person?), and what is the one interview quote?
2. What's the smallest town that still wows: one district (money) or all of them?
3. Does the town need real connectors for the demo, or is a seeded persona plus one live input (send yourself an email → a window cracks) enough?
4. Where does it live: web app, home-screen widget, or live wallpaper?
5. Is decay purely time-based, or also emotional (relationships)? How do we avoid it becoming a guilt machine?
6. Which harness fits best, given the town mostly needs *reading + extraction + drafted actions*?
