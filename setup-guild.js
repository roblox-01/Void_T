const fs = require('fs')
const path = require('path')
const readline = require('readline')
const { REST } = require('@discordjs/rest')
const { Routes } = require('discord-api-types/v10')
const base = path.join(__dirname, 'data', 'guilds')
if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true })
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
function q (s) { return new Promise(r => rl.question(s, r)) }
;(async () => {
  const banner = [
    '██████   ██████  ██ ██   ██ ████████ ████████',
    '██   ██ ██    ██ ██ ██  ██     ██       ██   ',
    '██████  ██    ██ ██ █████     ██       ██   ',
    '██      ██    ██ ██ ██  ██    ██       ██   ',
    '██       ██████  ██ ██   ██   ██       ██   '
  ]
  console.log(banner.join('\n'))
  const token = await q('Bot token (will be saved to .env): ')
  const clientId = await q('Bot client ID: ')
  const guildId = await q('Guild ID to set up: ')
  const ticketCategoryId = await q('Ticket Category ID (blank for none): ')
  const management = await q('Comma separated management role IDs (blank for none): ')
  const ticketLogChannelId = await q('Ticket Log Channel ID (blank for none): ')
  const vouchChannelId = await q('Vouch Channel ID (blank for none): ')
  const autoclose = await q('Autoclose minutes (default 1440): ')
  const cfg = { guildId, ticketCategoryId: ticketCategoryId || null, managementRoles: management ? management.split(',').map(s => s.trim()).filter(Boolean) : [], ticketLogChannelId: ticketLogChannelId || null, vouchChannelId: vouchChannelId || null, autocloseMinutes: parseInt(autoclose) || 1440, ticketCounter: 0 }
  fs.writeFileSync(path.join(base, `${guildId}.json`), JSON.stringify(cfg, null, 2))
  fs.writeFileSync('.env', `DISCORD_TOKEN=${token}\nCLIENT_ID=${clientId}\n`)
  const rest = new REST({ version: '10' }).setToken(token)
  const commands = [
    { name: 'ticket', description: 'Ticket commands', options: [{ name: 'create', type: 1, description: 'Create a ticket' }, { name: 'stats', type: 1, description: 'Show ticket claim stats' }] },
    { name: 'vouch', description: 'Vouch for a user', options: [{ name: 'user', description: 'User to vouch for', type: 6, required: true }, { name: 'reason', description: 'Reason', type: 3, required: false }, { name: 'global', description: 'Broadcast globally', type: 5, required: false }] }
  ]
  await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
  console.log('Setup complete')
  rl.close()
  process.exit(0)
})().catch(e => { console.error(e); process.exit(1) })
