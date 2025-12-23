const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const User = require("../database/userModel");

module.exports = {
  name: "setmoney",
  description: "Admin set tiền cho 1 user bất kỳ. Dùng: `h setmoney @user <số tiền>`",
  aliases: ["sm", "setcash"],
  async execute(message, args) {
    /* ===== CHECK ADMIN ===== */
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Lệnh này chỉ dành cho **Admin**");
    }

    /* ===== PARSE USER ===== */
    const target =
      message.mentions.users.first() ||
      (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);

    if (!target) {
      return message.reply("❌ Dùng: `h setmoney @user <số tiền>`");
    }

    const amount = Math.floor(Number(args[1]));
    if (!Number.isFinite(amount) || amount < 0) {
      return message.reply("❌ Số tiền không hợp lệ");
    }

    /* ===== EMBED CONFIRM ===== */
    const confirmEmbed = new EmbedBuilder()
      .setColor(0xffc107)
      .setTitle("⚠️ XÁC NHẬN SET MONEY")
      .setDescription(
        `👤 **User:** ${target.tag}\n` +
        `💰 **Money mới:** ${amount.toLocaleString()}\n\n` +
        `React ✅ để **xác nhận**\nReact ❌ để **huỷ**`
      )
      .setFooter({ text: `Admin: ${message.author.tag}` })
      .setTimestamp();

    const confirmMsg = await message.reply({ embeds: [confirmEmbed] });

    await confirmMsg.react("✅");
    await confirmMsg.react("❌");

    /* ===== COLLECT REACTION ===== */
    const filter = (reaction, user) =>
      ["✅", "❌"].includes(reaction.emoji.name) &&
      user.id === message.author.id;

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
              .setDescription("Thao tác set money đã bị huỷ")
          ]
        });
      }

      /* ===== SET MONEY ===== */
      let user = await User.findById(target.id);
      if (!user) {
        user = await User.create({
          _id: target.id,
          money: amount,
          vip: { active: false, tier: "none", expireAt: null },
          stats: { cfWin: 0, cfLose: 0, txWin:0, txLose:0, bjWin:0, bjLose:0 },
          daily: { lastClaim: null, streak: 0 }
        });
      } else {
        user.money = amount;
      }

      await user.save();

      return confirmMsg.edit({
        embeds: [
          new EmbedBuilder()
            .setColor(0x00ff99)
            .setTitle("✅ SET MONEY THÀNH CÔNG")
            .setDescription(
              `👤 **User:** ${target.tag}\n` +
              `💰 **Money:** ${amount.toLocaleString()}`
            )
            .setFooter({ text: `Admin: ${message.author.tag}` })
            .setTimestamp()
        ]
      });

    } catch (err) {
      return confirmMsg.edit({
        embeds: [
          new EmbedBuilder()
            .setColor(0x999999)
            .setTitle("⌛ HẾT THỜI GIAN")
            .setDescription("Không có phản hồi, thao tác đã bị huỷ")
        ]
      });
    }
  }
};
