const User = require("../../../model/User");

module.exports = async (ctx) => {
  const user = await User.findOne({
    telegramId: ctx.update.callback_query.from.id,
  });

  if (!user.pin || user.pin.length != 6) {
    ctx.answerCbQuery();
    return ctx.scene.enter("SET_PIN");
  }

  ctx.replyWithHTML("Something wen't wrong");
};
