const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

const ADMIN_ID = "1014803363105349693"; // ID bạn

module.exports = {
  name: "help",
  description: "Hiển thị tất cả lệnh Hazel_Bot cực đẹp với hiệu ứng Ember VIP",
  async execute(message) {
    const commandsPath = path.join(__dirname);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

    const embed = new EmbedBuilder()
      .setTitle("✨📜 Hazel_Bot Command List")
      .setColor("#ff66ff") // gradient chủ đạo VIP
      .setDescription(
        "Dùng prefix `h` trước mỗi lệnh.\n" +
        "⚡ Các lệnh VIP/admin sẽ hiển thị nổi bật.\n" +
        "💎 Ember effect: các lệnh quan trọng sẽ sáng lên"
      )
      .setFooter({ text: "Hazel_Bot | Chúc bạn chơi vui vẻ! 🔥", iconURL: message.author.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    for (const file of commandFiles) {
      if (file === "help.js") continue;

      const cmdPath = path.join(commandsPath, file);
      delete require.cache[require.resolve(cmdPath)];
      const cmd = require(cmdPath);

      // Check lệnh admin
      const isAdminCmd = ["setmoney","addmoney"].includes(cmd.name);
      if (isAdminCmd && message.author.id !== ADMIN_ID) continue;

      // Hiển thị emoji VIP/ADMIN
      const prefix = isAdminCmd ? "💠 Admin" : "✨";

      embed.addFields({
        name: `${prefix} ${cmd.name}`,
        value: `**Mô tả:** ${cmd.description || "Không có mô tả"}\n**Aliases:** ${cmd.aliases ? cmd.aliases.join(", ") : "Không có"}`,
        inline: false
      });
    }

    message.reply({ embeds: [embed] });
  }
};
