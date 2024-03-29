const { Markup } = require("telegraf");

const Deal = require("../../../model/Deal");

module.exports = async (ctx) => {
  const dealId = ctx.update.callback_query.data.replace("release-payment-", "");

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
          text: "✅ Yes, release the funds",
          callback_data: `confirm-releasingFunds-${deal.dealId}`,
        },
      ],
      [
        {
          text: "🚫 No, don't release funds",
          callback_data: `reject-releasingFunds-${deal.dealId}`,
        },
      ],
    ]).reply_markup
  );
};
