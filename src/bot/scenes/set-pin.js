const axios = require("axios");

const { Scenes } = require("telegraf");
const { BaseScene } = Scenes;
const { UltimateTextToImage } = require("ultimate-text-to-image");
const path = require("path");

const User = require("../../../model/User");

const setPin = new BaseScene("SET_PIN");

setPin.enter(async (ctx) => {
  ctx.replyWithHTML(
    `🔐 <b>Set a New PIN</b>\n\nTo enhance the security of your account, you can set a personal identification number (PIN). This PIN will be required for certain sensitive actions, such as withdrawals.\n\nPlease enter a new 6-digit PIN for your account. Ensure it is something easy for you to remember but not easily guessable by others.\n\nReply with the 6-digit PIN you'd like to set.\n\nIf you have any questions or need assistance, use the /help command or contact our support team.\n\nYour security is our priority! 🔒💼`,
    {
      reply_markup: {
        inline_keyboard: [[{ text: "🚫 Cancel", callback_data: "cancel-pin" }]],
      },
    }
  );
});

setPin.on("message", async (ctx) => {
  function validatePIN(pin) {
    // Define a regular expression for a 6-digit PIN
    const pinRegex = /^\d{6}$/;

    // Test the input PIN against the regular expression
    return pinRegex.test(pin);
  }

  if (validatePIN(ctx.update.message.text)) {
    const user = await User.findOne({ telegramId: ctx.update.message.from.id });

    if (!user) {
      return;
    }

    ctx.deleteMessage(ctx.update.message.message_id);

    // render the image
    const textToImage = new UltimateTextToImage(ctx.update.message.text, {
      width: 400,
      maxWidth: 1000,
      maxHeight: 1000,
      fontFamily: "Arial",
      fontColor: "#" + Math.floor(Math.random() * 16777215).toString(16),
      fontSize: 72,
      minFontSize: 10,
      lineHeight: 50,
      autoWrapLineHeightMultiplier: 1.2,
      margin: 20,
      marginBottom: 40,
      align: "center",
      valign: "middle",
      borderColor: Math.floor(Math.random() * 16777215).toString(16),
      borderSize: 2,
      backgroundColor: Math.floor(Math.random() * 16777215).toString(16),
      underlineColor: "#" + Math.floor(Math.random() * 16777215).toString(16),
      underlineSize: 2,
    });
    textToImage
      .render()
      .toFile(path.join(process.cwd(), "public", "images", "pin.png"));

    await ctx.replyWithPhoto(
      { source: path.join(process.cwd(), "public", "images", "pin.png") },
      {
        caption: `✅ <b>PIN Successfully Verified</b>\n\nGreat job! The PIN you entered is correct. Your account is secure.\n\nYou can now proceed with sensitive actions, such as withdrawals. If you have any other requests or need assistance, feel free to use the /help command or contact our support team.\n\nYour security is our priority! 🔒💼`,
        parse_mode: "HTML",
        has_spoiler: true,
      }
    );

    user.pin = ctx.update.message.text;
    user.save();
    return ctx.scene.leave();
  } else {
    ctx.replyWithHTML(
      `⚠️ <b>Incorrect PIN</b>\n\nOops! The PIN you entered is incorrect. Please make sure to enter the correct 6-digit PIN associated with your account.\n\nIf you continue to experience issues or have forgotten your PIN, use the /help command or contact our support team for assistance.\n\nYour security is important to us! 🔒💼`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🚫 Cancel", callback_data: "cancel-pin" }],
          ],
        },
      }
    );
  }
});

setPin.action("cancel-pin", async (ctx) => {
  ctx.answerCbQuery();
  ctx.deleteMessage(ctx.update.callback_query.message.message_id);
  ctx.replyWithHTML(
    `🚫 <b>Cancelled</b>\n\nThe process of setting a new PIN has been cancelled.`
  );
  ctx.scene.leave();
});

// setPin.use(async (ctx) => {
//   return;
// });

module.exports = setPin;
