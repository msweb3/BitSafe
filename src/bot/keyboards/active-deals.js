const { Markup } = require("telegraf");
const { Pagination } = require("telegraf-pagination");

const User = require("../../../model/User");
const Deal = require("../../../model/Deal");
const config = require("../../../config");

module.exports = async (bot, ctx) => {
  const deals = await Deal.find({
    $or: [{ sellerId: ctx.message.from.id }, { buyerId: ctx.message.from.id }],
    "dealStatus.status": { $ne: "COMPLETED" },
  });

  if (deals.length === 0) {
    return ctx.replyWithHTML(
      `🌐 <b>Active Deals</b>\n\nIt seems there are no active deals at the moment. If you are looking to create a new deal, click the <b>🔐 Initiate Deal</b> button.`
    );
  }

  const pagination = new Pagination({
    data: deals, // array of items
    header: () =>
      `🌐 <b>List of Active Deals</b>\n\nHere is a list of your active deals with its statuses:\n\n- <b>CREATED:</b> The deal has been newly created but not yet accepted.\n- <b>ACCEPTED:</b> Accepted by both parties but not paid.\n- <b>PAID:</b> Paid by the buyer, but the deal is not yet completed.\n- <b>DISPUTED:</b> The deal is currently under dispute.\n`, // optional. Default value: 👇
    // `Items ${(currentPage - 1) * pageSize + 1 }-${currentPage * pageSize <= total ? currentPage * pageSize : total} of ${total}`;
    format: (item, index) =>
      `${index + 1}. <code>${item.dealId}</code> - <b>${
        item.dealStatus.status
      }</b>\n`, // optional. Default value: 👇
    // `${index + 1}. ${item}`;
    pageSize: 10, // optional. Default value: 10
    rowSize: 4, // optional. Default value: 5 (maximum 8)
    isButtonsMode: false, // optional. Default value: false. Allows you to display names on buttons (there is support for associative arrays)
    buttonModeOptions: {
      isSimpleArray: true, // optional. Default value: true. Enables/disables support for associative arrays
      titleKey: "", // optional. Default value: null. If the associative mode is enabled (isSimply: false), determines by which key the title for the button will be taken.
    },
    isEnabledDeleteButton: true, // optional. Default value: true
    onSelect: (item, index) => {
      if (item.dealStatus.status === "CREATED") {
        ctx.replyWithHTML(
          `🔄 ${
            ctx.message.from.id.toString() ===
            (item.createdBy === "buyer" ? item.sellerId : item.buyerId)
              ? "Confirm Deal Acceptance\n\nPlease review the details before accepting:"
              : "Waiting for acceptance\n\nHere is a deal details for reviewing:"
          }\n\n<b>Deal ID:</b> <code>${
            item.dealId
          }</code>\n<b>Seller ID:</b> <code>${
            item.sellerId
          }</code>\n<b>Buyer ID:</b> <code>${
            item.buyerId
          }</code>\n<b>Payment Method:</b> <code>${
            item.dealPaymentMethod.fullName
          }</code>\n<b>Amount:</b> <code>${
            item.dealAmountCoin
          } ${item.dealPaymentMethod.symbol.toUpperCase()} ~ ${
            item.dealAmountUsd
          } USD</code>\n<b>Terms and Conditions:</b> <code>${
            item.dealTerms
          }</code>\n<b>Created At:</b> <code>${item.createdAt.toUTCString()}</code>\n\nIf everything looks good and you agree with the terms, click the button below to confirm the acceptance of the deal:\n\nIf you have any questions or need further clarification, use the /help command or contact our support team.\n\nHappy dealing! 🌐💼`,
          ctx.message.from.id.toString() ===
            (item.createdBy === "buyer" ? item.sellerId : item.buyerId)
            ? {
                parse_mode: "HTML",
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: "✅ Accept Deal",
                        callback_data: `accept-deal-${item.dealId}`,
                      },
                      {
                        text: "🚫 Reject Deal",
                        callback_data: `reject-deal-${item.dealId}`,
                      },
                    ],
                  ],
                },
              }
            : { parse_mode: "HTML" }
        );
      }

      if (item.dealStatus.status === "ACCEPTED") {
        ctx.replyWithHTML(
          `✅ <b>Deal Accepted</b>\n\nGreat news! The deal has been accepted by both parties. Here are the details:\n\n<b>Deal ID:</b> <code>${item.dealId}</code>\n<b>Seller ID:</b> <code>${item.sellerId}</code>\n<b>Buyer ID:</b> <code>${item.buyerId}</code>\n<b>Payment Method:</b> <code>${item.dealPaymentMethod.fullName}</code>\n<b>Amount:</b> <code>${item.dealAmountCoin} ${item.dealPaymentMethod.symbol} ~ ${item.dealAmountUsd} USD</code>\n<b>Terms and Conditions:</b> <code>${item.dealTerms}</code>\n\n<b>Next Steps:</b>\n<b>- Seller:</b> <u>Await payment from the buyer.</u>\n<b>- Buyer:</b> <u>Proceed to make the payment.</u>\n\nIf you have any questions or need assistance, use the /help command or contact our support team.\n\nHappy dealing! 🌐💼`,
          ctx.message.from.id.toString() ===
            (item.createdBy === "buyer" ? item.buyerId : item.sellerId)
            ? {
                parse_mode: "HTML",
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: "💰 Make a Payment",
                        callback_data: `make-payment-${item.dealId}`,
                      },
                    ],
                  ],
                },
              }
            : { parse_mode: "HTML" }
        );
      }

      if (item.dealStatus.status === "PAID") {
        ctx.replyWithHTML(
          `💳 <b>Payment Successful</b>\n\nCongratulations! The buyer has successfully made the payment for the deal. Here are the details:\n\n<b>Deal ID:</b> <code>${item.dealId}</code>\n<b>Seller ID:</b> <code>${item.sellerId}</code>\n<b>Buyer ID:</b> <code>${item.buyerId}</code>\n<b>Payment Method:</b> <code>${item.dealPaymentMethod.fullName}</code>\n<b>Amount:</b> <code>${item.dealAmountCoin} ${item.dealPaymentMethod.symbol} ~ ${item.dealAmountUsd} USD</code>\n<b>Terms and Conditions:</b> <code>${item.dealTerms}</code>\n\n<b>Deal Balance</b>: <code>${item.dealAmountCoin} ${item.dealPaymentMethod.symbol} ~ ${item.dealAmountUsd} USD</code> — <b>✅ PAID</b>\n\n<b>Next Steps:</b>\n- <b>Seller:</b> Please provide the agreed-upon goods or services to the buyer.\n\nIf you have any questions or need assistance, use the /help command or contact our support team.\n\nHappy dealing! 🌐💼`,
          ctx.message.from.id.toString() ===
            (item.createdBy === "seller" ? item.buyerId : item.sellerId)
            ? {
                parse_mode: "HTML",
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: "🔙 Refund Funds",
                        callback_data: `refund-payment-${item.dealId}`,
                      },
                    ],
                    [
                      {
                        text: "🎫 Dispute the Deal",
                        callback_data: `dispute-deal-${item.dealId}`,
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
                        callback_data: `release-payment-${item.dealId}`,
                      },
                    ],
                    [
                      {
                        text: "🎫 Dispute the Deal",
                        callback_data: `dispute-deal-${item.dealId}`,
                      },
                    ],
                  ],
                },
              }
        );
      }
    }, // optional. Default value: empty function
    messages: {
      // optional
      firstPage: "First page", // optional. Default value: "❗️ That's the first page"
      lastPage: "Last page", // optional. Default value: "❗️ That's the last page"
      prev: "◀️", // optional. Default value: "⬅️"
      next: "▶️", // optional. Default value: "➡️"
    },
  });

  pagination.handleActions(bot); // pass bot or scene instance as a parameter

  let text = await pagination.text(); // get pagination text
  let keyboard = await pagination.keyboard(); // get pagination keyboard
  ctx.replyWithHTML(text, keyboard);
};
