import { Bot } from "grammy"
import { User } from "@grammyjs/types"
import dotenv from "dotenv"
dotenv.config()

const bot = new Bot(process.env.BOT_TOKEN as string)

type Member = {
    id: number
    username: string | undefined
}
type ChatId = number | string | undefined;
type UserId = number | undefined;

const members: Member[] = []

const settings = {
    welcomeMessage: "(Имя), рады Вас приветствовать в нашей группе! 🤗\n\nПожалуйста, ознакомьтесь с правилами и оставьте информацию о вашем канале по образцу (см. пост в закрепе)!",
    allMessage: "Добрый день! 🤗\n\nИнформируем Вас об открытии нового набора в актив!\n\nУспейте принять участие!\n\nЖдем информацию о вашем канале!",
    stopMessage: "Добрый день 🤗\n\nВсе участники опубликовали рекламный пост. Благодарим за участие и своевременные публикации.\n\nЖелаем всем хороших результатов и будем благодарны, если поделитесь предварительными результатами! 🙏\n\nПожалуйста, не забывайте выдержать пост в ленте!🙏\n\nЖдем вас в следующие активы!\n\nНапоминаем, что обо всех активностях мы информируем здесь ⬇️\n\nhttps://t.me/tema_podborka\n\nС уважением!",
}

bot.command("start", async (ctx) => {
    await ctx.reply("Добро пожаловать. Запущен и работает!")
})

