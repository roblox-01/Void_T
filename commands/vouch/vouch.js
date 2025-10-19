const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const path = require('path')
const storage = require('../../utils/storage')
const fs = require('fs')
module.exports = {
  data: new SlashCommandBuilder().setName('vouch').setDescription('Vouch for a user').addUserOption(o => o.setName('user').setDescription('User to vouch for').setRequired(true)).addStringOption(o => o.setName('reason').setDescription('Reason')).addBooleanOption(o => o.setName('global').setDescription('Broadcast to all servers (default true)')),
  async execute (interaction) {
    const target = interaction.options.getUser('user', true)
    const reason = interaction.options.getString('reason') || 'No reason provided'
    const global = interaction.options.getBoolean('global')
    const vouch = { id: `${interaction.guildId}_${Date.now()}`, guildId: interaction.guildId, from: interaction.user.id, to: target.id, reason, createdAt: Date.now() }
    storage.writeJSON(path.join(storage.paths.vouches, `${vouch.id}.json`), vouch)
    const all = fs.readdirSync(storage.paths.vouches).filter(x => x.endsWith('.json')).map(f => storage.readJSON(path.join(storage.paths.vouches, f))).filter(Boolean)
    const userV = all.filter(v => v.to === target.id)
    const rating = Math.min(5, Math.max(1, Math.round((userV.length / Math.max(1, all.length)) * 5))) || 5
    const embed = new EmbedBuilder().setTitle('✅ New Vouch').setDescription(`<@${interaction.user.id}> vouched for <@${target.id}>`).addFields([{ name: 'Reason', value: reason }, { name: 'Rating', value: `${'★'.repeat(rating)} (${rating}/5)`, inline: true }, { name: 'Total Vouches', value: `${userV.length}`, inline: true }]).setThumbnail(target.displayAvatarURL()).setColor(0x2ecc71)
    const guildFiles = fs.readdirSync(storage.paths.guilds).filter(x => x.endsWith('.json'))
    for (const f of guildFiles) {
      const gcfg = storage.readJSON(path.join(storage.paths.guilds, f))
      if (!gcfg) continue
      if (global === false && gcfg.guildId !== interaction.guildId) continue
      if (gcfg.vouchChannelId) {
        const g = await interaction.client.guilds.fetch(gcfg.guildId).catch(() => null)
        if (!g) continue
        const ch = await g.channels.fetch(gcfg.vouchChannelId).catch(() => null)
        if (ch && ch.isTextBased()) await ch.send({ embeds: [embed] }).catch(() => {})
      }
    }
    await interaction.reply({ content: 'Vouch recorded and broadcasted.', ephemeral: true })
  }
}
