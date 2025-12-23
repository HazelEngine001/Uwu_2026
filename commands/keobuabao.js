const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getUser } = require("../utils/economy");

const choices = [
  { name: "✊ Kéo", id: "rock" },
  { name: "✋ Búa", id: "paper" },
  { name: "🖐 Bao", id: "scissors" }
];

const ember = "✨"; // hiệu ứng Ember

module.exports = {
  name: "kbb",
  description: "Chơi Kéo – Búa – Bao với nút chọn trực tiếp.",
  aliases: ["rockpaperscissors", "kbb"],
  async execute(msg) {
    const user = await getUser(msg.author.id);

    // Kiểm tra VIP
    let vipLabel = "👤 Thường";
    const now = new Date();
    let isVIP = false;
    if (user.vip?.active && (!user.vip.expireAt || new Date(user.vip.expireAt) > now)) {
      isVIP = true;
      const tier = user.vip.tier.toLowerCase();
      vipLabel = tier === "max" ? "💎 VIP MAX" : tier === "pro" ? "💠 VIP 30" : "👑 VIP 7";
    }

    // Tạo nút chọn
    const row = new ActionRowBuilder().addComponents(
      choices.map(c => new ButtonBuilder().setCustomId(c.id).setLabel(c.name).setStyle(ButtonStyle.Primary))
    );

    // Gửi embed chờ chọn
    const embed = new EmbedBuilder()
      .setTitle(`${ember} 🎮 KÉO – BÚA – BAO ${ember}`)
      .setDescription(`Chọn Kéo, Búa hoặc Bao để chơi!\n👑 VIP: ${vipLabel}\n💰 Coin hiện có: ${user.money.toLocaleString()}`)
      .setColor(isVIP ? 0xff66ff : 0x00ff99)
      .setThumbnail(msg.author.displayAvatarURL({ dynamic: true }));

    const m = await msg.reply({ embeds: [embed], components: [row] });

    const collector = m.createMessageComponentCollector({ time: 15000 });

    collector.on("collect", async i => {
      if (i.user.id !== msg.author.id) return i.reply({ content: "❌ Không phải của bạn!", ephemeral: true });

      const playerChoice = choices.find(c => c.id === i.customId).name;
      const bet = 5000; // Hoặc bạn muốn nhập số tiền riêng
      if (bet > user.money) return i.reply("❌ Bạn không đủ coin để cược!");

      user.money -= bet;

      // Bot chọn ngẫu nhiên
      const botChoice = choices[Math.floor(Math.random() * choices.length)].name;

      // Xác định thắng thua
      const getResult = (player, bot) => {
        if (player === bot) return "draw";
        if (
          (player === "✊ Kéo" && bot === "🖐 Bao") ||
          (player === "✋ Búa" && bot === "✊ Kéo") ||
          (player === "🖐 Bao" && bot === "✋ Búa")
        ) return "win";
        return "lose";
      };

      const result = getResult(playerChoice, botChoice);

      let coinChange = bet;
      if (result === "lose") coinChange = -bet;
      if (result === "draw") coinChange = 0;
      if (isVIP && result === "win") coinChange *= 2;

      user.money += coinChange;
      await user.save();

      const resultEmbed = new EmbedBuilder()
        .setTitle(`${ember} 🎮 KÉO – BÚA – BAO ${ember}`)
        .setDescription(
          `👤 Bạn: ${playerChoice}\n🤖 Bot: ${botChoice}\n\n🎉 Kết quả: ${result === "win" ? "✅ Thắng" : result === "lose" ? "❌ Thua" : "➖ Hòa"}\n💰 Coin thay đổi: ${coinChange.toLocaleString()}\n💰 Tổng coin hiện tại: ${user.money.toLocaleString()}\n👑 VIP: ${vipLabel}`
        )
        .setColor(result === "win" ? 0x2ecc71 : result === "lose" ? 0xe74c3c : 0xf1c40f)
        .setThumbnail(msg.author.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `Tổng coin hiện tại: ${user.money.toLocaleString()} ✨`, iconURL: msg.author.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      await i.update({ embeds: [resultEmbed], components: [] });
      collector.stop();
    });

    collector.on("end", async () => {
      if (!m.deleted && m.editable) await m.edit({ components: [] });
    });
  }
};