bot.on("chat_member", async (ctx) => {
    const change = ctx.chatMember
    if (change.new_chat_member.status === "member") {
        const member = change.new_chat_member.user
        if (!member.username) return
        if (!members.some(m => m.username === member.username)) {
            members.push({ id: member.id, username: member.username || "undefined" })
        }
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

bot.command("ban", async (ctx) => {
    try {
        const chatId: ChatId = ctx.message?.chat.id
        const userIdExecuting: UserId = ctx.message?.from.id

        if (chatId && userIdExecuting) {
            const chatMember = await ctx.api.getChatMember(chatId, userIdExecuting);
            if (!["administrator", "creator"].includes(chatMember.status)) {
                await ctx.reply("Не достаточно прав.");
                return;
            }
        }

        const externalReplyOrigin = ctx.message?.external_reply?.origin;
        if (externalReplyOrigin && "sender_user" in externalReplyOrigin) {
            const userIdTarget: UserId = externalReplyOrigin.sender_user.id
            if (chatId && userIdTarget) {
                await ctx.api.banChatMember(chatId, userIdTarget);
                await ctx.reply(`Пользователь @${externalReplyOrigin.sender_user.username} забанен.`)
                return;
            } else {
                await ctx.reply("Сбой обработки запроса")
                return
            }
        }

        if (ctx.match && ctx.match.startsWith('@')) {
            const username = ctx.match.slice(1)
            const targetArray = members.filter((member) => member.username === username)
            console.log(targetArray)
            const userTarget = targetArray[0]
            console.log(userTarget.id);
            if (chatId && userTarget) {
                await ctx.banChatMember(userTarget.id).then(() => {
                    ctx.reply(`Пользователь @${userTarget.username} забанен.`);
                    console.log(members)
                });
            } else {
                await ctx.reply("Сбой обработки запроса. Убедитесь, что указали правильный username.");
            }
            return
        }

        await ctx.reply("Укажите пользователя для блокировки, ответив на сообщение командой или указав username.");
    } catch (error) {
        console.log(error);
        await ctx.reply("Произошла ошибка. Попробуйте позже.")
    }
})

bot.command("unban", async (ctx) => {
    try {
        const chatId: ChatId = ctx.message?.chat.id;
        const userIdExecuting: UserId = ctx.message?.from.id;

        if (chatId && userIdExecuting) {
            const chatMember = await ctx.api.getChatMember(chatId, userIdExecuting);
            if (!["administrator", "creator"].includes(chatMember.status)) {
                await ctx.reply("Не достаточно прав.");
                return;
            }
        }

        const externalReplyOrigin = ctx.message?.external_reply?.origin;
        if (externalReplyOrigin && "sender_user" in externalReplyOrigin) {
            const userIdTarget: UserId = externalReplyOrigin.sender_user.id
            if (chatId && userIdTarget) {
                await ctx.api.unbanChatMember(chatId, userIdTarget);
                await ctx.reply(`Пользователь @${externalReplyOrigin.sender_user.username} разблокирован.`);
                try {
                    await ctx.api.sendMessage(chatId, `@${externalReplyOrigin.sender_user.username}, вы были добавлены обратно в чат. Добро пожаловать!`);
                } catch (error) {
                    console.error("Ошибка при отправке сообщения участника:", error);
                }
            } else {
                await ctx.reply("Сбой обработки запроса.");
            }
            return
        }

        if (ctx.match && ctx.match.startsWith('@')) {
            const username = ctx.match.slice(1);
            console.log(members);
            const targetArray = members.filter((member) => member.username === username);
            const userTarget = targetArray[0];
            console.log(chatId, userTarget)
            if (chatId && userTarget) {
                await ctx.api.unbanChatMember(chatId, userTarget.id);
                await ctx.reply(`Пользователь @${userTarget.username} разблокирован.`);
                try {
                    await ctx.api.sendMessage(userTarget.id, `@${userTarget.username}, вы были добавлены обратно в чат @${ctx.chat.username}. Добро пожаловать!`);
                } catch (error) {
                    console.error("Ошибка при отправке сообщения участника:", error);
                }
            } else {
                await ctx.reply("Сбой обработки запроса. Убедитесь, что указали правильный username.");
            }
            return;
        }

        await ctx.reply("Укажите пользователя для разблокировки, ответив на сообщение командой или указав username.");
    } catch (error) {
        console.log(error);
        await ctx.reply("Произошла ошибка. Попробуйте позже.");
    }
});

bot.command("mute", async (ctx) => {
    try {
        const chatId: ChatId = ctx.message?.chat.id
        const userIdExecuting: UserId = ctx.message?.from.id

        if (chatId && userIdExecuting) {
            const chatMember = await ctx.api.getChatMember(chatId, userIdExecuting);
            if (!["administrator", "creator"].includes(chatMember.status)) {
                await ctx.reply("Не достаточно прав.");
                return;
            }
        }

        const mutePermissions: any = {
            can_send_messages: false,
            can_send_media_messages: false,
            can_send_polls: false,
            can_send_other_messages: false,
        };

        const externalReplyOrigin = ctx.message?.external_reply?.origin;

        if (externalReplyOrigin && "sender_user" in externalReplyOrigin) {
            const userIdTarget = externalReplyOrigin.sender_user.id as UserId
            if (chatId && userIdTarget) {
                await ctx.api.restrictChatMember(chatId, userIdTarget, {...mutePermissions});
                await ctx.reply(`Пользователь @${externalReplyOrigin.sender_user.username} в муте.`)
                return;
            } else {
                await ctx.reply("Сбой обработки запроса")
                return
            }
        }

        if (ctx.match && ctx.match.startsWith('@')) {
            const username = ctx.match.slice(1)
            const targetArray = members.filter((member) => member.username === username)
            console.log("111: " + targetArray)
            const userTarget = targetArray[0]
            console.log("222: "+userTarget.id);
            if (chatId && userTarget) {
                await ctx.api.restrictChatMember(chatId, userTarget.id, {...mutePermissions}).then(() => {
                    ctx.reply(`Пользователь @${userTarget.username} в муте.`);
                    console.log(members)
                });
            } else {
                await ctx.reply("Сбой обработки запроса. Убедитесь, что указали правильный username.");
            }
            return
        }

        await ctx.reply("Укажите пользователя для мута, ответив на сообщение командой или указав username.");
    } catch (error) {
        console.log(error);
        await ctx.reply("Произошла ошибка. Попробуйте позже.")
    }
})

// noinspection JSIgnoredPromiseFromCall
bot.start({
    allowed_updates: ["chat_member", "message"],
})