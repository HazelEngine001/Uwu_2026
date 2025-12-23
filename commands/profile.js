const { EmbedBuilder } = require("discord.js");
const User = require("../database/userModel");

module.exports = {
  name: "profile",
  description: "Xem thông tin cá nhân: coin, VIP, winrate CF, số lần chơi các game.",
  aliases: ["me", "info"],
  async execute(message) {
    // ===== LẤY USER =====
    let user = await User.findById(message.author.id);
    if (!user) {
      user = await User.create({
        _id: message.author.id,
        money: 1000,
        vip: { active: false, tier: "none", expireAt: null },
        stats: { cfWin:0, cfLose:0, txWin:0, txLose:0, bjWin:0, bjLose:0 },
        daily: { lastClaim: null, streak: 0 }
      });
    }

    // ===== TÍNH WINRATE CF =====
    const totalCF = user.stats.cfWin + user.stats.cfLose;
    const cfRate = totalCF ? ((user.stats.cfWin / totalCF) * 100).toFixed(1) : 0;

    // ===== TÍNH VIP =====
    const now = new Date();
    let vipLabel = "❌ Thường";
    if(user.vip && user.vip.active && (!user.vip.expireAt || user.vip.expireAt > now)) {
      const tier = user.vip.tier.toLowerCase();
      vipLabel = tier === "max" ? "💎 VIP MAX" : tier === "pro" ? "💠 VIP 30" : "👑 VIP 7";
    }

    // ===== EMBED PROFILE SIÊU ĐẸP =====
    const embed = new EmbedBuilder()
      .setTitle(`👤 ${message.author.username}`)
      .setDescription("Thông tin cá nhân của bạn trong server")
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true })) // avatar góc phải
      .addFields(
        { name: "💰 Coin", value: `**${user.money.toLocaleString()}**`, inline: true },
        { name: "👑 VIP", value: vipLabel, inline: true },
        { name: "🎲 Lượt chơi CF", value: `✅ Thắng: ${user.stats.cfWin}\n❌ Thua: ${user.stats.cfLose}\nWinrate: ${cfRate}%`, inline: false },
        { name: "🃏 Lượt chơi Blackjack", value: `✅ Thắng: ${user.stats.bjWin}\n❌ Thua: ${user.stats.bjLose}`, inline: false },
        { name: "⚡ Trò chơi khác", value: `⚡ TxWin: ${user.stats.txWin}\n⚡ TxLose: ${user.stats.txLose}`, inline: false }
      )
      .setColor("Blue") // màu chủ đạo
      .setFooter({ text: `ID: ${message.author.id}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  }
};
