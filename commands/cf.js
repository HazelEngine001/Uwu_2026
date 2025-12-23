const User = require("../database/userModel");

const COIN_SPIN = "<a:coin_spin:1452772950427045959>";
const COIN_RESULT = "<a:coin:1452781094918295622>";

// ===== COOLDOWN =====
const cooldown = new Map();
const COOLDOWN_TIME = 10_000; // 10s

function formatVND(amount) {
  if (amount >= 1_000_000_000)
    return `${(amount / 1_000_000_000).toLocaleString()} tỷ đồng`;
  if (amount >= 1_000_000)
    return `${(amount / 1_000_000).toLocaleString()} triệu đồng`;
  if (amount >= 1_000)
    return `${(amount / 1_000).toLocaleString()} ngàn đồng`;
  return `${amount} đồng`;
}

module.exports = {
  name: "cf",
  description: "Cược đồng xu (Heads hoặc Tails) với số tiền bạn chọn. Dùng `h cf all tails` để cược tất cả vào Tails.",
  aliases: ["coinflip", "hcf"],
  async execute(message, args) {
    const userId = message.author.id;
    const now = Date.now();

    // ===== COOLDOWN CHECK =====
    if (cooldown.has(userId)) {
      const timeLeft = cooldown.get(userId) - now;
      if (timeLeft > 0) {
        return message.reply(
          `⏱ Vui lòng chờ **${Math.ceil(timeLeft / 1000)}s** để dùng lại`
        );
      }
    }
    cooldown.set(userId, now + COOLDOWN_TIME);

    let user = await User.findById(userId);
    if (!user) {
      user = await User.create({
        _id: userId,
        money: 1000,
        vip: { active: false, tier: "none", expireAt: null },
        stats: { cfWin: 0, cfLose: 0, txWin:0, txLose:0, bjWin:0, bjLose:0 },
        daily: { lastClaim: null, streak: 0 }
      });
    }

    if (!args[0]) return message.reply("❌ Dùng: `h cf <tiền | all> [tails]`");

    // ===== TIỀN =====
let amount;
if (args[0].toLowerCase() === "all") {
  if (user.money <= 0) return message.reply("❌ Bạn không có tiền");
  amount = Math.min(user.money, 500_000); // max 500k
} else {
  amount = Math.floor(Number(args[0]));
  if (!Number.isFinite(amount) || amount <= 0)
    return message.reply("❌ Số tiền không hợp lệ");
}

if (user.money < amount) return message.reply("❌ Không đủ tiền");

    // ===== CHOICE =====
    let choice = "Heads";
    if (args[1] && args[1].toLowerCase() === "tails") {
      choice = "Tails";
    }

    const name = message.member?.displayName || message.author.username;
    const moneyText = formatVND(amount);

    // ===== MESSAGE SPIN =====
    const msg = await message.reply(
      `**${name}** đã cược ${moneyText} vào **${choice}**\n` +
      `Tung đồng xu ${COIN_SPIN}`
    );

    await new Promise(r => setTimeout(r, 4000));

    // ===== RANDOM KẾT QUẢ =====
    const result = Math.random() < 0.5 ? "Heads" : "Tails";
    const win = result === choice;

    if (win) user.money += amount;
    else user.money -= amount;
    await user.save();

    // ===== RESULT =====
    await msg.edit(
      `**${name}** đã cược ${moneyText} vào **${choice}**\n` +
      `Kết quả là ${COIN_RESULT} và bạn đã ` +
      `${win ? "thắng, nhận được" : "thua, mất"} ${moneyText}`
    );
  }
};
