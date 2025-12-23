const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getUser } = require("../utils/economy");

module.exports = {
  name: "bj",
  description: "Blackjack VIP + bình thường với hiệu ứng đẹp, hỗ trợ all",
  aliases: ["blackjack"],
  async execute(msg, args) {
    const user = await getUser(msg.author.id);

    if(!args[0]) return msg.reply("❌ Vui lòng nhập số tiền cược hoặc 'all'");

    // Xử lý cược all
    let bet;
    if(args[0].toLowerCase() === "all" || args[0].toLowerCase() === "max") {
      bet = user.money;
      if(bet <= 0) return msg.reply("❌ Bạn không có tiền để cược!");
    } else {
      bet = parseInt(args[0]);
      if(!bet || bet <= 0 || bet > user.money) return msg.reply("❌ Bet không hợp lệ hoặc vượt quá số dư của bạn!");
    }

    const draw = () => Math.floor(Math.random() * 10) + 1;
    const numberToEmoji = n => {
      const map = {1:"🂡",2:"🂢",3:"🂣",4:"🂤",5:"🂥",6:"🂦",7:"🂧",8:"🂨",9:"🂩",10:"🂪"};
      return map[n] || "🂠";
    }

    let p = [draw(), draw()];
    let d = [draw(), draw()];

    const sum = a => a.reduce((x,y)=>x+y,0);
    const formatHand = hand => hand.map(numberToEmoji).join(" ");

    // ===== FIX VIP đúng =====
let isVIP = false;
if(user.vip && user.vip.active) {
    // Nếu gói VIP chưa hết hạn hoặc không hết hạn
    const now = new Date();
    if(!user.vip.expireAt || user.vip.expireAt > now) {
        isVIP = true;
    }
}
const vipLabel = isVIP ? "💎 VIP" : "👤 Thường";
// ========================

    // ======================

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("hit").setLabel("Hit 🃏").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("stand").setLabel("Stand ✋").setStyle(ButtonStyle.Secondary)
    );

    const createEmbed = (title, description, color) =>
      new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setFooter({ text: `💰 Tiền hiện có: ${user.money.toLocaleString()} | ${vipLabel}`, iconURL: msg.author.displayAvatarURL({ dynamic: true }) });

    const m = await msg.reply({
      embeds: [createEmbed("🃏 BLACKJACK", `🧑 Bạn: ${formatHand(p)} (Tổng: ${sum(p)})\n🎩 Dealer: ${numberToEmoji(d[0])} ❓`, 0x9b59b6)],
      components: [row]
    });

    const col = m.createMessageComponentCollector({ time: 60000 });

    col.on("collect", async i => {
      if(i.user.id !== msg.author.id) return i.reply({ content:"❌ Không phải của bạn!", ephemeral:true });

      await i.deferUpdate();

      if(i.customId === "hit"){
        p.push(draw());
        if(sum(p) > 21){
          user.money -= bet; user.stats.bjLose++; await user.save();
          return m.edit({ embeds: [createEmbed("💥 BUST!", `🧑 Bạn: ${formatHand(p)} (Tổng: ${sum(p)})\n🎩 Dealer: ${formatHand(d)} (Tổng: ${sum(d)})`, 0xe74c3c)], components: [] });
        }
        return m.edit({ embeds: [createEmbed("🃏 BLACKJACK", `🧑 Bạn: ${formatHand(p)} (Tổng: ${sum(p)})\n🎩 Dealer: ${numberToEmoji(d[0])} ❓`, 0xF1C40F)], components: [row] });
      }

      if(i.customId === "stand"){
        while(sum(d)<17) d.push(draw());
        let win = sum(d) > 21 || sum(p) > sum(d);

        let finalBet = bet;
        if(win && isVIP) finalBet = Math.floor(bet * 1.1); // VIP +10%

        user.money += win ? finalBet : -bet;
        win ? user.stats.bjWin++ : user.stats.bjLose++;
        await user.save();

        await m.edit({ embeds: [createEmbed(win?"🎉 THẮNG!":"😢 THUA!", `🧑 Bạn: ${formatHand(p)} (Tổng: ${sum(p)})\n🎩 Dealer: ${formatHand(d)} (Tổng: ${sum(d)})\n💰 ${(win ? finalBet : -bet).toLocaleString()} tiền thay đổi`, win?0x2ecc71:0xe74c3c)], components: [] });
        col.stop();
      }
    });

    col.on("end", async () => {
      if(!m.deleted && m.editable) await m.edit({ components: [] });
    });
  }
}
