const { EmbedBuilder } = require("discord.js");
const User = require("../database/userModel");

const OWNER_ID = "1014803363105349693"; // ID của bạn

module.exports = {
  name: "setdaily",
  description: "Reset cooldown Daily cho user (owner only)",
  hidden: true, // 👻 ẨN KHỎI HELP

  async execute(message, args) {
    // 🔇 Im lặng tuyệt đối nếu không phải bạn
    if (message.author.id !== OWNER_ID) return;

    const target = message.mentions.users.first();
    if (!target) return message.reply("❌ Dùng: `h setdaily @user`");

    let user = await User.findById(target.id);
    if (!user) {
      user = await User.create({
        _id: target.id,
        money: 1000,
        vip: { active: false, tier: "none", expireAt: null },
        daily: { lastClaim: null, streak: 0 },
        stats: { cfWin: 0, cfLose: 0, txWin: 0, txLose: 0, bjWin: 0, bjLose: 0 }
      });
    }

    // 🔄 Reset Daily
    user.daily.lastClaim = null;
    user.daily.streak = 0;
    await user.save();

    // Kiểm tra VIP
    let vipLabel = "👤 Thường";
    let color = 0x3498db;
    const now = new Date();

    if (user.vip?.active && (!user.vip.expireAt || new Date(user.vip.expireAt) > now)) {
      const tier = (user.vip.tier || "").toLowerCase();
      vipLabel =
        tier === "max" ? "💎 VIP MAX" :
        tier === "pro" ? "💠 VIP 30" :
        "👑 VIP 7";
      color = 0xff66ff;
    }

    const embed = new EmbedBuilder()
      .setTitle("✅ DAILY ĐÃ RESET")
      .setColor(color)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setDescription(
        `🔄 **${target.username}** đã có thể nhận Daily lại từ đầu!\n` +
        `👑 VIP: ${vipLabel}`
      )
      .setFooter({
        text: `💰 Số dư hiện tại: ${user.money.toLocaleString()}`,
        iconURL: target.displayAvatarURL({ dynamic: true })
      })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  }
};
