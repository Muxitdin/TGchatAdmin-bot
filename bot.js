"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const grammy_1 = require("grammy");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const bot = new grammy_1.Bot(process.env.BOT_TOKEN);
const members = [];
const settings = {
    welcomeMessage: "(Имя), рады Вас приветствовать в нашей группе! 🤗\n\nПожалуйста, ознакомьтесь с правилами и оставьте информацию о вашем канале по образцу (см. пост в закрепе)!",
    allMessage: "Добрый день! 🤗\n\nИнформируем Вас об открытии нового набора в актив!\n\nУспейте принять участие!\n\nЖдем информацию о вашем канале!",
    stopMessage: "Добрый день 🤗\n\Все участники опубликовали рекламный пост. Благодарим за участие и своевременные публикации.\n\nЖелаем всем хороших результатов и будем благодарны, если поделитесь предварительными результатами! 🙏\n\nПожалуйста, не забывайте выдержать пост в ленте!🙏\n\nЖдем вас в следующие активы!\n\nНапоминаем, что обо всех активностях мы информируем здесь ⬇️\n\nhttps://t.me/tema_podborka\n\nС уважением!",
};
bot.command("start", (ctx) => {
    ctx.reply("Добро пожаловать. Запущен и работает!");
});
bot.on("chat_member", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const change = ctx.chatMember;
    if (change.new_chat_member.status === "member") {
        const member = change.new_chat_member.user;
        if (!member.username)
            return;
        members.push({ id: member.id, username: member.username || "undefined" });
        const welcome = settings.welcomeMessage.replace("(Имя)", `@${member.username}` || member.first_name);
        yield ctx.reply(welcome);
    }
}));
bot.on("message", (ctx, next) => {
    console.log(ctx.message.from);
    const user = ctx.message.from;
    if (!user.username)
        return;
    if (!members.some((member) => member.id === user.id)) {
        members.push({ id: user.id, username: user.username || "undefined" });
    }
    console.log(members);
    next(); // continue with the next middleware
});
bot.command("all", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const mentions = members
            .filter((m) => m.username)
            .map((m) => `@${m.username}`)
            .join("\n");
        console.log(mentions);
        const message = mentions
            ? `${settings.allMessage}\n\n${mentions}`
            : "Нет участников с username для упоминания.";
        yield ctx.reply(message);
    }
    catch (error) {
        console.log("Ошибка в /all:", error);
        ctx.reply("Произошла ошибка. Попробуйте позже.");
    }
}));
bot.command("stop", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const message = settings.stopMessage;
        yield ctx.reply(message);
    }
    catch (error) {
        console.log("Ошибка в /stop:", error);
        yield ctx.reply("Произошла ошибка. Попробуйте позже.");
    }
}));
bot.start({
    allowed_updates: ["chat_member", "message"],
});
