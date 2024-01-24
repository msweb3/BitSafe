const User = require("../../../model/User");

module.exports = async (ctx) => {
  const user = await User.findOne({
    telegramId: ctx.update.callback_query.from.id,
  });

  ctx.deleteMessage(ctx.update.callback_query.message.message_id);

  if (user.pin || user.pin.length === 6) {
    ctx.answerCbQuery();
    return ctx.scene.enter("UPDATE_PIN");
  }

  ctx.replyWithHTML("Something wen't wrong");
};
