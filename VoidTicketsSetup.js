const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

(async () => {
  const chalk = await import('chalk');
  const figlet = await import('figlet');

  console.log(chalk.default.cyan(figlet.default.textSync('VoidTickets', { horizontalLayout: 'full' })));
  console.log(chalk.default.green(`
   .-""""""""-.
  .'          '.
 /   ʕ ˵• ₒ •˵ ʔ  \\
: ,          , :
~^~^~^~^~^~^~^~^~^
VoidTickets Configurator Initiated
`));
  console.log(chalk.default.yellow('=== Matrix Loading... ==='));

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  const DATA_DIR = path.join(__dirname, 'data');
  const GUILDS_FILE = path.join(DATA_DIR, 'VoidTicketsGuilds.json');

  let guildsData = fs.existsSync(GUILDS_FILE) ? JSON.parse(fs.readFileSync(GUILDS_FILE)) : {};

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  async function prompt(question) {
    return new Promise(resolve => rl.question(chalk.default.magenta(`${question} ` + chalk.default.yellow('> ')), resolve));
  }

  client.on('ready', async () => {
    console.log(chalk.default.green(`
  .-""""""""-.
.'          '.
: ,  Matrix  : ,
~^~^~^~^~^~^~^~^~^~
Access Granted
  `));
    console.log(chalk.default.cyan('🔑 Enter bot token to unlock the system:'));
    const token = await prompt(chalk.default.yellow('> Token: '));
    client.login(token);

    console.log(chalk.default.green(`
  .-""""""""-.
.'          '.
: ,  Auth    : ,
~^~^~^~^~^~^~^~^~^~
Deployment Online
  `));
    console.log(chalk.default.cyan('🌌 Enter guild ID to configure:'));
    const guildId = await prompt(chalk.default.yellow('> Guild ID: '));
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      console.log(chalk.default.red(`
    .-""""""""-.
   .'          '.
  : ,  ERROR   : ,
  ~^~^~^~^~^~^~^~^~^~
  Guild Not Found. Check ID and Bot Presence.
    `));
      process.exit(1);
    }

    guildsData[guildId] = {
      token: token,
      ticketLogChannel: await prompt(chalk.default.yellow('> Default VoidTickets Log Channel ID: ')),
      claimLogChannel: await prompt(chalk.default.yellow('> Claim Log Channel ID (optional, defaults to ticket log): ')) || guildsData[guildId].ticketLogChannel,
      vouchChannel: await prompt(chalk.default.yellow('> Vouch Channel ID: ')),
      allowedRoles: (await prompt(chalk.default.yellow('> Allowed Role IDs (comma-separated): '))).split(',').map(r => r.trim()),
      managementRoles: (await prompt(chalk.default.yellow('> Management Role IDs (comma-separated, unlimited): '))).split(',').map(r => r.trim()),
      ticketLogChannels: {}
    };

    guildsData[guildId].ticketLogChannels['support'] = await prompt(chalk.default.yellow('> Support VoidTickets Log Channel ID (optional, defaults to default): ')) || guildsData[guildId].ticketLogChannel;
    guildsData[guildId].ticketLogChannels['admin_app'] = await prompt(chalk.default.yellow('> Admin Application VoidTickets Log Channel ID (optional): ')) || guildsData[guildId].ticketLogChannel;
    guildsData[guildId].ticketLogChannels['order'] = await prompt(chalk.default.yellow('> Order Products VoidTickets Log Channel ID (optional): ')) || guildsData[guildId].ticketLogChannel;
    guildsData[guildId].ticketLogChannels['report'] = await prompt(chalk.default.yellow('> Report User VoidTickets Log Channel ID (optional): ')) || guildsData[guildId].ticketLogChannel;

    fs.writeFileSync(GUILDS_FILE, JSON.stringify(guildsData));
    console.log(chalk.default.green(`
  .-""""""""-.
 .'          '.
: ,  SUCCESS : ,
~^~^~^~^~^~^~^~^~^~
Configuration Saved. VoidTickets Guild ${chalk.default.cyan(guildId)} Online!
  `));
    console.log(chalk.default.yellow(`
   .-""""""""-.
  .'          '.
 : ,  SHUTDOWN : ,
 ~^~~^~^~^~^~^~^~^~
System Offline
  `));
    process.exit(0);
  });

  client.login('');
})();