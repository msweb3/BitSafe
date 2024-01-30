const { Markup } = require("telegraf");
const Deal = require("../../../model/Deal");

module.exports = async (ctx) => {
  const dealId = ctx.update.callback_query.data.replace("refund-payment-", "");

  const deal = await Deal.findOne({ dealId: dealId });

  if (!deal) {
    ctx.answerCbQuery();
    return ctx.deleteMessage(ctx.update.callback_query.message.message_id);
  }

  ctx.editMessageReplyMarkup(
    Markup.inlineKeyboard([
      [
        {
          text: "✅ Yes, refund the funds.",
          callback_data: `confirm-refundingFunds-${deal.dealId}`,
        },
      ],
      [
        {
          text: "🚫 No, don't refund funds",
          callback_data: `reject-refundingFunds-${deal.dealId}`,
        },
      ],
    ]).reply_markup
  );
};
