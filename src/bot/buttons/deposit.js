const User = require("../../../model/User");

module.exports = async (ctx) => {
  await ctx.deleteMessage(ctx.update.callback_query.message.message_id);

  const user = await User.findOne({
    telegramId: ctx.update.callback_query.from.id,
  });

  // Sort the array based on the symbol
  const sortedPaymentMethods = user.cryptos.sort((a, b) =>
    a.symbol.localeCompare(b.symbol)
  );

  // Create the desired structure
  const paymentInlineButtons = sortedPaymentMethods.map((obj) => [
    {
      text: `${obj.name} (${obj.symbol})`,
      callback_data: `${obj.symbol}-deposit-payment-btn`,
    },
  ]);

  ctx.reply(
    `🌐 <b>Choose Payment Method for Deposit</b>\n\nTo deposit funds into your BitSafe account, select a payment method from the options below. Once you've chosen your preferred method, you will receive the necessary payment details to complete the deposit.\n\nIf you need assistance or have questions, use the /help command or contact our support team.\n\nHappy depositing! 💼💰`,
    {
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: paymentInlineButtons },
    }
  );
};
