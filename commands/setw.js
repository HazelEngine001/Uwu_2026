const { EmbedBuilder } = require("discord.js");
const User = require("../database/userModel");

const OWNER_ID = "1014803363105349693"; // ID của bạn

module.exports = {
  name: "setw",
  description: "Reset W (work) cho user (owner only)",
  hidden: true, // 👈 ẨN KHỎI HELP (nếu help có check hidden)

  async execute(message, args) {
    // 🔇 Im lặng tuyệt đối nếu không phải bạn
    if (message.author.id !== OWNER_ID) return;

    const target = message.mentions.users.first();
    if (!target) return message.reply("❌ Dùng: `h setw @user`");

    let user = await User.findById(target.id);
    if (!user) {
      user = await User.create({
        _id: target.id,
        money: 1000,
        vip: { active: false, tier: "none", expireAt: null },
        w: { lastClaim: null },
        stats: { cfWin: 0, cfLose: 0, txWin: 0, txLose: 0, bjWin: 0, bjLose: 0 }
      });
    }

    // reset cooldown W
    user.w.lastClaim = null;
    await user.save();

    const embed = new EmbedBuilder()
      .setTitle("✅ W ĐÃ RESET")
      .setColor(0x3498db)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setDescription(`🔄 **${target.username}** đã có thể nhận W lại từ đầu!`)
      .setFooter({
        text: `Số dư hiện tại: ${user.money.toLocaleString()}`,
        iconURL: target.displayAvatarURL({ dynamic: true })
      })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  }
};
