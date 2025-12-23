const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const User = require("../database/userModel");

const VIPS = {
  1: { key: "vip7", price: 100_000, tier: "VIP 7", days: 7, color: 0xffcc66 },
  2: { key: "vip30", price: 300_000, tier: "PRO 30", days: 30, color: 0x66ccff },
  3: { key: "vipmax", price: 1_000_000, tier: "MAX", days: 0, color: 0xff66ff },
};

module.exports = {
  name: "shop",
  description: "Xem shop VIP và chọn trực tiếp",
  async execute(message) {
    // Embed shop
    const embed = new EmbedBuilder()
      .setTitle("🛒 VIP SHOP")
      .setDescription(
        "Chọn gói VIP bạn muốn sở hữu bằng cách nhấn nút bên dưới:\n\n" +
        "**1️⃣ VIP 7 ngày** — 100.000 coin\n" +
        "• ⏳ Hạn 7 ngày\n\n" +
        "**2️⃣ PRO 30 ngày** — 300.000 coin\n" +
        "• ⏳ Hạn 30 ngày\n\n" +
        "**3️⃣ MAX vĩnh viễn** — 1.000.000 coin\n" +
        "• ♾️ Vĩnh viễn"
      )
      .setColor(0xffaa00)
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: "Hazel OwO VIP Shop", iconURL: message.author.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    // Buttons căn ngang: trái - giữa - phải
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("vip_1").setLabel("1️⃣ VIP 7").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("vip_2").setLabel("2️⃣ PRO 30").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("vip_3").setLabel("3️⃣ MAX").setStyle(ButtonStyle.Danger)
    );

    const shopMessage = await message.reply({ embeds: [embed], components: [row] });

    // Collector NGAY SAU khi gửi message
    const collector = shopMessage.createMessageComponentCollector({ time: 60000 });

    collector.on("collect", async i => {
      if (i.user.id !== message.author.id)
        return i.reply({ content: "❌ Không phải của bạn!", ephemeral: true });

      await i.deferUpdate();

      const choice = i.customId.split("_")[1];
      const vip = VIPS[choice];

      let user = await User.findById(message.author.id);
      if (!user) {
        user = await User.create({
          _id: message.author.id,
          money: 1000,
          vip: { active: false, tier: "none", expireAt: null },
        });
      }

      // Kiểm tra cấp VIP hiện tại
      const vipOrder = { vip7: 1, vip30: 2, vipmax: 3, none: 0 };
      const currentVIPLevel = vipOrder[user.vip.tier || "none"];
      const selectedVIPLevel = vipOrder[vip.key];

      if (currentVIPLevel === 3) {
        return i.followUp({ content: `❌ Bạn đang là **VIP MAX** rồi, không thể mua gói thấp hơn!`, ephemeral: true });
      }

      if (selectedVIPLevel <= currentVIPLevel) {
        return i.followUp({ content: `❌ Bạn không thể mua gói thấp hơn hoặc bằng gói hiện tại!`, ephemeral: true });
      }

      if (user.money < vip.price)
        return i.followUp({ content: `❌ Không đủ coin để mua **${vip.tier}**!`, ephemeral: true });

      // Trừ tiền và cập nhật VIP
      user.money -= vip.price;
      user.vip.active = true;
      user.vip.tier = vip.key;
      user.vip.expireAt = vip.days ? new Date(Date.now() + vip.days * 86400000) : null;
      await user.save();

      const boughtEmbed = new EmbedBuilder()
        .setTitle("✅ Mua VIP Thành Công!")
        .setDescription(
          `Bạn đã mua **${vip.tier}** thành công! ✔️\n` +
          `💰 Giá: **${vip.price.toLocaleString()}** coin\n` +
          (vip.days ? `⏰ Hết hạn sau: ${vip.days} ngày` : "♾️ Vĩnh viễn")
        )
        .setColor(vip.color)
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `Tổng coin còn lại: ${user.money.toLocaleString()}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      await i.editReply({ embeds: [boughtEmbed], components: [] });
      collector.stop();
    });

    collector.on("end", collected => {
      if (!shopMessage.deleted && shopMessage.editable && collected.size === 0) {
        shopMessage.edit({ content: "⏱ Thời gian mua đã hết!", components: [] });
      }
    });
  },
};