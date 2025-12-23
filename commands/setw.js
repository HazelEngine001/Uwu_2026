const { EmbedBuilder } = require("discord.js");
const User = require("../database/userModel");

module.exports = {
  name: "setw",
  description: "Admin: đặt lại W (work) cho user. Dùng: h setw @user",
  async execute(message, args) {
    if(!message.member.permissions.has("Administrator")) 
      return message.reply("❌ Bạn không có quyền sử dụng lệnh này!");

    const target = message.mentions.users.first();
    if(!target) return message.reply("❌ Dùng: `h setw @user`");

    let user = await User.findById(target.id);
    if(!user) {
      user = await User.create({
        _id: target.id,
        money: 1000,
        vip: { active: false, tier: "none", expireAt: null },
        w: { lastClaim: null },
        stats: { cfWin:0, cfLose:0, txWin:0, txLose:0, bjWin:0, bjLose:0 }
      });
    }

    user.w.lastClaim = null; // reset cooldown
    await user.save();

    const embed = new EmbedBuilder()
      .setTitle("✅ W ĐÃ RESET")
      .setColor(0x3498db)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setDescription(`🔄 **${target.username}** đã có thể nhận W lại từ đầu!`)
      .setFooter({ text: `Số dư hiện tại: ${user.money.toLocaleString()}`, iconURL: target.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  }
};
