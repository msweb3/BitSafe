const User = require("../../../model/User");

module.exports = async (ctx) => {
  const user = await User.findOne({
    telegramId: ctx.update.callback_query.from.id,
  });

  let totalBalance = 0;

  user.cryptos.map((crypto) => {
    totalBalance += parseFloat(crypto.balance);
  });

  if (totalBalance > 0) {
    ctx.answerCbQuery();
    return ctx.scene.enter("WITHDRAW");
  } else {
    ctx.replyWithHTML(
      `⚠️ <b>Insufficient Funds</b>\n\nOops! It seems you don't have sufficient funds in your BitSafe account to proceed with the withdrawal.\n\nBefore making a withdrawal, please ensure that your account has a balance available for the desired amount.\n\nIf you have any questions or need assistance, feel free to use the /help command or contact our support team.\n\nHappy trading! 💼💰`
    );
  }
};
