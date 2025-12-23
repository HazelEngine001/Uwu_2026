const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const User = require("../database/userModel");

module.exports = {
  name: "addmoney",
  description: "Cộng tiền cho một user (Admin only).\nDùng: h addmoney @user <số tiền>",
  aliases: ["addcash", "am"],
  async execute(message, args) {
    // ===== CHECK ADMIN =====
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Lệnh này chỉ dành cho **Admin**");
    }

    // ===== PARSE USER =====
    const target =
      message.mentions.users.first() ||
      (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);

    if (!target) return message.reply("❌ Dùng: `h addmoney @user <số tiền>`");

    const amount = Math.floor(Number(args[1]));
    if (!Number.isFinite(amount) || amount <= 0) {
      return message.reply("❌ Số tiền không hợp lệ");
    }

    // ===== LẤY USER =====
    let user = await User.findById(target.id);
    if (!user) {
      user = await User.create({
        _id: target.id,
        money: 0,
        stats: { cfWin: 0, cfLose: 0, txWin: 0, txLose: 0, bjWin: 0, bjLose: 0 }
      });
    }

    // ===== CONFIRM EMBED =====
    const confirmEmbed = new EmbedBuilder()
      .setColor(0xffc107)
      .setTitle("⚠️ XÁC NHẬN ADD MONEY")
      .setDescription(
        `👤 **User:** ${target.tag}\n` +
        `➕ **Cộng thêm:** ${amount.toLocaleString()}\n` +
        `💰 **Hiện tại:** ${user.money.toLocaleString()}\n` +
        `💰 **Sau khi cộng:** ${(user.money + amount).toLocaleString()}\n\n` +
        `React ✅ để xác nhận\nReact ❌ để huỷ`
      )
      .setFooter({ text: `Admin: ${message.author.tag}` })
      .setTimestamp();

    const confirmMsg = await message.reply({ embeds: [confirmEmbed] });
    await confirmMsg.react("✅");
    await confirmMsg.react("❌");

    // ===== REACTION FILTER =====
    const filter = (reaction, u) =>
      ["✅", "❌"].includes(reaction.emoji.name) &&
      u.id === message.author.id;

    try {
      const collected = await confirmMsg.awaitReactions({
        filter,
        max: 1,
        time: 15000,
        errors: ["time"]
      });

      const reaction = collected.first();

      if (reaction.emoji.name === "❌") {
        return confirmMsg.edit({
          embeds: [
            new EmbedBuilder()
              .setColor(0xff5555)
              .setTitle("❌ ĐÃ HUỶ")
              .setDescription("Thao tác add money đã bị huỷ")
              .setTimestamp()
          ]
        });
      }

      // ===== ADD MONEY =====
      user.money += amount;
      await user.save();

      return confirmMsg.edit({
        embeds: [
          new EmbedBuilder()
            .setColor(0x00ff99)
            .setTitle("✅ ADD MONEY THÀNH CÔNG")
            .setDescription(
              `👤 **User:** ${target.tag}\n` +
              `➕ **Đã cộng:** ${amount.toLocaleString()}\n` +
              `💰 **Số dư mới:** ${user.money.toLocaleString()}`
            )
            .setFooter({ text: `Admin: ${message.author.tag}` })
            .setTimestamp()
        ]
      });
    } catch {
      return confirmMsg.edit({
        embeds: [
          new EmbedBuilder()
            .setColor(0x999999)
            .setTitle("⌛ HẾT THỜI GIAN")
            .setDescription("Không có phản hồi, thao tác đã bị huỷ")
            .setTimestamp()
        ]
      });
    }
  }
};
