require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  Collection,
  Partials
} = require("discord.js");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

/* ================= CLIENT ================= */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions // ⭐ BẮT BUỘC
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction // ⭐ BẮT BUỘC
  ]
});

const PREFIX = "h";
client.commands = new Collection();

/* ================= LOAD COMMANDS ================= */
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (!command.name || !command.execute) {
    console.log(`❌ Command lỗi: ${file}`);
    continue;
  }
  client.commands.set(command.name, command);
  console.log(`✅ Loaded command: ${command.name}`);
}

/* ================= MONGODB ================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("🟢 MongoDB connected"))
  .catch(err => console.error("🔴 MongoDB error:", err));

/* ================= READY ================= */
client.once("clientReady", () => {
  console.log("Bot ready");
});


/* ================= MESSAGE HANDLER ================= */
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.toLowerCase().startsWith(PREFIX)) return;

  const content = message.content.slice(PREFIX.length).trim();
  if (!content) return;

  let args = content.split(/\s+/);
  let cmdName = args.shift().toLowerCase();

  /* ===== TÌM COMMAND / ALIAS ===== */
  let command =
    client.commands.get(cmdName) ||
    [...client.commands.values()].find(c =>
      Array.isArray(c.aliases) && c.aliases.includes(cmdName)
    );

  if (!command) return;

  try {
    await command.execute(message, args, client);
  } catch (err) {
    console.error(err);
    message.reply("❌ Lỗi khi chạy lệnh");
  }
});

/* ================= LOGIN ================= */
client.login(process.env.DISCORD_TOKEN);
