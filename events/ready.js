const path = require('path')
const fs = require('fs')
const storage = require('../utils/storage')
module.exports = {
  name: 'ready',
  once: true,
  execute (client) {
    setInterval(async () => {
      try {
        const files = fs.readdirSync(storage.paths.tickets).filter(f => f.endsWith('.json'))
        for (const f of files) {
          const t = storage.readJSON(path.join(storage.paths.tickets, f))
          if (!t) continue
          if (t.status === 'OPEN' && t.autocloseMinutes) {
            const age = (Date.now() - t.lastActivity) / 60000
            if (age > t.autocloseMinutes) {
              t.status = 'CLOSED'
              storage.writeJSON(path.join(storage.paths.tickets, f), t)
              const cfg = storage.guildConfig(t.guildId)
              const guild = await client.guilds.fetch(t.guildId).catch(() => null)
              if (!guild) continue
              const channel = await guild.channels.fetch(t.channelId).catch(() => null)
              if (channel && channel.isTextBased()) {
                await channel.send({ embeds: [{ title: 'Ticket closed (auto)', description: 'Closed due to inactivity', color: 16711680 }] }).catch(() => {})
              }
              const transcriptPath = await storage.saveTranscript(client, t)
              if (cfg.ticketLogChannelId && transcriptPath) {
                const logCh = await guild.channels.fetch(cfg.ticketLogChannelId).catch(() => null)
                if (logCh && logCh.isTextBased()) {
                  await logCh.send({ content: `Transcript for ticket #${t.number} (${t.id})`, files: [transcriptPath] }).catch(() => {})
                }
              }
            }
          }
        }
      } catch (e) {}
    }, 5 * 60 * 1000)
  }
}
