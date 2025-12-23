const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const User = require("../database/userModel");

module.exports = {
  name: "resetvip",
  description: "Reset VIP người dùng về trạng thái bình thường với xác nhận.",
  aliases: ["resetvipcountdown"],
  async execute(message, args) {
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("❌ Chỉ admin mới có thể reset VIP!");
    }

    const target = message.mentions.users.first();
    if (!target) return message.reply("❌ Vui lòng mention người muốn reset VIP!");

    let user = await User.findById(target.id);
    if (!user) return message.reply("❌ Người dùng này chưa có dữ liệu!");

    const now = new Date();
    let vipLabel = "👤 Người dùng thường";
    let vipColor = 0x99aab5; // xám
    if (user.vip?.active && (!user.vip.expireAt || new Date(user.vip.expireAt) > now)) {
      const tier = user.vip.tier.toLowerCase();
      if (tier === "max") { vipLabel = "💎 VIP MAX"; vipColor = 0x8e44ad; }
      else if (tier === "pro") { vipLabel = "💠 VIP 30"; vipColor = 0x3498db; }
      else { vipLabel = "👑 VIP 7"; vipColor = 0xf1c40f; }
    }

    // Embed xác nhận
    const embed = new EmbedBuilder()
      .setTitle("⚠️ XÁC NHẬN RESET VIP")
      .setDescription(
        `🔥 VIP hiện tại của **${target.username}**: **${vipLabel}**\n` +
        "Bạn có chắc chắn muốn reset VIP và trả về trạng thái người dùng thường?"
      )
      .setColor(vipColor)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: "Bấm ✅ để xác nhận hoặc ❌ để hủy" })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("confirm")
        .setLabel("✅ Đồng ý")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("cancel")
        .setLabel("❌ Hủy")
        .setStyle(ButtonStyle.Danger)
    );

    const msg = await message.reply({ embeds: [embed], components: [row] });

    const collector = msg.createMessageComponentCollector({ time: 15000 });

    collector.on("collect", async i => {
      if (i.user.id !== message.author.id)
        return i.reply({ content: "❌ Chỉ admin thực hiện được!", ephemeral: true });

      await i.deferUpdate();

      if (i.customId === "confirm") {
        // Reset VIP
        user.vip = { active: false, tier: "none", expireAt: null };
        await user.save();

        const doneEmbed = new EmbedBuilder()
          .setTitle("✅ VIP ĐÃ ĐƯỢC RESET")
          .setDescription(`🔥 VIP cũ của **${target.username}**: **${vipLabel}**\n💥 VIP đã bị reset hoàn toàn.`)
          .setColor(vipColor)
          .setThumbnail(target.displayAvatarURL({ dynamic: true }))
          .setFooter({ text: "Hazel OwO VIP Reset System" })
          .setTimestamp();

        return msg.edit({ embeds: [doneEmbed], components: [] });
      } else if (i.customId === "cancel") {
        const cancelEmbed = new EmbedBuilder()
          .setTitle("❌ HỦY RESET VIP")
          .setDescription(`VIP của **${target.username}** vẫn giữ nguyên: **${vipLabel}**`)
          .setColor(vipColor)
          .setThumbnail(target.displayAvatarURL({ dynamic: true }))
          .setFooter({ text: "Hazel OwO VIP Reset System" })
          .setTimestamp();

        return msg.edit({ embeds: [cancelEmbed], components: [] });
      }
    });

    collector.on("end", async collected => {
      if (!msg.deleted && msg.editable && collected.size === 0) {
        const timeoutEmbed = new EmbedBuilder()
          .setTitle("⏱ HẾT THỜI GIAN XÁC NHẬN")
          .setDescription(`VIP của **${target.username}** vẫn giữ nguyên: **${vipLabel}**`)
          .setColor(vipColor)
          .setThumbnail(target.displayAvatarURL({ dynamic: true }))
          .setFooter({ text: "Hazel OwO VIP Reset System" })
          .setTimestamp();
        msg.edit({ embeds: [timeoutEmbed], components: [] });
      }
    });
  },
};
