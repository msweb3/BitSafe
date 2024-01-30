const Deal = require("../../../model/Deal");

module.exports = async (ctx) => {
  const userId = ctx.update.message.from.id.toString();

  if (userId != process.env.ADMIN_ID) {
    return ctx.replyWithHTML(`<b>You are not authorized.</b>`);
  }

  const dealId = ctx.update.message.text.replace("/solve ", "");

  const deal = await Deal.findOne({ dealId: dealId });

  if (!deal) {
    return ctx.replyWithHTML(`<b>Deal is not found.</b>`);
  }

  ctx.replyWithHTML(
    `⚖️ <b>Resolve Disputed Deal</b>\n\nAdmin, you are about to resolve a disputed deal. Please choose whom you want to release the funds to:`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "📤 Release to Seller",
              callback_data: `solve-toSeller-${deal.dealId}`,
            },
          ],
          [
            {
              text: "📥 Refund to Buyer",
              callback_data: `solve-toBuyer-${deal.dealId}`,
            },
          ],
          [{ text: "🚫 Cancel", callback_data: "cancel-dispute" }],
        ],
      },
    }
  );
};
