module.exports = async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
  await ctx.replyWithHTML(
    `🚫 <b>Releasing Funds Rejected</b>\n\nIt seems you've chosen not to proceed with the release the funds for the deal. If you have any concerns or need further assistance, use the /help command or contact our support team.\n\nFeel free to discuss the details with your counterpart or initiate a new deal.\n\nHappy dealing! 💼🤝`
  );
};
