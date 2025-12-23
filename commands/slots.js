const { EmbedBuilder } = require("discord.js");
const { getUser } = require("../utils/economy");

const icons = ["🍒", "🍋", "💎", "🔔", "7️⃣"];

module.exports = {
  name: "slots",
  description: "Chơi máy slot. Dùng: `h slots <số tiền>` để cược.",
  aliases: ["slot", "casino"],
  async execute(msg, args) {
    const bet = parseInt(args[0]);
    const user = await getUser(msg.author.id);

    if (!bet || bet <= 0 || bet > user.money)
      return msg.reply("❌ Bet không hợp lệ hoặc vượt quá số dư!");

    user.money -= bet; // trừ tiền ngay khi cược

    // ==== XÁC ĐỊNH VIP ====
    let isVIP = false;
    if(user.vip && user.vip.active && (!user.vip.expireAt || new Date(user.vip.expireAt) > new Date())) {
      isVIP = true;
    }

    const roll = () => icons[Math.floor(Math.random() * icons.length)];
    const s = [roll(), roll(), roll()];

    let win = 0;
    if (s[0] === s[1] && s[1] === s[2]) win = bet * 5;
    else if (new Set(s).size === 2) win = bet * 2;

    // VIP +10% tiền thắng
    let finalWin = win;
    if(win > 0 && isVIP) finalWin = Math.floor(win * 1.1);

    if (finalWin > 0) {
      user.money += finalWin;
      user.stats.slotWin = (user.stats.slotWin || 0) + 1;
    } else {
      user.stats.slotLose = (user.stats.slotLose || 0) + 1;
    }

    await user.save();

    // ==== EMBED ĐẸP HƠN ====
    const embed = new EmbedBuilder()
      .setTitle("🎰 SLOT MACHINE")
      .setDescription(
        `🎲 **Cược:** ${bet.toLocaleString()} coin\n` +
        `🎰 Kết quả: ${s.join(" | ")}\n\n` +
        (finalWin > 0 
          ? `🎉 Bạn đã thắng **${finalWin.toLocaleString()} coin**${isVIP ? " 💎 (VIP +10%)" : ""}` 
          : `💀 Thua rồi!`) 
      )
      .setColor(finalWin > 0 ? 0x2ecc71 : 0xe74c3c)
      .setFooter({ text: `💰 Số dư hiện tại: ${user.money.toLocaleString()} | ${isVIP ? "💎 VIP" : "👤 Thường"}`, iconURL: msg.author.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    msg.reply({ embeds: [embed] });
  }
};
