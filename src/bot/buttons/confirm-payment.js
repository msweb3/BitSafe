const Deal = require("../../../model/Deal");
const User = require("../../../model/User");

module.exports = async (ctx) => {
  const dealId = ctx.update.callback_query.data.replace(
    "confirm-makingPayment-",
    ""
  );

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

  const buyer = await User.findOne({
    telegramId: ctx.update.callback_query.from.id,
  });

  const dealAsset = buyer.cryptos.find((buyerAsset) => {
    return (
      buyerAsset.symbol.toLowerCase() ===
      deal.dealPaymentMethod.symbol.toLocaleLowerCase()
    );
  });

  if (
    parseFloat(dealAsset.balance).toFixed(8) <
    parseFloat(deal.dealAmountCoin).toFixed(8)
  ) {
    return ctx.replyWithHTML(
      `⚠️ <b>Insufficient Funds</b>\n\nOops! It seems there are not enough funds in your account to complete the payment for the deal.\n\nPlease ensure you have sufficient funds and try again. If you have any questions or need assistance, use the /help command or contact our support team.\n\nHappy dealing! 💼🤝`
    );
  }

  dealAsset.balance = (
    parseFloat(dealAsset.balance) - parseFloat(deal.dealAmountCoin)
  ).toFixed(8);
  deal.dealStatus.isPaid = true;
  deal.dealStatus.status = "PAID";
  buyer.save();
  deal.save();

  let dealParticipants = [deal.sellerId, deal.buyerId];

  dealParticipants.forEach((participantId) => {
    ctx.telegram.sendMessage(
      participantId,
      `💳 <b>Payment Successful</b>\n\nCongratulations! The buyer has successfully made the payment for the deal. Here are the details:\n\n<b>Seller ID:</b> <code>${deal.sellerId}</code>\n<b>Buyer ID:</b> <code>${deal.buyerId}</code>\n<b>Payment Method:</b> <code>${deal.dealPaymentMethod.fullName}</code>\n<b>Amount:</b> <code>${deal.dealAmountCoin} ${deal.dealPaymentMethod.symbol} ~ ${deal.dealAmountUsd} USD</code>\n<b>Terms and Conditions:</b> <code>${deal.dealTerms}</code>\n\n<b>Deal Balance</b>: <code>${deal.dealAmountCoin} ${deal.dealPaymentMethod.symbol} ~ ${deal.dealAmountUsd} USD</code> — <b>✅ PAID</b>\n\n<b>Next Steps:</b>\n- <b>Seller:</b> Please provide the agreed-upon goods or services to the buyer.\n\nIf you have any questions or need assistance, use the /help command or contact our support team.\n\nHappy dealing! 🌐💼`,
      participantId === deal.sellerId
        ? {
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🔙 Refund Funds",
                    callback_data: `refund-payment-${deal.dealId}`,
                  },
                ],
                [
                  {
                    text: "🎫 Dispute the Deal",
                    callback_data: `dispute-deal-${deal.dealId}`,
                  },
                ],
              ],
            },
          }
        : {
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "📤 Release Funds",
                    callback_data: `release-payment-${deal.dealId}`,
                  },
                ],
                [
                  {
                    text: "🎫 Dispute the Deal",
                    callback_data: `dispute-deal-${deal.dealId}`,
                  },
                ],
              ],
            },
          }
    );
  });

  ctx.answerCbQuery();
  return ctx.deleteMessage(ctx.update.callback_query.message.message_id);
};
