const axios = require("axios");
const User = require("../../../model/User");
const config = require("../../../config");

module.exports = async (ctx) => {
  const user = await User.findOne({
    telegramId: ctx.update.callback_query.from.id,
  });

  const selectedPayment = ctx.update.callback_query.data.replace(
    "-deposit-payment-btn",
    ""
  );

  const selectedAsset = user.cryptos.find((userAsset) => {
    return userAsset.symbol === selectedPayment;
  });

  const exchangeRates = await axios({
    method: "get",
    url: config.GET_EXCHANGE_RATE(selectedAsset.symbol.toLowerCase()),
  });

  const balanceInUSD = selectedAsset.balance * exchangeRates.data.usd;

  ctx.reply(
    `🌐 <b>${selectedAsset.name} Payment Method</b>\n\nHere are the details you need for the deposit:\n\n<b>${selectedAsset.name} Wallet Address:</b>\n<code>${selectedAsset.address}</code>\n\n<b>Current ${selectedAsset.name} Balance:</b>\n<code>${selectedAsset.balance} ${selectedAsset.symbol} ~ ${balanceInUSD} USD</code>\n\nPlease transfer the desired amount to the provided ${selectedAsset.name} wallet address. Your deposit will be processed once the transaction is confirmed on the ${selectedAsset.name} network.\n\nIf you encounter any issues or have questions, feel free to use the /help command or reach out to our support team.\n\nHappy depositing! 💼💰`,
    { parse_mode: "HTML" }
  );

  ctx.answerCbQuery();
};
