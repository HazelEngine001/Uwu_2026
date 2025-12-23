import discord
from discord.ext import commands, tasks
from discord.ui import Button, View
import random, time, asyncio
from flask import Flask
from threading import Thread
from collections import defaultdict
import asyncio
import random
import itertools



# ================= KEEP ALIVE =================
app = Flask("")

@app.route("/")
def home():
    return "Hazel OwO PRO ONLINE"

Thread(target=lambda: app.run(host="0.0.0.0", port=8080)).start()

# ================= BOT =================
intents = discord.Intents.all()
bot = commands.Bot(command_prefix="h ", intents=intents, help_command=None)

# ================= DATA (RAM) =================
users = defaultdict(lambda: 1000)  # user_id: coin
daily_cd = {}
work_cd = {}
tx_cd = {}
cf_cooldown = {}
cf_win_streak = defaultdict(int)
cf_total_win = defaultdict(int)
cf_total_lose = defaultdict(int)
cf_bonus_rate = defaultdict(float)
cf_boost_users = set()
vip_users = set()
jackpot = 0

TX_CD_NORMAL = 10
TX_CD_VIP = 7

START_MONEY = 1000

shop_items = {
    "vip": {"name": "VIP PASS", "price": 500000, "effect": "vip"},
    "cf": {"name": "Coin Flip Booster", "price": 500000, "effect": "cf_boost"}
}

# ================= UTIL =================
def get_money(uid):
    return users[uid]

def add_money(uid, amount):
    users[uid] = max(0, get_money(uid) + amount)

def is_vip(uid):
    return uid in vip_users

def has_cf_boost(uid):
    return uid in cf_boost_users

def add_cf_boost(uid):
    cf_boost_users.add(uid)

# ================= ANIMATION =================
async def glow_embed(msg, embed, colors=None, delay=0.25):
    if colors is None:
        colors = [0xff0000, 0xff8800, 0xffff00, 0x00ff99, 0x00ccff]
    for c in colors:
        embed.color = c
        await msg.edit(embed=embed)
        await asyncio.sleep(delay)

