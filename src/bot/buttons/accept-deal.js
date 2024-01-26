const Deal = require("../../../model/Deal");

module.exports = async (ctx) => {
  const dealId = ctx.update.callback_query.data.replace("accept-deal-", "");

  const deal = await Deal.findOne({
    dealId: dealId,
    "dealStatus.isPaid": false,
    "dealStatus.isAccepted": false,
    "dealStatus.status": "CREATED",
  });

  if (!deal) {
    ctx.answerCbQuery();
    return ctx.deleteMessage(ctx.update.callback_query.message.message_id);
  }

  deal.dealStatus.isAccepted = true;
  deal.dealStatus.status = "ACCEPTED";
  deal.save();

  ctx.telegram.sendMessage(
    deal.sellerId,
    `✅ <b>Deal Accepted</b>\n\nGreat news! The deal has been accepted by both parties. Here are the details:\n\n<b>Seller ID:</b> <code>${deal.sellerId}</code>\n<b>Buyer ID:</b> <code>${deal.buyerId}</code>\n<b>Payment Method:</b> <code>${deal.dealPaymentMethod.fullName}</code>\n<b>Amount:</b> <code>${deal.dealAmountCoin} ${deal.dealPaymentMethod.symbol} ~ ${deal.dealAmountUsd} USD</code>\n<b>Terms and Conditions:</b> <code>${deal.dealTerms}</code>\n\n<b>Next Steps:</b>\n<b>- Seller:</b> <u>Await payment from the buyer.</u>\n<b>- Buyer:</b> <u>Proceed to make the payment.</u>\n\nIf you have any questions or need assistance, use the /help command or contact our support team.\n\nHappy dealing! 🌐💼`,
    { parse_mode: "HTML" }
  );

  ctx.telegram.sendMessage(
    deal.buyerId,
    `✅ <b>Deal Accepted</b>\n\nGreat news! The deal has been accepted by both parties. Here are the details:\n\n<b>Seller ID:</b> <code>${deal.sellerId}</code>\n<b>Buyer ID:</b> <code>${deal.buyerId}</code>\n<b>Payment Method:</b> <code>${deal.dealPaymentMethod.fullName}</code>\n<b>Amount:</b> <code>${deal.dealAmountCoin} ${deal.dealPaymentMethod.symbol} ~ ${deal.dealAmountUsd} USD</code>\n<b>Terms and Conditions:</b> <code>${deal.dealTerms}</code>\n\n<b>Next Steps:</b>\n<b>- Seller:</b> <u>Await payment from the buyer.</u>\n<b>- Buyer:</b> <u>Proceed to make the payment.</u>\n\nIf you have any questions or need assistance, use the /help command or contact our support team.\n\nHappy dealing! 🌐💼`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "💰 Make a Payment",
              callback_data: `make-payment-${deal.dealId}`,
            },
          ],
        ],
      },
    }
  );

  await ctx.answerCbQuery();
  await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
};
