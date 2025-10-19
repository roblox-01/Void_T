require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js')
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent], partials: [Partials.Channel, Partials.Message] })
client.commands = new Collection()
const commandsPath = path.join(__dirname, 'commands')
if (fs.existsSync(commandsPath)) {
  const folders = fs.readdirSync(commandsPath)
  for (const folder of folders) {
    const folderPath = path.join(commandsPath, folder)
    if (!fs.statSync(folderPath).isDirectory()) continue
    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'))
    for (const file of files) {
      const full = path.join(folderPath, file)
      const cmd = require(full)
      if (cmd && cmd.data && cmd.execute) client.commands.set(cmd.data.name, cmd)
    }
  }
}
const eventsPath = path.join(__dirname, 'events')
if (fs.existsSync(eventsPath)) {
  const files = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'))
  for (const file of files) {
    const ev = require(path.join(eventsPath, file))
    if (ev.once) client.once(ev.name, (...a) => ev.execute(...a, client))
    else client.on(ev.name, (...a) => ev.execute(...a, client))
  }
}
client.login(process.env.DISCORD_TOKEN)
