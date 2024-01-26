const Deal = require("../../../model/Deal");

module.exports = async (ctx) => {
  const dealId = ctx.update.callback_query.data.replace("reject-deal-", "");

  const deal = await Deal.findOne({
    dealId: dealId,
    "dealStatus.status": "CREATED",
    "dealStatus.isAccepted": false,
    "dealStatus.isPaid": false,
  });

  if (!deal) {
    ctx.answerCbQuery();
    return ctx.deleteMessage(ctx.update.callback_query.message.message_id);
  }

  ctx.telegram.sendMessage(
    deal.createdBy === "seller" ? deal.sellerId : deal.buyerId,
    `⛔️ <b>Deal Rejected</b>\n\nUnfortunately, your counterpart has rejected the deal instead of accepting it. If you have any questions or need further clarification, use the /help command or contact our support team.\n\nFeel free to initiate a new deal or explore other opportunities.\n\nHappy dealing! 💼🤝`,
    { parse_mode: "HTML" }
  );

  await Deal.findByIdAndDelete(deal._id);
  ctx.answerCbQuery();
  ctx.deleteMessage(ctx.update.callback_query.message.message_id);
};
