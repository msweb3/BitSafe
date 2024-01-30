const Deal = require("../../../model/Deal");
const User = require("../../../model/User");

module.exports = async (ctx) => {
  const dealId = ctx.update.callback_query.data.replace(
    "confirm-refundingFunds-",
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

  const buyer = await User.findOne({ telegramId: deal.buyerId });

  const buyerAssets = buyer.cryptos.find((buyerAsset) => {
    return (
      buyerAsset.symbol.toLowerCase() ===
      deal.dealPaymentMethod.symbol.toLowerCase()
    );
  });

  buyerAssets.balance = (
    parseFloat(buyerAssets.balance) + parseFloat(deal.dealAmountCoin)
  ).toFixed(8);

  deal.dealStatus.status = "COMPLETED";

  await buyer.save();
  await deal.save();
  await ctx.answerCbQuery();
  await ctx.deleteMessage(ctx.update.callback_query.message.message_id);

  await ctx.telegram.sendMessage(
    deal.sellerId,
    `💸 <b>Funds Refunded</b>\n\nCongratulations! You've successfully refunded the funds to the buyer. The deal is now marked as completed.\n\nIf you have any questions or need assistance, use the /help command or contact our support team.\n\nHappy dealing! 🌐💼`,
    { parse_mode: "HTML" }
  );

  await ctx.telegram.sendMessage(
    deal.buyerId,
    `💸 <b>Funds Received</b>\n\nGreat news! The seller has refunded the funds to your balance. The deal is now marked as completed.\n\nIf you have any questions or need assistance, use the /help command or contact our support team.\n\nHappy dealing! 🌐💼`,
    { parse_mode: "HTML" }
  );
};
