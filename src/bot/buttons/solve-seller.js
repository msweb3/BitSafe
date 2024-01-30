const Deal = require("../../../model/Deal");
const User = require("../../../model/User");

module.exports = async (ctx) => {
  const dealId = ctx.update.callback_query.data.replace("solve-toSeller-", "");

  const deal = await Deal.findOne({
    dealId: dealId,
    "dealStatus.status": "DISPUTED",
    "dealStatus.isAccepted": true,
    "dealStatus.isPaid": true,
  });

  if (!deal) {
    return ctx.replyWithHTML("Deal not found");
  }

  const receiver = await User.findOne({ telegramId: deal.sellerId });

  const receiverAsset = receiver.cryptos.find((receiverAsset) => {
    return (
      receiverAsset.symbol.toLowerCase() ===
      deal.dealPaymentMethod.symbol.toLowerCase()
    );
  });

  receiverAsset.balance = (
    parseFloat(receiverAsset.balance) + parseFloat(deal.dealAmountCoin)
  ).toFixed(8);
  deal.dealStatus.status = "COMPLETED";

  receiver.save();
  deal.save();

  ctx.telegram.sendMessage(
    deal.buyerId,
    `⚖️ <b>Dispute Resolved</b>\n\nThe dispute regarding the deal has been resolved. The admin has decided to release the funds to the seller.\n\n<b>Deal ID:</b> <code>${deal.dealId}</code>\n\nIf you have any questions or need assistance, use the /help command or contact our support team.\n\nHappy dealing! 🌐💼`,
    { parse_mode: "HTML" }
  );

  ctx.telegram.sendMessage(
    deal.sellerId,
    `⚖️ <b>Dispute Resolved</b>\n\nThe dispute regarding the deal has been resolved. The admin has decided to release the funds to you.\n\n<b>Deal ID:</b> <code>${deal.dealId}</code>\n\nIf you have any questions or need assistance, use the /help command or contact our support team.\n\nHappy dealing! 🌐💼`,
    { parse_mode: "HTML" }
  );

  ctx.answerCbQuery();
  return ctx.deleteMessage(ctx.update.callback_query.message.message_id);
};
