const { Markup } = require("telegraf");

const Deal = require("../../../model/Deal");

module.exports = async (ctx) => {
  const dealId = ctx.update.callback_query.data.replace("make-payment-", "");

  const deal = await Deal.findOne({
    dealId: dealId,
    "dealStatus.isPaid": false,
    "dealStatus.isAccepted": true,
    "dealStatus.status": "ACCEPTED",
  });

  if (!deal) {
    ctx.answerCbQuery();
    return ctx.deleteMessage(ctx.update.callback_query.message.message_id);
  }

  ctx.editMessageReplyMarkup(
    Markup.inlineKeyboard([
      [
        {
          text: "✅ Yes, Make a Payment",
          callback_data: `confirm-makingPayment-${deal.dealId}`,
        },
      ],
      [
        {
          text: "🚫 No, Not Right Now",
          callback_data: `reject-makingPayment-${deal.dealId}`,
        },
      ],
    ]).reply_markup
  );
};
