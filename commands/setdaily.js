const { EmbedBuilder } = require("discord.js");
const User = require("../database/userModel");

module.exports = {
  name: "setdaily",
  description: "Admin: reset cooldown Daily cho user, dùng h setdaily @user",
  async execute(message, args) {
    // Kiểm tra quyền admin
    if(!message.member.permissions.has("Administrator")) 
      return message.reply("❌ Bạn không có quyền sử dụng lệnh này!");

    const target = message.mentions.users.first();
    if(!target) return message.reply("❌ Dùng: `h setdaily @user`");

    let user = await User.findById(target.id);
    if(!user) {
      user = await User.create({
        _id: target.id,
        money: 1000,
        vip: { active: false, tier: "none", expireAt: null },
        daily: { lastClaim: null, streak: 0 },
        stats: { cfWin:0, cfLose:0, txWin:0, txLose:0, bjWin:0, bjLose:0 }
      });
    }

    // Reset cooldown Daily
    user.daily.lastClaim = null;
    user.daily.streak = 0; // tuỳ chọn, nếu muốn reset streak luôn
    await user.save();

    // Kiểm tra VIP
    let vipLabel = "👤 Thường";
    const now = new Date();
    let isVip = false;
    if(user.vip?.active && (!user.vip.expireAt || new Date(user.vip.expireAt) > now)) {
      isVip = true;
      const tier = user.vip.tier.toLowerCase();
      vipLabel = tier === "max" ? "💎 VIP MAX" : tier === "pro" ? "💠 VIP 30" : "👑 VIP 7";
    }

    const embed = new EmbedBuilder()
      .setTitle("✅ DAILY ĐÃ RESET")
      .setColor(isVip ? 0xff66ff : 0x3498db)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setDescription(`🔄 **${target.username}** đã có thể nhận Daily lại từ đầu!\n👑 VIP: ${vipLabel}`)
      .setFooter({ text: `💰 Số dư hiện tại: ${user.money.toLocaleString()}`, iconURL: target.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  }
};
