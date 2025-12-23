const { EmbedBuilder } = require("discord.js");
const User = require("../database/userModel");

module.exports = {
  name: "cash",
  description: "Xem số dư coin của bạn hoặc người khác. Dùng `h cash all` để xem BXH 10 người giàu nhất.",
  aliases: ["balance", "money"],
  async execute(message, args) {

    // ===== LEADERBOARD =====
    if (args[0]?.toLowerCase() === "all") {
      const top = await User.find().sort({ money: -1 }).limit(10);

      let desc = "";
      let i = 1;

      for (const u of top) {
        const userFetch = await message.client.users.fetch(u._id).catch(() => null);
        if (!userFetch) continue;

        // Kiểm tra VIP
        let vipLabel = "👤 Thường";
        const now = new Date();
        if(u.vip?.active && (!u.vip.expireAt || new Date(u.vip.expireAt) > now)) {
          const tier = u.vip.tier.toLowerCase();
          vipLabel = tier === "max" ? "💎 VIP MAX" : tier === "pro" ? "💠 VIP 30" : "👑 VIP 7";
        }

        desc += `**${i}. ${userFetch.username}** — 💰 **${u.money.toLocaleString()}** | ${vipLabel}\n`;
        i++;
      }

      const embed = new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle("🏆 BXH GIÀU NHẤT ✨")
        .setDescription(desc || "Chưa có dữ liệu")
        .setFooter({ text: "Hazel OwO", iconURL: message.client.user.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      return message.channel.send({ embeds: [embed] });
    }

    // ===== CASH CÁ NHÂN =====
    const target = message.mentions.users.first() || message.author;

    let user = await User.findById(target.id);
    if (!user) {
      user = await User.create({ 
        _id: target.id, 
        money: 1000, 
        vip: { active: false, tier: "none", expireAt: null },
        stats: { cfWin:0, cfLose:0, txWin:0, txLose:0, bjWin:0, bjLose:0 },
        daily: { lastClaim: null, streak: 0 }
      });
    }

   const isVip = user.vip?.active;
let vipLabel = "👤 Thường";
let vipColor = 0x00ff99;
if (isVip) {
    const tier = user.vip.tier.toLowerCase();
    if (tier === "vipmax") { vipLabel = "💎 VIP MAX"; vipColor = 0xff66ff; }
    else if (tier === "vip30") { vipLabel = "💠 VIP 30"; vipColor = 0x66ccff; }
    else if (tier === "vip7") { vipLabel = "👑 VIP 7"; vipColor = 0xffcc66; }
}

    const embed = new EmbedBuilder()
      .setTitle(`💰 SỐ DƯ CỦA ${target.username}`)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setColor(isVip ? 0xff66ff : 0x00ff99)
      .addFields(
        { name: "💵 Tiền hiện có", value: `**${user.money.toLocaleString()} 💰** ✨`, inline: true },
        { name: "👑 VIP", value: vipLabel, inline: true },
      )
      .setFooter({ text: "Hazel OwO | ✨ Số liệu chính xác", iconURL: message.client.user.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  }
};
