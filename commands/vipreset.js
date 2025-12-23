const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const User = require("../database/userModel");

module.exports = {
  name: "resetvip",
  aliases: ["resetvipcountdown"],
  description: "Reset VIP người dùng (lệnh bí mật)",
  hidden: true, // 🔒 ẨN KHỎI HELP

  async execute(message, args) {
    const OWNER_ID = "1014803363105349693";

    // 🔇 Im lặng tuyệt đối nếu không đúng owner
    if (message.author.id !== OWNER_ID) return;

    const target = message.mentions.users.first();
    if (!target) {
      return message.reply("❌ Vui lòng mention người cần reset VIP!");
    }

    const user = await User.findById(target.id);
    if (!user) {
      return message.reply("❌ Người dùng này chưa có dữ liệu!");
    }

    const now = new Date();
    let vipLabel = "👤 Người dùng thường";
    let vipColor = 0x99aab5;

    if (user.vip?.active && (!user.vip.expireAt || new Date(user.vip.expireAt) > now)) {
      const tier = (user.vip.tier || "").toLowerCase();
      if (tier === "max") {
        vipLabel = "💎 VIP MAX";
        vipColor = 0x8e44ad;
      } else if (tier === "pro") {
        vipLabel = "💠 VIP 30";
        vipColor = 0x3498db;
      } else {
        vipLabel = "👑 VIP 7";
        vipColor = 0xf1c40f;
      }
    }

    // ===== EMBED XÁC NHẬN =====
    const confirmEmbed = new EmbedBuilder()
      .setTitle("⚠️ XÁC NHẬN RESET VIP")
      .setDescription(
        `👤 Người dùng: **${target.username}**\n` +
        `🔥 VIP hiện tại: **${vipLabel}**\n\n` +
        "Bạn có chắc chắn muốn **RESET VIP** không?"
      )
      .setColor(vipColor)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: "Hazel OwO VIP Reset System" })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("vip_confirm")
        .setLabel("✅ Đồng ý")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("vip_cancel")
        .setLabel("❌ Hủy")
        .setStyle(ButtonStyle.Danger)
    );

    const msg = await message.reply({
      embeds: [confirmEmbed],
      components: [row]
    });

    const collector = msg.createMessageComponentCollector({ time: 15000 });

    collector.on("collect", async interaction => {
      if (interaction.user.id !== OWNER_ID) {
        return interaction.reply({ content: "❌ Không có quyền.", ephemeral: true });
      }

      await interaction.deferUpdate();

      if (interaction.customId === "vip_confirm") {
        user.vip = {
          active: false,
          tier: "none",
          expireAt: null
        };
        await user.save();

        const doneEmbed = new EmbedBuilder()
          .setTitle("✅ RESET VIP THÀNH CÔNG")
          .setDescription(
            `👤 Người dùng: **${target.username}**\n` +
            `🔥 VIP cũ: **${vipLabel}**\n\n` +
            "💥 VIP đã bị reset hoàn toàn."
          )
          .setColor(0x2ecc71)
          .setThumbnail(target.displayAvatarURL({ dynamic: true }))
          .setFooter({ text: "Hazel OwO VIP Reset System" })
          .setTimestamp();

        return msg.edit({ embeds: [doneEmbed], components: [] });
      }

      if (interaction.customId === "vip_cancel") {
        const cancelEmbed = new EmbedBuilder()
          .setTitle("❌ ĐÃ HỦY RESET VIP")
          .setDescription(
            `👤 Người dùng: **${target.username}**\n` +
            `🔥 VIP vẫn giữ nguyên: **${vipLabel}**`
          )
          .setColor(vipColor)
          .setThumbnail(target.displayAvatarURL({ dynamic: true }))
          .setFooter({ text: "Hazel OwO VIP Reset System" })
          .setTimestamp();

        return msg.edit({ embeds: [cancelEmbed], components: [] });
      }
    });

    collector.on("end", collected => {
      if (collected.size === 0 && msg.editable) {
        const timeoutEmbed = new EmbedBuilder()
          .setTitle("⏱ HẾT THỜI GIAN XÁC NHẬN")
          .setDescription(
            `👤 Người dùng: **${target.username}**\n` +
            `🔥 VIP vẫn giữ nguyên: **${vipLabel}**`
          )
          .setColor(vipColor)
          .setThumbnail(target.displayAvatarURL({ dynamic: true }))
          .setFooter({ text: "Hazel OwO VIP Reset System" })
          .setTimestamp();

        msg.edit({ embeds: [timeoutEmbed], components: [] });
      }
    });
  }
};
