const { EmbedBuilder } = require("discord.js");
const User = require("../database/userModel");

module.exports = {
  name: "w",
  description: "Nhận tiền mỗi 10 phút. Random từ 1.000 đến 10.000 VND. VIP x2 tiền thưởng!",
  aliases: ["work", "earn"],
  async execute(message) {
    // ===== LẤY USER =====
    let user = await User.findById(message.author.id);
    if (!user) {
      user = await User.create({
        _id: message.author.id,
        money: 1000,
        vip: { active: false, tier: "none", expireAt: null },
        stats: { cfWin:0, cfLose:0, txWin:0, txLose:0, bjWin:0, bjLose:0 },
        daily: { lastClaim: null, streak: 0 },
        w: { lastClaim: null }
      });
    }

    const now = new Date();
    const last = user.w.lastClaim ? new Date(user.w.lastClaim) : null;

    // ===== COOLDOWN 10 phút =====
    if (last && now - last < 10 * 60 * 1000) {
      const remain = Math.ceil((10 * 60 * 1000 - (now - last)) / 1000);
      return message.reply(`❌ Bạn phải đợi **${remain} giây** trước khi nhận W tiếp!`);
    }

    // ===== Xác định VIP =====
let vipLabel = "👤 Thường";
let vipColor = 0x00ff99;
let isVIP = false;

if (user.vip?.active && (!user.vip.expireAt || new Date(user.vip.expireAt) > new Date())) {
    isVIP = true;
    const tier = user.vip.tier.toLowerCase();
    if (tier === "vipmax") { 
        vipLabel = "💎 VIP MAX"; 
        vipColor = 0xff66ff; 
    } else if (tier === "vip30") { 
        vipLabel = "💠 VIP 30"; 
        vipColor = 0x66ccff; 
    } else if (tier === "vip7") { 
        vipLabel = "👑 VIP 7"; 
        vipColor = 0xffcc66; 
    }
}
    // ===== RANDOM COIN =====
    let coin = Math.floor(Math.random() * (10000 - 1000 + 1)) + 1000;
    if(isVIP) coin *= 2; // VIP x2
    coin = Math.floor(coin);

    user.money += coin;
    user.w.lastClaim = now;

    await user.save();

    // ===== EMBED SIÊU ĐẸP =====
    const embed = new EmbedBuilder()
      .setTitle("💼 WORK / EARN")
      .setColor(isVIP ? 0xff66ff : 0x00ff99)
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setDescription(
        `✨ **${message.author.username}** đã nhận được **${coin.toLocaleString()} VND** từ W!` +
        (isVIP ? " 💎 (VIP x2)" : "") +
        `\n👑 VIP: ${vipLabel}`
      )
      .setFooter({ text: `💰 Tổng coin hiện tại: ${user.money.toLocaleString()}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  }
};
