const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionsBitField } = require('discord.js')
const path = require('path')
const storage = require('../../utils/storage')
const fs = require('fs')
module.exports = {
  data: new SlashCommandBuilder().setName('ticket').setDescription('Ticket commands').addSubcommand(s => s.setName('create').setDescription('Create a ticket')).addSubcommand(s => s.setName('stats').setDescription('Show ticket claim stats')),
  async execute (interaction) {
    const cfg = storage.guildConfig(interaction.guildId)
    const sub = interaction.options.getSubcommand()
    if (sub === 'create') {
      const creator = interaction.user
      cfg.ticketCounter = (cfg.ticketCounter || 0) + 1
      storage.writeJSON(path.join(storage.paths.guilds, `${cfg.guildId}.json`), cfg)
      const num = cfg.ticketCounter
      const name = `ticket-${num}`
      const perms = [{ id: interaction.guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] }, { id: creator.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles] }]
      if (cfg.managementRoles && cfg.managementRoles.length) for (const r of cfg.managementRoles) perms.push({ id: r, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] })
      const ch = await interaction.guild.channels.create({ name: name, type: 0, parent: cfg.ticketCategoryId || null, permissionOverwrites: perms }).catch(() => null)
      if (!ch) return interaction.reply({ content: 'Failed to create channel', ephemeral: true })
      const ticket = { id: `${interaction.guildId}_${num}`, guildId: interaction.guildId, number: num, creatorId: creator.id, channelId: ch.id, createdAt: Date.now(), lastActivity: Date.now(), status: 'OPEN', claimerId: null, autocloseMinutes: cfg.autocloseMinutes || 1440 }
      storage.writeJSON(path.join(storage.paths.tickets, `${ticket.id}.json`), ticket)
      const embed = new EmbedBuilder().setTitle(`Ticket #${ticket.number} • OPEN`).setDescription('A staff member will assist you shortly.').addFields([{ name: 'Creator', value: `<@${creator.id}>`, inline: true }, { name: 'Status', value: ticket.status, inline: true }, { name: 'Ticket ID', value: ticket.id, inline: true }]).setColor(0x0f1720)
      const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`claim_${ticket.id}`).setLabel('Claim ✋').setStyle(ButtonStyle.Primary), new ButtonBuilder().setCustomId(`unclaim_${ticket.id}`).setLabel('Unclaim ❌').setStyle(ButtonStyle.Secondary), new ButtonBuilder().setCustomId(`call_${ticket.id}`).setLabel('Call Team 📣').setStyle(ButtonStyle.Success), new ButtonBuilder().setCustomId(`close_${ticket.id}`).setLabel('Close 🗑️').setStyle(ButtonStyle.Danger))
      await ch.send({ content: cfg.managementRoles && cfg.managementRoles.length ? cfg.managementRoles.map(r => `<@&${r}>`).join(' ') : '', embeds: [embed], components: [row] }).catch(() => {})
      await interaction.reply({ content: `Ticket created: ${ch}`, ephemeral: true })
    } else if (sub === 'stats') {
      const files = fs.readdirSync(storage.paths.tickets).filter(x => x.endsWith('.json'))
      const counts = {}
      for (const f of files) {
        const t = storage.readJSON(path.join(storage.paths.tickets, f))
        if (t && t.claimerId) counts[t.claimerId] = (counts[t.claimerId] || 0) + 1
      }
      const lines = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<@${k}> — ${v} tickets`)
      const embed = new EmbedBuilder().setTitle('Ticket Claim Stats').setDescription(lines.length ? lines.join('\n') : 'No claims yet').setColor(0x111111)
      await interaction.reply({ embeds: [embed], ephemeral: true })
    }
  }
}
