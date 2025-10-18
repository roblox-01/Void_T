const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, PermissionsBitField, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessageReactions],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const GUILDS_FILE = path.join(DATA_DIR, 'VoidTicketsGuilds.json');
const CLAIMS_FILE = path.join(DATA_DIR, 'VoidTicketsClaims.json');
const VOUCHES_FILE = path.join(DATA_DIR, 'VoidTicketsVouches.json');
const TICKETS_FILE = path.join(DATA_DIR, 'VoidTicketsTickets.json');
const RESTRICTIONS_FILE = path.join(DATA_DIR, 'VoidTicketsRestrictions.json');

let guildsData = fs.existsSync(GUILDS_FILE) ? JSON.parse(fs.readFileSync(GUILDS_FILE)) : {};
let claimsData = fs.existsSync(CLAIMS_FILE) ? JSON.parse(fs.readFileSync(CLAIMS_FILE)) : {};
let vouchesData = fs.existsSync(VOUCHES_FILE) ? JSON.parse(fs.readFileSync(VOUCHES_FILE)) : { vouches: [], ratings: {} };
let ticketsData = fs.existsSync(TICKETS_FILE) ? JSON.parse(fs.readFileSync(TICKETS_FILE)) : { counters: {}, activeTickets: {} };
let restrictionsData = fs.existsSync(RESTRICTIONS_FILE) ? JSON.parse(fs.readFileSync(RESTRICTIONS_FILE)) : {};

function saveData() {
  fs.writeFileSync(GUILDS_FILE, JSON.stringify(guildsData));
  fs.writeFileSync(CLAIMS_FILE, JSON.stringify(claimsData));
  fs.writeFileSync(VOUCHES_FILE, JSON.stringify(vouchesData));
  fs.writeFileSync(TICKETS_FILE, JSON.stringify(ticketsData));
  fs.writeFileSync(RESTRICTIONS_FILE, JSON.stringify(restrictionsData));
}

const firstGuild = Object.keys(guildsData)[0];
const token = firstGuild ? guildsData[firstGuild].token : (function() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question('Enter bot token: ', resolve));
})();

