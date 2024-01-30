const { Markup } = require("telegraf");
const { Pagination } = require("telegraf-pagination");

const User = require("../../../model/User");
const Transaction = require("../../../model/Transaction");
const config = require("../../../config");

module.exports = async (bot, ctx) => {
  const transactions = await Transaction.find({
    owner_chatId: ctx.update.callback_query.from.id,
    type: "in",
  });

  if (transactions.length === 0) {
    ctx.answerCbQuery();
    return ctx.replyWithHTML("You don't have any transaction yet.");
  }

  const pagination = new Pagination({
    data: transactions, // array of items
    header: () =>
      `🌐 <b>List of Deposit Transactions</b>\n\nHere is a list of your recent deposit transactions:\n`, // optional. Default value: 👇
    // `Items ${(currentPage - 1) * pageSize + 1 }-${currentPage * pageSize <= total ? currentPage * pageSize : total} of ${total}`;
    format: (item, index) =>
      `${index + 1}. <b>${
        config.SUPPORTED_CURRENCIES.find((supportedAsset) => {
          return item.currency === supportedAsset.symbol;
        }).name
      } (${item.currency.toUpperCase()})</b>\n- <b>Amount:</b> <code>${
        item.value * 1e-8
      }</code> ${item.currency.toUpperCase()}\n- <b>Transaction ID:</b> <code>${item.input_transaction_hash.slice(
        0,
        10
      )}...${item.input_transaction_hash.slice(-10)}</code>`, // optional. Default value: 👇
    // `${index + 1}. ${item}`;
    pageSize: 8, // optional. Default value: 10
    rowSize: 4, // optional. Default value: 5 (maximum 8)
    isButtonsMode: false, // optional. Default value: false. Allows you to display names on buttons (there is support for associative arrays)
    buttonModeOptions: {
      isSimpleArray: true, // optional. Default value: true. Enables/disables support for associative arrays
      titleKey: "", // optional. Default value: null. If the associative mode is enabled (isSimply: false), determines by which key the title for the button will be taken.
    },
    isEnabledDeleteButton: true, // optional. Default value: true
    onSelect: (item, index) => {
      ctx.replyWithHTML(`🌐 <b>Transaction Details</b>\n\n<b>Crypto Asset:</b> ${
        config.SUPPORTED_CURRENCIES.find((asset) => {
          return item.currency === asset.symbol;
        }).name
      } (${item.currency.toUpperCase()})\n<b>Amount:</b> <code>${
        item.value * 1e-8
      }</code> ${item.currency.toUpperCase()}\n<b>Transaction ID:</b> <code>${
        item.input_transaction_hash
      }</code>\n<b>Status:</b> Confirmed\n<b>Timestamp:</b> ${item.createdAt.toUTCString()}\n\nThis transaction has been successfully processed and confirmed on the blockchain. If you have any questions or need further assistance, use the /help command or contact our support team.\n\nHappy trading! 💼💰
      `);
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
  ctx.answerCbQuery();
};
