const axios = require("axios");
const { Telegraf, Scenes, Markup } = require("telegraf");
const { session } = require("telegraf-session-mongodb");

const { start } = require("./commands/index");
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

  bot.action(/refund-payment-.*/, async (ctx) => {
    console.log(ctx);
  });

  bot.action(/release-payment.*/, async (ctx) => {
    const dealId = ctx.update.callback_query.data.replace(
      "release-payment-",
      ""
    );

    const deal = await Deal.findOne({
      dealId: dealId,
      "dealStatus.isPaid": true,
      "dealStatus.isAccepted": true,
      "dealStatus.status": "PAID",
    });

    if (!deal) {
      ctx.answerCbQuery();
      return ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    }

    const seller = await User.findOne({ telegramId: deal.sellerId });

    const sellerAssets = seller.cryptos.find((sellerAsset) => {
      return (
        sellerAsset.symbol.toLowerCase() ===
        deal.dealPaymentMethod.symbol.toLowerCase()
      );
    });

    sellerAssets.balance =
      parseFloat(sellerAssets.balance).toFixed(8) + parseFloat();

    deal.dealStatus.status = "COMPLETED";

    await ctx.telegram.sendMessage(
      deal.buyerId,
      `💸 <b>Funds Released</b>\n\nCongratulations! You've successfully released the funds to the seller. The deal is now marked as completed.\n\nIf you have any questions or need assistance, use the /help command or contact our support team.\n\nHappy dealing! 🌐💼`,
      { parse_mode: "HTML" }
    );

    await ctx.telegram.sendMessage(
      deal.sellerId,
      `💸 <b>Funds Received</b>\n\nGreat news! The buyer has released the funds to your balance. The deal is now marked as completed.\n\nIf you have any questions or need assistance, use the /help command or contact our support team.\n\nHappy dealing! 🌐💼`,
      { parse_mode: "HTML" }
    );

    await seller.save();
    await deal.save();
    await ctx.answerCbQuery();
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
  });

  // Enable graceful stop
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));

  return bot;
};

module.exports = { bot_init };
