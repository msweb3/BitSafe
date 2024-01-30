const axios = require("axios");

const { Telegraf, Composer, Scenes } = require("telegraf");
const { UltimateTextToImage } = require("ultimate-text-to-image");
const path = require("path");

const User = require("../../../model/User");

const onSolve = new Composer();

const onSolveDispute = new Scenes.WizardScene("SOLVE_DISPUTE", onSolve);

onSolveDispute.enter(async (ctx) => {
  ctx.replyWithHTML(
    `⚖️ <b>Resolve Disputed Deal</b>\n\nAdmin, you are about to resolve a disputed deal. Please choose whom you want to release the funds to:`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "📤 Release to Seller", callback_data: "release-seller" }],
          [{ text: "📥 Refund to Buyer", callback_data: "refund-buyer" }],
          [{ text: "🚫 Cancel", callback_data: "cancel-dispute" }],
        ],
      },
    }
  );
});

module.exports = onSolveDispute;
