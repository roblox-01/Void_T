const path = require('path')
const fs = require('fs')
const storage = require('../utils/storage')
module.exports = {
  name: 'interactionCreate',
  async execute (interaction, client) {
    if (interaction.isChatInputCommand && interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName)
      if (!cmd) return
      try {
        await cmd.execute(interaction, client)
      } catch (e) {
        try { await interaction.reply({ content: 'Error', ephemeral: true }) } catch (e) {}
      }
    } else if (interaction.isButton && interaction.isButton()) {
      const parts = interaction.customId.split('_')
      const action = parts[0]
      const id = parts.slice(1).join('_')
      const file = path.join(storage.paths.tickets, `${id}.json`)
      if (!fs.existsSync(file)) return interaction.reply({ content: 'Ticket not found', ephemeral: true })
      const t = storage.readJSON(file)
      if (!t) return interaction.reply({ content: 'Invalid ticket', ephemeral: true })
      const cfg = storage.guildConfig(t.guildId)
      if (action === 'claim') {
        if (t.claimerId) return interaction.reply({ content: 'Already claimed', ephemeral: true })
        t.claimerId = interaction.user.id
        t.lastActivity = Date.now()
        storage.writeJSON(file, t)
        const guild = await client.guilds.fetch(t.guildId).catch(() => null)
        if (guild) {
          const ch = await guild.channels.fetch(t.channelId).catch(() => null)
          if (ch && ch.isTextBased()) ch.send({ content: `<@${interaction.user.id}> has claimed this ticket` }).catch(() => {})
        }
        return interaction.reply({ content: `You claimed ticket #${t.number}`, ephemeral: true })
      } else if (action === 'unclaim') {
        if (t.claimerId !== interaction.user.id && !interaction.member.permissions.has('ManageGuild')) return interaction.reply({ content: 'You are not the claimer', ephemeral: true })
        t.claimerId = null
        storage.writeJSON(file, t)
        return interaction.reply({ content: 'Ticket unclaimed', ephemeral: true })
      } else if (action === 'call') {
        const guild = await client.guilds.fetch(t.guildId).catch(() => null)
        if (!guild) return interaction.reply({ content: 'Guild not available', ephemeral: true })
        if (cfg.managementRoles && cfg.managementRoles.length) {
          const ch = await guild.channels.fetch(t.channelId).catch(() => null)
          if (ch && ch.isTextBased()) ch.send({ content: cfg.managementRoles.map(r => `<@&${r}>`).join(' ') }).catch(() => {})
          return interaction.reply({ content: 'Management called', ephemeral: true })
        }
        return interaction.reply({ content: 'No management roles configured', ephemeral: true })
      } else if (action === 'close') {
        t.status = 'CLOSED'
        t.lastActivity = Date.now()
        storage.writeJSON(file, t)
        const guild = await client.guilds.fetch(t.guildId).catch(() => null)
        if (guild) {
          const channel = await guild.channels.fetch(t.channelId).catch(() => null)
          if (channel && channel.isTextBased()) {
            try {
              await channel.permissionOverwrites.edit(guild.roles.everyone, { ViewChannel: false })
            } catch (e) {}
            channel.send({ content: `Ticket closed by ${interaction.user.toString()}` }).catch(() => {})
          }
          const transcriptPath = await storage.saveTranscript(client, t)
          if (cfg.ticketLogChannelId && transcriptPath) {
            const logCh = await guild.channels.fetch(cfg.ticketLogChannelId).catch(() => null)
            if (logCh && logCh.isTextBased()) {
              await logCh.send({ content: `Transcript for ticket #${t.number} (${t.id}) — closed by ${interaction.user.tag}`, files: [transcriptPath] }).catch(() => {})
            }
          }
        }
        return interaction.reply({ content: 'Ticket closed', ephemeral: true })
      }
    }
  }
}
