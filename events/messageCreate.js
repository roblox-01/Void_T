const storage = require('../utils/storage')
const fs = require('fs')
module.exports = {
  name: 'messageCreate',
  async execute (message) {
    if (!message.guild) return
    const files = fs.readdirSync(storage.paths.tickets).filter(f => f.endsWith('.json'))
    for (const f of files) {
      const t = storage.readJSON(`${storage.paths.tickets}/${f}`)
      if (!t) continue
      if (t.channelId === message.channel.id && t.status === 'OPEN') {
        t.lastActivity = Date.now()
        storage.writeJSON(`${storage.paths.tickets}/${f}`, t)
        break
      }
    }
  }
}
