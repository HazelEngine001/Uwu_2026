const { EmbedBuilder } = require("discord.js");
const User = require("../database/userModel");

module.exports = {
  name: "daily",
  description: "Nhận coin theo ngày liên tiếp. Ngày 1: 1.000, ngày 2: 1.500, cứ tăng dần.",
  async execute(message) {
    // ===== LẤY USER =====
    let user = await User.findById(message.author.id);
    if (!user) {
      user = await User.create({
        _id: message.author.id,
        money: 1000,
        daily: { lastClaim: null, streak: 0 },
        vip: { active: false, tier: "none", expireAt: null }
      });
    }

    const now = new Date();
    const last = user.daily?.lastClaim ? new Date(user.daily.lastClaim) : null;

    // Nếu đã claim hôm nay
    if (last && now.toDateString() === last.toDateString()) {
      const embedAlready = new EmbedBuilder()
        .setTitle("❌ DAILY ĐÃ NHẬN")
        .setDescription(`Bạn đã nhận Daily hôm nay rồi!\nTiếp tục vào ngày mai để nhận nhiều hơn 💰`)
        .setColor(0xe74c3c)
        .setFooter({ text: `💰 Số dư hiện tại: ${user.money.toLocaleString()} | VIP: ${user.vip?.tier?.toUpperCase() || "Thường"}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();
      return message.reply({ embeds: [embedAlready] });
    }

    // Tính streak
    let streak = 1;
    if (last) {
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      if (last.toDateString() === yesterday.toDateString()) {
        streak = (user.daily?.streak || 0) + 1;
      }
    }

    // Tính coin theo streak
    let coin = 1000 + (streak - 1) * 500; // tăng 500 coin mỗi ngày

    // VIP +10% nếu còn hiệu lực
    let isVIP = false;
    if(user.vip && user.vip.active && (!user.vip.expireAt || new Date(user.vip.expireAt) > now)) {
      isVIP = true;
      coin = Math.floor(coin * 1.1);
    }

    user.money += coin;
    user.daily = { lastClaim: now, streak };
    await user.save();

    // Tên VIP hiển thị
    let vipLabel = isVIP ? (user.vip.tier.toLowerCase() === "max" ? "💎 VIP MAX" : user.vip.tier.toLowerCase() === "pro" ? "💠 VIP 30" : "👑 VIP 7") : "👤 Thường";

    // ==== EMBED ĐẸP ==== 
    const embed = new EmbedBuilder()
      .setTitle("🎁 DAILY REWARD")
      .setColor(isVIP ? 0x2ecc71 : 0x3498db)
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setDescription(
        `✨ Chúc mừng **${message.author.username}**!\n` +
        `💰 Bạn nhận được **${coin.toLocaleString()} VND**\n` +
        `📅 Ngày liên tiếp: **${streak}**\n` +
        `👑 VIP: ${vipLabel}`
      )
      .setFooter({ text: `💰 Tổng coin hiện tại: ${user.money.toLocaleString()}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  }
};
