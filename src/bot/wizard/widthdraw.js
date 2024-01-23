const axios = require("axios");

const { Telegraf, Composer, Scenes } = require("telegraf");

const User = require("../../../model/User");
const config = require("../../../config");

const paymentMethod = new Composer();
paymentMethod.action(async (cb, ctx) => {
  if (cb.includes("withdrawalCoin-")) {
    const user = await User.findOne({
      telegramId: ctx.update.callback_query.from.id,
    });

    const selectedCoin = ctx.update.callback_query.data.replace(
      "withdrawalCoin-",
      ""
    );

    const exchangeRates = await axios({
      method: "get",
      url: config.GET_EXCHANGE_RATE(selectedCoin.toLowerCase()),
    });

    const selectedAsset = user.cryptos.find((asset) => {
      return asset.symbol === selectedCoin;
    });

    const withdrawalFunds = selectedAsset.balance * exchangeRates.data.usd;

    ctx.replyWithHTML(
      `💸 <b>Withdrawal Amount</b>\n\nGreat choice! You've selected a withdrawal payment method. Now, please enter the amount you wish to withdraw in USD.\n\n💼 <b>Available Funds for Withdrawal: $${withdrawalFunds.toFixed(
        2
      )} USD</b>\n\nReply with the desired withdrawal amount. Make sure it doesn't exceed your available funds.`
    );
    ctx.answerCbQuery();
    ctx.session.selectedAsset = selectedCoin;
    console.log(ctx.session);
  }
});

const widthdrawalScene = new Scenes.WizardScene("WITHDRAW", paymentMethod);

widthdrawalScene.enter(async (ctx) => {
  const user = await User.findOne({
    telegramId: ctx.update.callback_query.from.id,
  });

  const fundedCoins = await Promise.all(
    user.cryptos.map((paymentMethod) => {
      return paymentMethod.balance > 0
        ? {
            text: `${paymentMethod.name} (${paymentMethod.symbol})`,
            callback_data: `withdrawalCoin-${paymentMethod.symbol}`,
          }
        : null;
    })
  );

  const coins = fundedCoins
    .filter((item) => item !== null) // Remove null elements
    .map((item) => [item]); // Wrap each non-null object in a parent array

  ctx.replyWithHTML(
    `🏦 <b>Withdraw Funds</b>\n\nTo proceed with the withdrawal, please choose the cryptocurrency you want to withdraw by clicking the corresponding button:`,
    { reply_markup: { inline_keyboard: coins } }
  );
});

widthdrawalScene.command("exit", async (ctx) => {
  ctx.scene.leave();
});

module.exports = widthdrawalScene;
