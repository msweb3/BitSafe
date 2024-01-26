module.exports = async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
  await ctx.replyWithHTML(
    `🚫 <b>Payment Rejected</b>\n\nIt seems you've chosen not to proceed with the payment for the deal. If you have any concerns or need further assistance, use the /help command or contact our support team.\n\nFeel free to discuss the details with your counterpart or initiate a new deal.\n\nHappy dealing! 💼🤝`
  );
};