async def money_animation(ctx, old, new):
    msg = await ctx.send(f"💰 {old:,}")
    step = max(1, (new - old)//10)
    val = old
    while val < new:
        val += step
        if val > new:
            val = new
        await asyncio.sleep(0.1)
        await msg.edit(content=f"💰 {val:,}")

def cooldown_bar(left, total=10, size=10):
    filled = int((total - left) / total * size)
    return "█" * filled + "░" * (size - filled)

# ================= BOT EVENTS =================
@bot.event
async def on_ready():
    print(f"✅ Online: {bot.user}")

# ================= COMMANDS =================

# -------- CASH --------
@bot.command()
async def cash(ctx):
    uid = ctx.author.id
    bal = get_money(uid)
    e = discord.Embed(title="💳 VÍ TIỀN", description="🔍 **Đang kiểm tra số dư...**", color=0x111111)
    e.set_thumbnail(url=ctx.author.avatar.url)
    e.set_footer(text="Hazel OwO • Secure Wallet")
    msg = await ctx.send(embed=e)
    await glow_embed(msg, e, colors=[0xffd700,0xffa500,0x00ffcc,0x7b68ee])
    e.description = f"👤 **{ctx.author.name}**\n━━━━━━━━━━━━━━\n💰 **{bal:,} coin**\n✨ Trạng thái: **Ổn định**"
    e.color = 0xffd700
    await msg.edit(embed=e)

# -------- DAILY --------
@bot.command()
async def daily(ctx):
    uid = ctx.author.id
    now = time.time()
    if uid in daily_cd and now - daily_cd[uid] < 86400:
        return await ctx.send("⏳ Bạn đã nhận Daily hôm nay rồi")
    daily_cd[uid] = now

    e = discord.Embed(title="🎁 DAILY REWARD", description="📦 **Đang mở quà...**\n`[░░░░░░░░░░]`", color=0x00aa66)
    e.set_footer(text="Hazel OwO • Reward System")
    msg = await ctx.send(embed=e)

    bars = ["█░░░░░░░░░", "███░░░░░░░", "█████░░░░░", "██████████"]
    for b in bars:
        await asyncio.sleep(0.6)
        e.description = f"📦 **Đang mở quà...**\n`[{b}]`"
        await msg.edit(embed=e)

    reward = 500
    add_money(uid, reward)
    e.description = f"🎉 **NHẬN THƯỞNG THÀNH CÔNG!**\n💵 +{reward:,} coin\n🔥 Quay lại sau **24h**"
    e.color = 0x00ff99
    await msg.edit(embed=e)

# -------- WORK --------
@bot.command()
async def w(ctx):
    uid = ctx.author.id
    now = time.time()
    
    # ===== COOLDOWN 10 phút =====
    if uid in work_cd and now - work_cd[uid] < 600:
        left = int(600 - (now - work_cd[uid]))
        return await ctx.send(f"⏳ Chờ **{left}s** nữa để làm việc lại!")
    
    work_cd[uid] = now

    # ===== EMBED ĐANG LÀM VIỆC =====
    e = discord.Embed(
        title="👷 WORKING...",
        description="🔧 **Đang làm việc chăm chỉ...**",
        color=0x1a1a1a
    )
    e.set_thumbnail(url="https://cdn-icons-png.flaticon.com/512/3062/3062634.png")  # icon công nhân
    msg = await ctx.send(embed=e)

    # ===== HIỆU ỨNG GLOW =====
    async def glow_embed(message, embed, colors, times=8, delay=0.5):
        for i in range(times):
            embed.color = random.choice(colors)
            try:
                await message.edit(embed=embed)
            except:
                pass
            await asyncio.sleep(delay)

    await glow_embed(msg, e, colors=[0x3399ff, 0x00ccff, 0x00ffcc, 0xffcc00, 0xff66ff])

    # ===== TÍNH TIỀN THƯỞNG =====
    reward = random.randint(1000, 5000)
    if is_vip(uid):
        reward = int(reward * 1.2)
        vip_text = "💎 VIP Bonus Applied! +20%"
    else:
        vip_text = ""

    add_money(uid, reward)

    # ===== EMBED HOÀN THÀNH =====
    e.title = "💼 HOÀN THÀNH CÔNG VIỆC"
    e.description = f"💵 Nhận **{reward:,} coin** {vip_text}"
    e.color = 0x00ffcc
    e.set_thumbnail(url="https://cdn-icons-png.flaticon.com/512/3135/3135715.png")  # icon coin
    e.set_footer(text=f"Hazel OwO • {ctx.author.display_name}", icon_url=ctx.author.avatar.url if ctx.author.avatar else None)
    await msg.edit(embed=e)

# -------- TX --------
class TaiXiuView(View):
    def __init__(self, ctx, bet):
        super().__init__(timeout=20)
        self.ctx = ctx
        self.bet = bet
        self.uid = ctx.author.id

    async def interaction_check(self, interaction):
        if interaction.user.id != self.uid:
            await interaction.response.send_message("❌ Không phải lượt của bạn", ephemeral=True)
            return False
        return True

    async def glow(self, msg, embed):
        await glow_embed(msg, embed)

    async def play(self, interaction, choice):
        global jackpot
        await interaction.response.defer()
        msg = interaction.message
        embed = discord.Embed(title="🎲 TÀI XỈU", description="🎲 **ĐANG LẮC XÚC XẮC...**", color=0xffffff)
        await msg.edit(embed=embed, view=None)
        await self.glow(msg, embed)

        dice = [random.randint(1,6) for _ in range(3)]
        total = sum(dice)
        result = "tai" if total>=11 else "xiu"
        jackpot += int(self.bet*0.1)
        jackpot_text = ""
        if total in [3,18]:
            add_money(self.uid, jackpot)
            jackpot_text = f"\n🎰 **NỔ JACKPOT +{jackpot:,}**"
            jackpot = 0

        if choice == result:
            add_money(self.uid,self.bet)
            res = f"✅ **THẮNG +{self.bet:,}**"
            color=0xff4d4d
        else:
            add_money(self.uid,-self.bet)
            res=f"❌ **THUA -{self.bet:,}**"
            color=0x4da6ff

        bar = "█"*min(jackpot//100,10)
        bar = bar.ljust(10,"░")
        dice_icons=" ".join([f"🎲 {d}" for d in dice])
        embed=discord.Embed(title="🎮 KẾT QUẢ TÀI XỈU",
                            description=f"{dice_icons}\n📊 Tổng: **{total} → {result.upper()}**\n\n{res}{jackpot_text}\n\n🎰 Jackpot: `{bar}`",
                            color=color)
        embed.set_footer(text="Hazel OwO • Casino System")
        await msg.edit(embed=embed)

    @discord.ui.button(label="🔥 TÀI", style=discord.ButtonStyle.danger)
    async def tai(self, interaction, button):
        await self.play(interaction,"tai")
    @discord.ui.button(label="❄️ XỈU", style=discord.ButtonStyle.primary)
    async def xiu(self, interaction, button):
        await self.play(interaction,"xiu")

@bot.command()
async def tx(ctx, amount: str):
    uid = ctx.author.id
    bal = get_money(uid)
    now=time.time()
    isvip=is_vip(uid)
    cooldown=TX_CD_VIP if isvip else TX_CD_NORMAL
    badge="💎 VIP" if isvip else "👤 Thường"
    if uid in tx_cd and now - tx_cd[uid] < cooldown:
        left = int(cooldown-(now-tx_cd[uid]))
        embed=discord.Embed(title="⏳ ĐANG HỒI CHIÊU",
                            description=f"🕒 Còn **{left}s**\n🎖 Trạng thái: **{badge}**\n\n`{cooldown_bar(left,cooldown)}`",
                            color=0x444444)
        embed.set_footer(text="Hazel OwO • Cooldown System")
        msg=await ctx.send(embed=embed)
        colors=[0xff5555,0xffaa00,0xffff55,0x55ffcc,0x5599ff]
        while left>0:
            await asyncio.sleep(1)
            left-=1
            embed.color=colors[left%len(colors)]
            embed.description=f"🕒 Còn **{left}s**\n🎖 Trạng thái: **{badge}**\n\n`{cooldown_bar(left,cooldown)}`"
            await msg.edit(embed=embed)
        return
    # parse amount
    if amount.lower()=="all":
        amount=bal
    else:
        amount=int(amount)
    if amount<=0 or amount>bal:
        return await ctx.send("❌ Số tiền không hợp lệ")
    tx_cd[uid]=time.time()
    embed=discord.Embed(title="🎮 TÀI XỈU",
                        description=f"💰 Cược: **{amount:,} coin**\n🎖 Trạng thái: **{badge}**\n👇 Bấm nút để chọn",
                        color=0xffff00)
    embed.set_footer(text="Hazel OwO • Button Game")
    await ctx.send(embed=embed, view=TaiXiuView(ctx, amount))
# -------- COIN FLIP --------

@bot.command()
async def cf(ctx, amount: str):
    uid = ctx.author.id
    now = time.time()
    
    # COOLDOWN 5s
    if uid in cf_cooldown and now - cf_cooldown[uid] < 5:
        return await ctx.send("⏳ Chờ 5 giây giữa mỗi lần CF")
    cf_cooldown[uid] = now

    # Xử lý tiền cược
    if amount.lower() == "all":
        bet = get_money(uid)
        if bet <= 0:
            return await ctx.send("❌ Không có tiền để cược")
    else:
        try:
            bet = int(amount)
            if bet <= 0 or bet > get_money(uid):
                return await ctx.send("❌ Số tiền không hợp lệ")
        except:
            return await ctx.send("❌ Số tiền không hợp lệ")

    # CLASS VIEW
    class CFView(View):
        def __init__(self):
            super().__init__(timeout=30)
            self.chosen = False

        async def handle(self, interaction, choice):
            if self.chosen:
                await interaction.response.send_message("⚠️ Bạn đã chọn rồi!", ephemeral=True)
                return
            self.chosen = True

            # 💫 Hiệu ứng lắc xu
            flip_gif = "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif"
            embed_anim = discord.Embed(
                title="🪙 Lắc coin...",
                description="🎲 Đang xác định kết quả...",
                color=discord.Color.gold()
            )
            embed_anim.set_image(url=flip_gif)
            embed_anim.set_thumbnail(url=ctx.author.avatar.url)
            embed_anim.set_footer(text="Hazel OwO • Coin Flip")
            await interaction.response.edit_message(embed=embed_anim, view=None)

            await asyncio.sleep(2)  # delay để người chơi thấy GIF

            # Tính thắng thua + CF Booster
            win_chance = 0.5
            if has_cf_boost(uid):
                win_chance += 0.1  # CF Booster tăng 10% cơ hội thắng
            if win_chance > 1: win_chance = 1
            is_win = random.random() < win_chance

            # Embed kết quả
            win_gif = "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif"
            lose_gif = "https://media.giphy.com/media/9Y5BbDSkSTiY8/giphy.gif"

            embed_res = discord.Embed(
                title="🪙 COIN FLIP RESULT",
                color=discord.Color.green() if is_win else discord.Color.red()
            )
            embed_res.set_image(url=win_gif if is_win else lose_gif)
            embed_res.set_thumbnail(url=ctx.author.avatar.url)

            if is_win:
                total = bet
                # Có thể thêm bonus nếu có CF Booster
                if has_cf_boost(uid):
                    bonus = int(total * 0.1)
                    total += bonus
                    embed_res.description = (
                        f"🎉 **THẮNG!**\n💰 +{total:,} coin "
                        f"(CF Booster +{bonus:,}!)\n🎊 Chúc mừng!"
                    )
                else:
                    embed_res.description = f"🎉 **THẮNG!**\n💰 +{total:,} coin\n🎊 Chúc mừng!"
                add_money(uid, total)
            else:
                add_money(uid, -bet)
                embed_res.description = f"💀 **THUA!**\n💸 -{bet:,} coin\n😢 Hên lần sau nhé!"

            footer_text = "Hazel OwO • Coin Flip"
            if has_cf_boost(uid):
                footer_text += " 🔥 CF Booster active!"
            embed_res.set_footer(text=footer_text)

            await interaction.edit_original_response(embed=embed_res, view=None)


        @discord.ui.button(label="Heads", style=discord.ButtonStyle.primary)
        async def heads(self, interaction, button):
            await self.handle(interaction, "heads")

        @discord.ui.button(label="Tails", style=discord.ButtonStyle.secondary)
        async def tails(self, interaction, button):
            await self.handle(interaction, "tails")

    # Embed ban đầu
    embed = discord.Embed(
        title="🪙 COIN FLIP CHALLENGE 🪙",
        description=f"🎲 Bạn sắp chơi **{bet:,} coin**!\n\nChọn **Heads** hoặc **Tails** để bắt đầu.",
        color=discord.Color.purple()
    )
    embed.set_thumbnail(url=ctx.author.avatar.url)
    embed.set_footer(text="Hazel OwO • Coin Flip")

    await ctx.send(embed=embed, view=CFView())

# -------- BUY --------
@bot.command()
async def buy(ctx,item:str):
    uid=ctx.author.id
    item=item.lower()
    if item not in shop_items:
        return await ctx.send("❌ Item không tồn tại")
    price=shop_items[item]["price"]
    if get_money(uid)<price:
        return await ctx.send("❌ Không đủ tiền")
    effect=shop_items[item]["effect"]
    if effect=="vip":
        vip_users.add(uid)
    elif effect=="cf_boost":
        add_cf_boost(uid)
    add_money(uid,-price)
    await ctx.send(f"✅ Mua {shop_items[item]['name']} thành công!")


# -------- SHOP --------
@bot.command()
async def shop(ctx):
    uid = ctx.author.id
    badge = "💎 VIP" if is_vip(uid) else "👤 STANDARD"
    
    # Tạo Embed
    e = discord.Embed(title="🛒 HAZEL SHOP", color=0xffcc00)
    e.description = "Chọn item bạn muốn mua bằng lệnh `h buy <item>`\n✨ Một số item đặc biệt giúp bạn chơi Coin Flip dễ hơn!"
    
    for key, item in shop_items.items():
        # Thêm icon và mô tả nâng cao
        if item["effect"] == "vip":
            icon = "💎"
            effect_text = "VIP PASS: Truy cập đặc quyền VIP!"
        elif item["effect"] == "cf_boost":
            icon = "🎯"
            effect_text = "Coin Flip Booster: Tăng cơ hội thắng thêm!"
        else:
            icon = "🛠️"
            effect_text = "Item hữu ích cho game."
        
        desc = f"{icon} **Giá:** {item['price']:,} coin\n{effect_text}\n👉 Mua: `h buy {key}`"
        e.add_field(name=f"{item['name']}", value=desc, inline=False)
    
    e.set_footer(text=f"Hazel OwO • {badge}")
    await ctx.send(embed=e)
@bot.command()
async def help(ctx):
    """Hiển thị tất cả lệnh trừ addmoney"""
    embed = discord.Embed(
        title="📜 Hazel OwO Commands",
        description="Danh sách các lệnh bạn có thể sử dụng:",
        color=0xffcc00
    )

    # Danh sách lệnh và mô tả
    commands_list = {
        "cf": "🎯 Coin Flip - chơi đoán đồng xu",
        "cf all": "💰 Coin Flip với toàn bộ số tiền",
        "tx": "🎲 Tài Xỉu - cược may rủi",
        "poker": "🃏 Poker mini - chơi bài với bot",
        "shop": "🛒 Xem shop và item",
        "buy": "✅ Mua item từ shop",
        "w": "💼 Nhận tiền online mỗi 10 phút",
        "help": "📜 Hiển thị danh sách lệnh"
    }

    for cmd, desc in commands_list.items():
        embed.add_field(name=f"`h {cmd}`", value=desc, inline=False)

    embed.set_footer(text=f"Hazel OwO • {ctx.author.display_name}", icon_url=ctx.author.avatar.url if ctx.author.avatar else None)
    embed.set_thumbnail(url="https://cdn-icons-png.flaticon.com/512/906/906334.png")  # icon đẹp

    await ctx.send(embed=embed)

@bot.command()
async def addmoney(ctx, member: discord.Member, amount: int):
    """Chỉ bạn mới có thể dùng, thêm tiền với xác nhận và hiệu ứng coin"""
    if ctx.author.id != 1014803363105349693:
        return await ctx.send("❌ Bạn không có quyền sử dụng lệnh này!")

    if amount <= 0:
        return await ctx.send("❌ Số tiền phải lớn hơn 0")
    
    class ConfirmView(View):
        def __init__(self):
            super().__init__(timeout=30)
            self.value = None

        @discord.ui.button(label="✅ Đồng ý", style=discord.ButtonStyle.success)
        async def confirm(self, interaction: discord.Interaction, button: discord.ui.Button):
            if interaction.user.id != ctx.author.id:
                return await interaction.response.send_message("❌ Bạn không được phép bấm nút này!", ephemeral=True)
            
            # Hiệu ứng coin + sparkle
            coins = ["💰","✨","💸","🪙"]
            await interaction.response.send_message(content="💫 Đang thêm tiền...", ephemeral=False)

            for i in range(5):
                await asyncio.sleep(0.5)
                content = "".join(random.choices(coins, k=5)) + f"  {member.mention} +{amount:,} coin!"
                try:
                    await interaction.edit_original_response(content=content)
                except:
                    pass

            add_money(member.id, amount)
            await interaction.edit_original_response(content=f"🎉 {member.mention} vừa nhận được **{amount:,} coin**! {random.choice(coins)}", view=None)
            self.value = True
            self.stop()

        @discord.ui.button(label="❌ Từ chối", style=discord.ButtonStyle.danger)
        async def cancel(self, interaction: discord.Interaction, button: discord.ui.Button):
            if interaction.user.id != ctx.author.id:
                return await interaction.response.send_message("❌ Bạn không được phép bấm nút này!", ephemeral=True)
            await interaction.response.edit_message(content="❌ Hành động bị hủy!", embed=None, view=None)
            self.value = False
            self.stop()

    embed = discord.Embed(
        title="⚠️ Xác nhận thêm tiền",
        description=f"Bạn có chắc muốn thêm **{amount:,} coin** cho {member.mention} không?",
        color=0xffcc00
    )
    await ctx.send(embed=embed, view=ConfirmView())


@bot.command()
async def poker(ctx, bet: int):
    """Chơi Poker mini với bot"""
    uid = ctx.author.id
    balance = get_money(uid)

    if bet <= 0:
        return await ctx.send("❌ Số tiền phải lớn hơn 0")
    if bet > balance:
        return await ctx.send("❌ Bạn không đủ coin để cược!")

    # Trừ tiền cược
    add_money(uid, -bet)

    suits = ["♠️", "♥️", "♦️", "♣️"]
    values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
    deck = list(itertools.product(values, suits))
    random.shuffle(deck)

    # Chia bài cho player và bot
    player_cards = [deck.pop() for _ in range(5)]
    bot_cards = [deck.pop() for _ in range(5)]

    def format_hand(hand):
        return " ".join([f"`{v}{s}`" for v, s in hand])

    e = discord.Embed(
        title="🃏 POKER GAME",
        description=f"🎴 Bạn cược **{bet:,} coin**\nĐang chia bài...",
        color=0xff9900
    )
    msg = await ctx.send(embed=e)
    await asyncio.sleep(2)

    e.description = f"🫵 Bài của bạn: {format_hand(player_cards)}\n🤖 Bài của bot: {format_hand(bot_cards)}"
    await msg.edit(embed=e)
    await asyncio.sleep(2)

    # So sánh bài đơn giản: tính điểm cao nhất
    value_order = {v: i for i, v in enumerate(values, 1)}
    player_score = max(value_order[v] for v, s in player_cards)
    bot_score = max(value_order[v] for v, s in bot_cards)

    if player_score > bot_score:
        win_amount = bet * 2
        add_money(uid, win_amount)
        result_text = f"🎉 Bạn thắng! Nhận **{win_amount:,} coin**"
        e.color = 0x00ff00
    elif player_score < bot_score:
        result_text = "😢 Bạn thua! Coin đã mất"
        e.color = 0xff0000
    else:
        add_money(uid, bet)  # hoàn tiền
        result_text = "🤝 Hòa! Coin được hoàn trả"
        e.color = 0xffff00

    e.description += f"\n\n{result_text}"
    await msg.edit(embed=e)


# -------- TOP --------
@bot.command()
async def top(ctx):
    sorted_users=sorted(users.items(),key=lambda x:x[1],reverse=True)[:5]
    desc=""
    for i,(uid,money) in enumerate(sorted_users,1):
        user=await bot.fetch_user(uid)
        desc+=f"**{i}. {user.name}** — `{money:,}` 💰\n"
    e=discord.Embed(title="🏆 BXH GIÀU NHẤT",description=desc or "Chưa có dữ liệu",color=0xffd700)
    await ctx.send(embed=e)

# ================= RUN =================
bot.run("MTM5MjQ2MzYxNDQwNDg1Nzg2Nw.Gvi2uI.tcR9HIiqLezH8YMAE9fX3OsDMVAbeLi8K-oDj0")
