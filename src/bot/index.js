const axios = require("axios");
const { Telegraf, Scenes } = require("telegraf");
const { session } = require("telegraf-session-mongodb");

const { start } = require("./commands/index");
const { profile } = require("./keyboards/index");
const {
  deposit,
  get_payment,
  deposit_history,
  set_pin,
  update_pin,
  withdraw,
  withdrawal_history,
} = require("./buttons/index");

const {
  withdrawWizard,
  setPinWizard,
  updatePinWizard,
} = require("./wizard/index");

const User = require("../../model/User");
const config = require("../../config");

const bot = new Telegraf(process.env.BOT_TOKEN);

const bot_init = (db) => {
  const stageWizards = new Scenes.Stage([
    withdrawWizard,
    setPinWizard,
    updatePinWizard,
  ]);

  bot.use(session(db));
  bot.use(stageWizards.middleware());

  bot.start(async (ctx) => {
    start(ctx);
  });

  bot.hears(/👤 Profile/, profile);

  bot.action(/deposit-btn/, deposit);

  bot.action(/deposit-payment-btn$/, get_payment);

  bot.action(/deposit-history-btn$/, async (ctx) => {
    await deposit_history(bot, ctx);
  });

  bot.action(/set-pincode-btn$/, set_pin);

  bot.action(/update-pincode-btn/, update_pin);

  bot.action(/withdraw-btn/, withdraw);

  bot.action(/withdrawal-history-btn/, async (ctx) => {
    await withdrawal_history(bot, ctx);
  });

  // Enable graceful stop
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));

  return bot;
};

module.exports = { bot_init };
