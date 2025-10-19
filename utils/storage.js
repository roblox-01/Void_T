const fs = require('fs')
const path = require('path')
const base = path.join(__dirname, '..', 'data')
const guilds = path.join(base, 'guilds')
const tickets = path.join(base, 'tickets')
const vouches = path.join(base, 'vouches')
const transcripts = path.join(base, 'transcripts')
if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true })
if (!fs.existsSync(guilds)) fs.mkdirSync(guilds, { recursive: true })
if (!fs.existsSync(tickets)) fs.mkdirSync(tickets, { recursive: true })
if (!fs.existsSync(vouches)) fs.mkdirSync(vouches, { recursive: true })
if (!fs.existsSync(transcripts)) fs.mkdirSync(transcripts, { recursive: true })
function readJSON(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch (e) {
    return null
  }
}
function writeJSON(p, o) {
  fs.writeFileSync(p, JSON.stringify(o, null, 2))
}
function guildConfig(gid) {
  const p = path.join(guilds, `${gid}.json`)
  if (!fs.existsSync(p)) {
    const cfg = { guildId: gid, ticketCategoryId: null, managementRoles: [], ticketLogChannelId: null, vouchChannelId: null, autocloseMinutes: 1440, ticketCounter: 0 }
    writeJSON(p, cfg)
    return cfg
  }
  return readJSON(p)
}
async function saveTranscript(client, ticket) {
  const guild = await client.guilds.fetch(ticket.guildId).catch(() => null)
  if (!guild) return null
  const channel = await guild.channels.fetch(ticket.channelId).catch(() => null)
  if (!channel || !channel.isTextBased()) return null
  let messages = []
  let lastId = null
  while (true) {
    const fetched = await channel.messages.fetch({ limit: 100, before: lastId }).catch(() => null)
    if (!fetched) break
    const arr = Array.from(fetched.values())
    if (!arr.length) break
    messages = messages.concat(arr)
    lastId = arr[arr.length - 1].id
    if (fetched.size < 100) break
  }
  messages = messages.reverse()
  const htmlParts = []
  htmlParts.push(`<html><head><meta charset="utf-8"><title>Transcript ${ticket.id}</title><style>body{background:#0f0f0f;color:#e6e6e6;font-family:Arial,Helvetica,sans-serif} .msg{padding:8px;border-bottom:1px solid #222} .meta{font-size:12px;color:#9a9a9a}</style></head><body>`)
  htmlParts.push(`<h2>Ticket #${ticket.number} — ${ticket.id}</h2>`)
  for (const m of messages) {
    const author = m.author ? `${m.author.username}#${m.author.discriminator}` : 'Unknown'
    const time = new Date(m.createdTimestamp).toLocaleString()
    const content = m.content ? m.content.replace(/</g, '&lt;').replace(/>/g, '&gt;') : ''
    let attachments = ''
    if (m.attachments && m.attachments.size) {
      attachments = '<br>Attachments: ' + m.attachments.map(a => `<a href="${a.url}">${a.name}</a>`).join(', ')
    }
    htmlParts.push(`<div class="msg"><div class="meta">${author} • ${time}</div><div class="content">${content}${attachments}</div></div>`)
  }
  htmlParts.push(`</body></html>`)
  const html = htmlParts.join('\n')
  const filename = `transcript_${ticket.id}_${Date.now()}.html`
  const outPath = path.join(transcripts, filename)
  fs.writeFileSync(outPath, html)
  return outPath
}
module.exports = { readJSON, writeJSON, guildConfig, paths: { guilds, tickets, vouches, transcripts }, saveTranscript }
