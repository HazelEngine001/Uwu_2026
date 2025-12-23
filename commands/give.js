const { EmbedBuilder } = require("discord.js");
const User = require("../database/userModel");

module.exports = {
  name: "give",
  description: "Chuyển coin cho người khác. Dùng: `h give @user <số tiền>`",
  aliases: ["transfer", "send"],
  async execute(message, args) {
    const target = message.mentions.users.first();
    const amount = parseInt(args[1]);

    if (!target || isNaN(amount) || amount <= 0) {
      const embedErr = new EmbedBuilder()
        .setColor(0xe74c3c) // màu đỏ lỗi
        .setTitle("❌ LỖI GỬI COIN")
        .setDescription("Dùng: `h give @user <số tiền>`")
        .setFooter({ text: message.author.username, iconURL: message.author.displayAvatarURL({ dynamic: true }) });
      return message.reply({ embeds: [embedErr] });
    }

    if (target.id === message.author.id) {
      const embedSelf = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle("❌ Không thể tự give cho chính mình")
        .setFooter({ text: message.author.username, iconURL: message.author.displayAvatarURL({ dynamic: true }) });
      return message.reply({ embeds: [embedSelf] });
    }

    // ===== LẤY SENDER =====
    let sender = await User.findById(message.author.id);
    if (!sender) {
      sender = await User.create({
        _id: message.author.id,
        money: 1000,
        vip: { active: false, tier: "none", expireAt: null },
        stats: { cfWin:0, cfLose:0, txWin:0, txLose:0, bjWin:0, bjLose:0 },
        daily: { lastClaim: null, streak: 0 }
      });
    }

    if (sender.money < amount) {
      const embedNoMoney = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle("❌ Không đủ tiền")
        .setDescription(`Bạn có **${sender.money.toLocaleString()}** coin nhưng muốn chuyển **${amount.toLocaleString()}** coin.`)
        .setFooter({ text: message.author.username, iconURL: message.author.displayAvatarURL({ dynamic: true }) });
      return message.reply({ embeds: [embedNoMoney] });
    }

    // ===== LẤY RECEIVER =====
    let receiver = await User.findById(target.id);
    if (!receiver) {
      receiver = await User.create({
        _id: target.id,
        money: 1000,
        vip: { active: false, tier: "none", expireAt: null },
        stats: { cfWin:0, cfLose:0, txWin:0, txLose:0, bjWin:0, bjLose:0 },
        daily: { lastClaim: null, streak: 0 }
      });
    }

    // ===== CHUYỂN TIỀN =====
    sender.money -= amount;
    receiver.money += amount;

    await sender.save();
    await receiver.save();

    // ===== EMBED THÀNH CÔNG =====
    const embedSuccess = new EmbedBuilder()
      .setColor(0x00cc66) // màu xanh thành công
      .setTitle("✅ CHUYỂN TIỀN THÀNH CÔNG")
      .setDescription(
        `💸 **${message.author.username}** đã chuyển **${amount.toLocaleString()} coin** cho **${target.username}**`
      )
      .setFooter({ text: `Người gửi: ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    message.channel.send({ embeds: [embedSuccess] });
  }
};
