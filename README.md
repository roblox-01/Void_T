# VoidTickets - The Ultimate Discord Ticket & Vouch System

---

### 🚀 Welcome to the Void

Step into the neon abyss with **VoidTickets**, the sickest Discord bot designed to revolutionize your server’s support and vouching game. Built from the ground up with raw power and style, this beast handles tickets, claims, and vouches with a cyberpunk edge. Ready to dominate your server? Let’s dive in.

---

### 🔥 Features That Slap

- **Dynamic Ticket System**: Create support, admin apps, orders, and reports with auto-incrementing IDs. Channels are forged on the fly.
- **Claim & Unclaim**: Staff can lock down tickets with a single click, tracked with badass stats.
- **Call the Crew**: Ping your management team with unlimited role setups—chaos controlled.
- **Auto-Close**: Tickets vanish after 6 hours of silence or 5 mins without a word—stay active or get yeeted.
- **Role Restrictions**: Lock tickets to specific roles for that exclusive vibe.
- **Vouch Machine**: Drop vouches with ratings (1-5) and reasons, posted globally with slick embeds featuring the voucher’s PFP.
- **Multi-Server Domination**: Runs across all your guilds, syncing vouches like a pro.

---

### 💿 Installation

1. **Clone the Repo**  
   Grab this bad boy: `git clone https://your-repo-url.git VoidTickets`

2. **Install Dependencies**  
   Fire up your terminal and run:  
   `npm install`

3. **Setup Your Bot**  
   - Head to [Discord Developer Portal](https://discord.com/developers/applications) and create a bot.
   - Enable Message Content Intent, Server Members Intent, and Presence Intent.
   - Invite it to your server with perms: Manage Channels, Send Messages, Read Message History, Embed Links, Attach Files, Manage Roles.

4. **Configure the Beast**  
   - Run `node VoidTicketsSetup.js` in your terminal.
   - Enter your bot token, guild ID, channel IDs, and role IDs as prompted.
   - Repeat for each guild you want to conquer.

5. **Launch It**  
   Kick it off with: `node VoidTickets.js`

---

### 🎮 Usage

- **Spawn the Panel**: Use `/VoidTickets_support` to drop the support menu.
- **Check Stats**: Hit `/VoidTickets_claim-stats` to see who’s claiming like a champ.
- **Ticket Actions**: Claim, unclaim, call management, or vouch/close via buttons in the ticket channel.

---

### 🌌 Customization

- **Embed Colors**: Tweak the `#FF0000` (red) and `#A020F0` (purple) in `VoidTickets.js` to match your vibe.
- **Channel Names**: Prefixes like `VoidTickets#XXXX` are hardcoded—edit `VoidTickets.js` to rebrand.
- **Timeouts**: Adjust the 5-min initial and 6-hour inactivity timers in `VoidTickets.js` for your pace.

---

### ⚡ Requirements

- **Node.js**: v18+ (get it [here](https://nodejs.org/))
- **Discord.js**: v14.15.3 (installed via npm)
- **Chalk & Figlet**: For that terminal glow (`npm install chalk figlet`)

---

### 💣 Troubleshooting

- **Bot Won’t Start**: Double-check your token and intents in the Discord Developer Portal.
- **Channels Not Creating**: Ensure the bot has proper permissions in your server.
- **Vouches Not Posting**: Verify vouch channel IDs in `VoidTicketsSetup.js`.

---

### 🎸 Credits

Crafted with love by the Void crew. Made for the bold.

---

### 🌠 Join the Void

Got questions or want to flex your setup? Hit us up in our [Discord](https://discord.gg/your-invite) or stare into the abyss at [your-website.com](https://your-website.com).

---

*Powered by the raw energy of the Void. No AI, just pure human grit.*