client.login(token);

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  client.application.commands.create(new SlashCommandBuilder()
    .setName('VoidTickets_support')
    .setDescription('Post the VoidTickets support panel')
    .toJSON());
  client.application.commands.create(new SlashCommandBuilder()
    .setName('VoidTickets_claim-stats')
    .setDescription('Post VoidTickets claim stats')
    .toJSON());
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.inGuild()) return;

  const guildId = interaction.guildId;
  const guildConfig = guildsData[guildId];
  if (!guildConfig) return interaction.reply({ content: 'Guild not set up. Run VoidTicketsSetup.js.', ephemeral: true });

  if (interaction.isCommand()) {
    if (interaction.commandName === 'VoidTickets_support') {
      const embed = new EmbedBuilder()
        .setTitle('VoidTickets Support Panel')
        .setDescription('When making a Ticket, you have 0 Hours to say something in the ticket. If you dont say anything it will be put on ticket restrictions for 24 hours⛔. During ticket if dont the conversation stops for more than 6 hours, the ticket will close. ! !! If you are done with the ticket, let us know so we can close the ticket. Don\'t drag it out more than it needs to be. Get straight to the point')
        .setColor('#FF0000')
        .setFooter({ text: 'Powered by VoidTickets' });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('create_VoidTickets_support').setLabel('Support').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('create_VoidTickets_admin_app').setLabel('Admin Application').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('create_VoidTickets_order').setLabel('Order Products').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('create_VoidTickets_report').setLabel('Report User').setStyle(ButtonStyle.Danger)
      );

      await interaction.reply({ embeds: [embed], components: [row] });
    } else if (interaction.commandName === 'VoidTickets_claim-stats') {
      const stats = Object.entries(claimsData).sort((a, b) => b[1] - a[1]).map(([userId, count]) => `${userId} - ${count} tickets`).join('\n');
      const embed = new EmbedBuilder()
        .setTitle('VoidTickets Claim Stats')
        .setDescription(stats || 'No claims yet.')
        .setColor('#FF0000')
        .setFooter({ text: 'Powered by VoidTickets' });

      await interaction.reply({ embeds: [embed] });
    }
  } else if (interaction.isButton()) {
    if (interaction.customId.startsWith('create_VoidTickets_')) {
      const userId = interaction.user.id;
      if (restrictionsData[userId] && restrictionsData[userId] > Date.now()) {
        return interaction.reply({ content: `You are restricted from creating VoidTickets until ${new Date(restrictionsData[userId]).toLocaleString()}.`, ephemeral: true });
      }

      const type = interaction.customId.split('_')[2];
      const ticketType = type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
      ticketsData.counters[guildId] = (ticketsData.counters[guildId] || 0) + 1;
      const ticketNum = ticketsData.counters[guildId].toString().padStart(4, '0');
      const channelName = `VoidTickets#${ticketNum}-ticket-unclaimed`;

      const ticketChannel = await interaction.guild.channels.create({
        name: channelName,
        type: 0,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: userId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
          ...guildConfig.allowedRoles.map(roleId => ({ id: roleId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] })),
        ],
      });

      ticketsData.activeTickets[ticketChannel.id] = { creator: userId, type: ticketType, created: Date.now(), lastActivity: Date.now(), claimedBy: null };
      saveData();

      const embed = new EmbedBuilder()
        .setTitle(`VoidTickets #${ticketNum} - TICKET - UNCLAIMED`)
        .setDescription('A staff will reply as soon as possible!')
        .addFields(
          { name: 'Ticket Creator', value: `<@${userId}> ✅`, inline: false },
          { name: 'Created', value: new Date().toLocaleString(), inline: false },
          { name: 'Status', value: 'UNCLAIMED', inline: false },
          { name: 'Ticket Type', value: ticketType, inline: false },
          { name: 'Claimed By', value: 'None', inline: false }
        )
        .setColor('#FF0000')
        .setFooter({ text: 'Powered by VoidTickets' });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('unclaim_VoidTickets').setLabel('Unclaim').setStyle(ButtonStyle.Danger).setDisabled(true),
        new ButtonBuilder().setCustomId('call_VoidTickets_management').setLabel('Call Team 👥').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('close_VoidTickets').setLabel('Close Ticket ❌').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('claim_VoidTickets').setLabel('Claim ✅').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('vouch_VoidTickets').setLabel('Vouch ⭐').setStyle(ButtonStyle.Primary).setDisabled(true)
      );

      await ticketChannel.send({ embeds: [embed], components: [row] });
      await interaction.reply({ content: `VoidTickets created: ${ticketChannel}`, ephemeral: true });

      const logChannel = client.channels.cache.get(guildConfig.ticketLogChannels[type] || guildConfig.ticketLogChannel);
      if (logChannel) logChannel.send(`New ${ticketType} VoidTickets #${ticketNum} created by <@${userId}> in ${ticketChannel}`);

      setTimeout(async () => {
        const ticket = ticketsData.activeTickets[ticketChannel.id];
        if (ticket && ticket.lastActivity === ticket.created) {
          restrictionsData[userId] = Date.now() + 24 * 60 * 60 * 1000;
          saveData();
          await closeTicket(ticketChannel, userId, 'Closed due to no initial activity');
        }
      }, 5 * 60 * 1000);

      const inactivityCheck = setInterval(async () => {
        const ticket = ticketsData.activeTickets[ticketChannel.id];
        if (ticket && Date.now() - ticket.lastActivity > 6 * 60 * 60 * 1000) {
          await closeTicket(ticketChannel, userId, 'Autoclosed due to inactivity');
          clearInterval(inactivityCheck);
        }
      }, 60 * 1000);
    } else if (interaction.customId === 'claim_VoidTickets') {
      const ticket = ticketsData.activeTickets[interaction.channel.id];
      if (!ticket || ticket.claimedBy) return interaction.reply({ content: 'VoidTickets already claimed.', ephemeral: true });

      const claimedBy = interaction.user.id;
      ticket.claimedBy = claimedBy;
      ticket.status = 'CLAIMED';
      claimsData[claimedBy] = (claimsData[claimedBy] || 0) + 1;
      saveData();

      const embed = interaction.message.embeds[0];
      const newEmbed = new EmbedBuilder(embed)
        .setTitle(embed.title.replace('UNCLAIMED', 'CLAIMED'))
        .setFields(embed.fields.map(f => {
          if (f.name === 'Status') return { name: 'Status', value: 'CLAIMED', inline: false };
          if (f.name === 'Claimed By') return { name: 'Claimed By', value: `<@${claimedBy}>`, inline: false };
          return f;
        }));

      const row = interaction.message.components[0];
      row.components.find(c => c.customId === 'claim_VoidTickets').setDisabled(true);
      row.components.find(c => c.customId === 'unclaim_VoidTickets').setDisabled(false);

      await interaction.update({ embeds: [newEmbed], components: [row] });
      await interaction.followUp({ content: `VoidTickets claimed by <@${claimedBy}>` });

      const logChannel = client.channels.cache.get(guildConfig.claimLogChannel || guildConfig.ticketLogChannel);
      if (logChannel) logChannel.send(`VoidTickets ${interaction.channel.name} claimed by <@${claimedBy}>. Total claims: ${claimsData[claimedBy]}`);
    } else if (interaction.customId === 'unclaim_VoidTickets') {
      const ticket = ticketsData.activeTickets[interaction.channel.id];
      if (!ticket || ticket.claimedBy !== interaction.user.id) return interaction.reply({ content: 'You did not claim this VoidTickets.', ephemeral: true });

      ticket.claimedBy = null;
      ticket.status = 'UNCLAIMED';
      saveData();

      const embed = interaction.message.embeds[0];
      const newEmbed = new EmbedBuilder(embed)
        .setTitle(embed.title.replace('CLAIMED', 'UNCLAIMED'))
        .setFields(embed.fields.map(f => {
          if (f.name === 'Status') return { name: 'Status', value: 'UNCLAIMED', inline: false };
          if (f.name === 'Claimed By') return { name: 'Claimed By', value: 'None', inline: false };
          return f;
        }));

      const row = interaction.message.components[0];
      row.components.find(c => c.customId === 'claim_VoidTickets').setDisabled(false);
      row.components.find(c => c.customId === 'unclaim_VoidTickets').setDisabled(true);

      await interaction.update({ embeds: [newEmbed], components: [row] });
      await interaction.followUp({ content: 'VoidTickets unclaimed.' });
    } else if (interaction.customId === 'call_VoidTickets_management') {
      const pings = guildConfig.managementRoles.map(roleId => `<@&${roleId}>`).join(' ');
      await interaction.reply({ content: `Calling VoidTickets management: ${pings}`, allowedMentions: { roles: guildConfig.managementRoles } });
    } else if (interaction.customId === 'close_VoidTickets') {
      const row = new ActionRowBuilder().addComponents(
        interaction.message.components[0].components.find(c => c.customId === 'vouch_VoidTickets').setDisabled(false),
        new ButtonBuilder().setCustomId('confirm_close_VoidTickets').setLabel('Confirm Close').setStyle(ButtonStyle.Danger)
      );
      await interaction.update({ components: [row] });
      await interaction.followUp({ content: 'VoidTickets closing options:' });
    } else if (interaction.customId === 'confirm_close_VoidTickets') {
      await closeTicket(interaction.channel, interaction.user.id, 'Closed by user');
    } else if (interaction.customId === 'vouch_VoidTickets') {
      const modal = new ModalBuilder()
        .setCustomId('vouch_VoidTickets_modal')
        .setTitle('Add VoidTickets Vouch')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('reason').setLabel('Reason').setStyle(TextInputStyle.Short).setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('rating').setLabel('Rating (1-5)').setStyle(TextInputStyle.Short).setRequired(true).setMinLength(1).setMaxLength(1)
          )
        );

      await interaction.showModal(modal);
    }
  } else if (interaction.isModalSubmit()) {
    if (interaction.customId === 'vouch_VoidTickets_modal') {
      const ticket = ticketsData.activeTickets[interaction.channel.id];
      if (!ticket) return interaction.reply({ content: 'Invalid VoidTickets.', ephemeral: true });

      const voucheeId = ticket.creator;
      const voucherId = interaction.user.id;
      const reason = interaction.fields.getTextInputValue('reason');
      const rating = parseInt(interaction.fields.getTextInputValue('rating'));
      if (isNaN(rating) || rating < 1 || rating > 5) return interaction.reply({ content: 'Invalid rating. Must be 1-5.', ephemeral: true });

      vouchesData.vouches.push({ vouchee: voucheeId, voucher: voucherId, reason, rating });
      if (!vouchesData.ratings[voucheeId]) vouchesData.ratings[voucheeId] = { total: 0, sum: 0 };
      vouchesData.ratings[voucheeId].total += 1;
      vouchesData.ratings[voucheeId].sum += rating;
      const avgRating = (vouchesData.ratings[voucheeId].sum / vouchesData.ratings[voucheeId].total).toFixed(2);
      saveData();

      const voucher = await client.users.fetch(voucherId);
      const thumbnail = voucher.displayAvatarURL({ dynamic: true });

      for (const gId in guildsData) {
        const vouchChannelId = guildsData[gId].vouchChannel;
        const vouchChannel = client.channels.cache.get(vouchChannelId);
        if (vouchChannel) {
          const stars = '⭐'.repeat(rating);
          const embed = new EmbedBuilder()
            .setTitle('VoidTickets Vouch Added')
            .setDescription(`<@${voucherId}> Has Vouched For <@${voucheeId}>\nReason: ${reason}`)
            .addFields(
              { name: 'Stats', value: `${stars} (${avgRating}/5)\nUpdated Rating: ${stars} (${avgRating}/5)\nTotal Vouches: ${vouchesData.ratings[voucheeId].total}\nBot Made By VoidTickets` }
            )
            .setThumbnail(thumbnail)
            .setColor('#A020F0')
            .setTimestamp();

          await vouchChannel.send({ embeds: [embed], allowedMentions: { users: [voucherId, voucheeId] } });
        }
      }

      await interaction.reply({ content: 'VoidTickets vouch posted!' });
      await closeTicket(interaction.channel, voucheeId, 'Closed with vouch');
    }
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  const ticket = ticketsData.activeTickets[message.channel.id];
  if (ticket) {
    ticket.lastActivity = Date.now();
    saveData();
  }
});

async function closeTicket(channel, userId, reason) {
  const guildConfig = guildsData[channel.guildId];
  const logChannel = client.channels.cache.get(guildConfig.ticketLogChannel);
  if (logChannel) logChannel.send(`VoidTickets ${channel.name} closed by <@${userId}>. Reason: ${reason}`);

  delete ticketsData.activeTickets[channel.id];
  saveData();

  await channel.delete();
}
