const Deal = require("../../../model/Deal");
const User = require("../../../model/User");

module.exports = async (ctx) => {
  const dealId = ctx.update.callback_query.data.replace(
    "confirm-releasingFunds-",
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

  sellerAssets.balance = (
    parseFloat(sellerAssets.balance) + parseFloat(deal.dealAmountCoin)
  ).toFixed(8);

  deal.dealStatus.status = "COMPLETED";

  await seller.save();
  await deal.save();
  await ctx.answerCbQuery();
  await ctx.deleteMessage(ctx.update.callback_query.message.message_id);

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
};
