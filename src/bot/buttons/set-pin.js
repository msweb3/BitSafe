const User = require("../../../model/User");

module.exports = async (ctx) => {
  ctx.answerCbQuery();
  const user = await User.findOne({
    telegramId: ctx.update.callback_query.from.id,
  });

  if (!user.pin || user.pin.length != 6) {
    ctx.scene.enter("SET_PIN");
  } else {
    ctx.replyWithHTML("Something wen't wrong");
  }
};
