const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getUser } = require("../utils/economy");

module.exports = {
  name: "boom",
  description: "Chơi Boom Game! Tránh bom và nhận coin bằng cách bấm từng ô.",
  aliases: ["minesweeper", "bombgame"],
  async execute(msg, args) {
    const user = await getUser(msg.author.id);

    // Lấy số tiền cược
    let bet;
    if (args[0]?.toLowerCase() === "all") {
      if (user.money <= 0) return msg.reply("❌ Bạn không có VND để cược!");
      bet = Math.min(user.money, 500_000); // max 500k
    } else {
      bet = parseInt(args[0]);
      if (!bet || bet <= 0) return msg.reply("❌ Vui lòng nhập số VND hợp lệ để cược.");
      if (bet > user.money) return msg.reply("❌ Bạn không đủ VND để cược!");
    }

    // Xác định VIP
    let vipLabel = "👤 Thường";
    const now = new Date();
    let isVIP = false;
    if (user.vip?.active && (!user.vip.expireAt || new Date(user.vip.expireAt) > now)) {
      isVIP = true;
      const tier = user.vip.tier.toLowerCase();
      vipLabel = tier === "max" ? "💎 VIP MAX" : tier === "pro" ? "💠 VIP 30" : "👑 VIP 7";
    }

    // Trừ tiền cược
    user.money -= bet;
    await user.save();

    // Tạo grid
    const size = 5; // 5x5
    const bombCount = 5;
    const bombs = new Set();
    while (bombs.size < bombCount) bombs.add(Math.floor(Math.random() * size * size));

    // Random coin mỗi ô
    const randomCoin = () => {
      let coin = Math.floor(Math.random() * (3000 - 500 + 1)) + 500;
      if (isVIP) coin *= 2;
      return coin;
    };

    const rowBuilder = (start) => {
      const row = new ActionRowBuilder();
      for (let i = start; i < start + size; i++) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`cell_${i}`)
            .setLabel("❔")
            .setStyle(ButtonStyle.Secondary)
        );
      }
      return row;
    };

    let totalWin = 0;
    const opened = new Set();

    const embed = new EmbedBuilder()
      .setTitle("💣 BOOM GAME")
      .setDescription(`💰 Cược: **${bet.toLocaleString()}** ✨\nVIP: ${vipLabel}\nChọn ô để mở, tránh bom!`)
      .setColor(isVIP ? 0xff66ff : 0x00ff99)
      .setThumbnail(msg.author.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `Tổng coin hiện tại: ${user.money.toLocaleString()}`, iconURL: msg.author.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    const m = await msg.reply({ embeds: [embed], components: Array.from({ length: size }, (_, i) => rowBuilder(i * size)) });

    const collector = m.createMessageComponentCollector({ time: 60000 });

    collector.on("collect", async i => {
      if (i.user.id !== msg.author.id) return i.reply({ content: "❌ Không phải của bạn!", ephemeral: true });
      await i.deferUpdate();

      const cellIndex = parseInt(i.customId.split("_")[1]);
      if (opened.has(cellIndex)) return;
      opened.add(cellIndex);

      if (bombs.has(cellIndex)) {
        totalWin = 0;
        collector.stop();
        const boomEmbed = new EmbedBuilder()
          .setTitle("💥 BÙM!")
          .setDescription(`💣 Bạn đã mở trúng bom! Thua toàn bộ cược.\n💰 Tổng coin hiện tại: ${user.money.toLocaleString()}`)
          .setColor(0xe74c3c)
          .setThumbnail(msg.author.displayAvatarURL({ dynamic: true }));
        return m.edit({ embeds: [boomEmbed], components: [] });
      } else {
        const coin = randomCoin();
        totalWin += coin;
        user.money += coin;
        await user.save();

        // Cập nhật embed
        const newEmbed = new EmbedBuilder()
          .setTitle("💣 BOOM GAME")
          .setDescription(`💰 Cược: **${bet.toLocaleString()}** ✨\nVIP: ${vipLabel}\n💰 Coin kiếm được: **${totalWin.toLocaleString()}**\nChọn ô tiếp để tránh bom!`)
          .setColor(isVIP ? 0xff66ff : 0x00ff99)
          .setThumbnail(msg.author.displayAvatarURL({ dynamic: true }))
          .setFooter({ text: `Tổng coin hiện tại: ${user.money.toLocaleString()}`, iconURL: msg.author.displayAvatarURL({ dynamic: true }) })
          .setTimestamp();

        const newComponents = m.components.map(row => {
          const newRow = new ActionRowBuilder();
          row.components.forEach(b => {
            const idx = parseInt(b.customId.split("_")[1]);
            const newButton = new ButtonBuilder()
              .setCustomId(b.customId)
              .setStyle(b.style)
              .setDisabled(opened.has(idx))
              .setLabel(opened.has(idx) ? (bombs.has(idx) ? "💣" : "✅") : "❔");
            newRow.addComponents(newButton);
          });
          return newRow;
        });

        await m.edit({ embeds: [newEmbed], components: newComponents });
      }

      if (opened.size === size * size - bombCount) {
        collector.stop();
        const winEmbed = new EmbedBuilder()
          .setTitle("🎉 THẮNG BOOM GAME!")
          .setDescription(`💰 Bạn đã tránh được tất cả bom và thu được **${totalWin.toLocaleString()} ✨** coin!\n💰 Tổng coin hiện tại: ${user.money.toLocaleString()}`)
          .setColor(0x2ecc71)
          .setThumbnail(msg.author.displayAvatarURL({ dynamic: true }));
        return m.edit({ embeds: [winEmbed], components: [] });
      }
    });

    collector.on("end", async collected => {
      if (!m.deleted && m.editable && collected.size === 0) {
        const timeoutEmbed = new EmbedBuilder()
          .setTitle("⏱ Hết thời gian!")
          .setDescription(`💰 Bạn đã bỏ lỡ lượt chơi. Tổng coin hiện tại: ${user.money.toLocaleString()}`)
          .setColor(0xf39c12)
          .setThumbnail(msg.author.displayAvatarURL({ dynamic: true }));
        m.edit({ embeds: [timeoutEmbed], components: [] });
      }
    });
  }
};
