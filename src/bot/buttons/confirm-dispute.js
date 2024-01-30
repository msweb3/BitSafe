const Deal = require("../../../model/Deal");
const User = require("../../../model/User");

module.exports = async (ctx) => {
  const dealId = ctx.update.callback_query.data.replace(
    "confirm-disputeDeal-",
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

  deal.dealStatus.status = "DISPUTED";
  deal.save();

  let dealParticipants = [deal.sellerId, deal.buyerId];

  dealParticipants.forEach((participantId) => {
    ctx.telegram.sendMessage(
      participantId,
      `💳 <b>Deal Disputed</b>\n\nThe deal has been disputed, and we're here to help. To resolve the dispute and receive assistance, please contact our support team.\n\n<b>Seller ID:</b> <code>${deal.sellerId}</code>\n<b>Buyer ID:</b> <code>${deal.buyerId}</code>\n<b>Payment Method:</b> <code>${deal.dealPaymentMethod.fullName}</code>\n<b>Amount:</b> <code>${deal.dealAmountCoin} ${deal.dealPaymentMethod.symbol} ~ ${deal.dealAmountUsd} USD</code>\n<b>Terms and Conditions:</b> <code>${deal.dealTerms}</code>\n\n<b>Deal Balance</b>: <code>${deal.dealAmountCoin} ${deal.dealPaymentMethod.symbol} ~ ${deal.dealAmountUsd} USD</code>\n\n<b>Contact support:</b> /help\n\nYour cooperation is appreciated as we work to resolve this matter.\n\nHappy dealing! 🌐💼`,
      { parse_mode: "HTML" }
    );
  });

  ctx.answerCbQuery();
  return ctx.deleteMessage(ctx.update.callback_query.message.message_id);
};
