const axios = require("axios");
const { Telegraf, Scenes, Markup } = require("telegraf");
const { session } = require("telegraf-session-mongodb");

const { start, solve_dispute } = require("./commands/index");
const { profile, initiate_deal, active_deals } = require("./keyboards/index");
const {
  deposit,
  get_payment,
  deposit_history,
  set_pin,
  update_pin,
  withdraw,
  withdrawal_history,
  accept_deal,
  reject_deal,
  make_payment,
  confirm_payment,
  reject_payment,
  refund_payment,
  release_payment,
  confirm_release,
  reject_release,
  confirm_refund,
  reject_refund,
  dispute_deal,
  confirm_dispute,
  reject_dispute,
  solve_seller,
  solve_buyer,
} = require("./buttons/index");

const {
  initiateDealWizard,
  withdrawWizard,
  setPinWizard,
  updatePinWizard,
} = require("./wizard/index");

const User = require("../../model/User");
const config = require("../../config");
const Deal = require("../../model/Deal");

const bot = new Telegraf(process.env.BOT_TOKEN);

const bot_init = (db) => {
  const stageWizards = new Scenes.Stage([
    initiateDealWizard,
    setPinWizard,
    updatePinWizard,
    withdrawWizard,
  ]);

  bot.use(session(db));
  bot.use(stageWizards.middleware());

  bot.start(async (ctx) => {
    start(ctx);
  });

  bot.hears(/🔐 Initiate Deal/, initiate_deal);

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

  bot.hears(/🤝 Active Deals/, async (ctx) => {
    await active_deals(bot, ctx);
  });

  bot.action(/accept-deal-.*/, accept_deal);

  bot.action(/reject-deal-.*/, reject_deal);

  bot.action(/make-payment-.*/, make_payment);

  bot.action(/confirm-makingPayment-.*/, confirm_payment);

  bot.action(/reject-makingPayment-.*/, reject_payment);

  bot.action(/refund-payment-.*/, refund_payment);

  bot.action(/confirm-refundingFunds-.*/, confirm_refund);

  bot.action(/reject-refundingFunds-.*/, reject_refund);

  bot.action(/release-payment-.*/, release_payment);

  bot.action(/confirm-releasingFunds-.*/, confirm_release);

  bot.action(/reject-releasingFunds-.*/, reject_release);

  bot.action(/dispute-deal-.*/, dispute_deal);

  bot.action(/confirm-disputeDeal-.*/, confirm_dispute);

  bot.action(/reject-disputeDeal-.*/, reject_dispute);

  bot.command("solve", async (ctx) => {
    solve_dispute(ctx);
  });

  bot.action(/solve-toSeller-.*/, solve_seller);

  bot.action(/solve-toBuyer-.*/, solve_buyer);

  // Enable graceful stop
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));

  return bot;
};

module.exports = { bot_init };
