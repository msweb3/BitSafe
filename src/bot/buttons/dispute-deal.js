const { Markup } = require("telegraf");

const Deal = require("../../../model/Deal");

module.exports = async (ctx) => {
  const dealId = ctx.update.callback_query.data.replace("dispute-deal-", "");

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

  ctx.editMessageReplyMarkup(
    Markup.inlineKeyboard([
      [
        {
          text: "✅ Yes, dispute the deal",
          callback_data: `confirm-disputeDeal-${deal.dealId}`,
        },
      ],
      [
        {
          text: "🚫 No, don't dispute the deal",
          callback_data: `reject-disputeDeal-${deal.dealId}`,
        },
      ],
    ]).reply_markup
  );
};
