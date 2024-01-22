const axios = require("axios");
const { Telegraf, Scenes } = require("telegraf");
const { Stage } = Scenes;
const { session } = require("telegraf-session-mongodb");

const { start } = require("./commands/index");
const { profile } = require("./keyboards/index");
const {
  deposit,
  get_payment,
  deposit_history,
  set_pin,
} = require("./buttons/index");
const User = require("../../model/User");
const config = require("../../config");

const bot = new Telegraf(process.env.BOT_TOKEN);

const stage = new Stage(Object.values(require("./scenes/index")));

const bot_init = (db) => {
  bot.use(session(db)).use(stage.middleware());

  bot.start(async (ctx) => {
    start(ctx);
  });

  bot.hears("👤 Profile", async (ctx) => {
    await profile(ctx);
  });

  bot.action(/deposit-btn/, deposit);

  bot.action(/deposit-payment-btn$/, get_payment);

  bot.action(/deposit-history-btn$/, async (ctx) => {
    await deposit_history(bot, ctx);
  });

  bot.action(/set-pincode-btn$/, set_pin);

  // Enable graceful stop
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));

  return bot;
};

module.exports = { bot_init };
