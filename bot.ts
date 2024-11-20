import { Bot } from "grammy"
import { User } from "@grammyjs/types"
import dotenv from "dotenv"
dotenv.config()

const bot = new Bot(process.env.BOT_TOKEN as string)

type Member = {
    id: number
    username: string | undefined
}

const members: Member[] = []

const settings = {
    welcomeMessage: "(Имя), рады Вас приветствовать в нашей группе! 🤗\n\nПожалуйста, ознакомьтесь с правилами и оставьте информацию о вашем канале по образцу (см. пост в закрепе)!",
    allMessage: "Добрый день! 🤗\n\nИнформируем Вас об открытии нового набора в актив!\n\nУспейте принять участие!\n\nЖдем информацию о вашем канале!",
    stopMessage: "Добрый день 🤗\n\Все участники опубликовали рекламный пост. Благодарим за участие и своевременные публикации.\n\nЖелаем всем хороших результатов и будем благодарны, если поделитесь предварительными результатами! 🙏\n\nПожалуйста, не забывайте выдержать пост в ленте!🙏\n\nЖдем вас в следующие активы!\n\nНапоминаем, что обо всех активностях мы информируем здесь ⬇️\n\nhttps://t.me/tema_podborka\n\nС уважением!",
}

bot.command("start", async (ctx) => {
    await ctx.reply("Добро пожаловать. Запущен и работает!")
})

bot.on("chat_member", async (ctx) => {
    const change = ctx.chatMember
    if (change.new_chat_member.status === "member") {
        const member = change.new_chat_member.user
        if (!member.username) return
        members.push({ id: member.id, username: member.username || "undefined" })
        const welcome = settings.welcomeMessage.replace("(Имя)", `@${member.username}` || member.first_name)
        await ctx.reply(welcome)
    }
})

bot.on("message", async (ctx, next) => {
    console.log(ctx.message.from)

    const user: User = ctx.message.from

    if (!user.username) return

    if (!members.some((member) => member.id === user.id)) {
        members.push({ id: user.id, username: user.username || "undefined"})
    }
    console.log(members)

    await next(); // continue with the next middleware
})

bot.command("all", async (ctx) => {
    try {
        const mentions = members
            .filter((m) => m.username)
            .map((m) => `@${m.username}`)
            .join("\n")

        console.log(mentions)
        const message = mentions
            ? `${settings.allMessage}\n\n${mentions}`
            : "Нет участников с username для упоминания."

        await ctx.reply(message)
    } catch (error) {
        console.log("Ошибка в /all:", error)
        await ctx.reply("Произошла ошибка. Попробуйте позже.")
    }
})

bot.command("stop", async (ctx) => {
    try {
        const message = settings.stopMessage
        await ctx.reply(message)
    } catch (error) {
        console.log("Ошибка в /stop:", error)
        await ctx.reply("Произошла ошибка. Попробуйте позже.")
    }

})

// noinspection JSIgnoredPromiseFromCall
bot.start({
    allowed_updates: ["chat_member", "message"],
})