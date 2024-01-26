const axios = require("axios");

const { Composer, Scenes } = require("telegraf");
const uniqid = require("uniqid");

const User = require("../../../model/User");
const Deal = require("../../../model/Deal");
const config = require("../../../config");

const declareRole = new Composer();

declareRole.action(/declareRole-.*/, async (ctx) => {
  if (ctx.update.callback_query.data.includes("seller")) {
    ctx.session.__scenes.state.seller =
      ctx.update.callback_query.from.id.toString();
    ctx.session.__scenes.state.createdBy = "seller";
    ctx.deleteMessage(ctx.update.callback_query.message.message_id);

    await ctx.replyWithHTML(
      `🤝 <b>Seller Declared</b>\n\nGreat! You've chosen your role. Now, please provide the Telegram ID of your counterpart in the deal.\n\nReply with the Telegram ID of the other party to proceed.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🚫 Cancel Deal", callback_data: "cancel-deal" }],
          ],
        },
      }
    );

    return ctx.wizard.next();
  } else {
    ctx.session.__scenes.state.buyer =
      ctx.update.callback_query.from.id.toString();
    ctx.session.__scenes.state.createdBy = "buyer";
    ctx.deleteMessage(ctx.update.callback_query.message.message_id);

    await ctx.replyWithHTML(
      `🤝 <b>Buyer Declared</b>\n\nGreat! You've chosen your role. Now, please provide the Telegram ID of your counterpart in the deal.\n\nReply with the Telegram ID of the other party to proceed.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🚫 Cancel Deal", callback_data: "cancel-deal" }],
          ],
        },
      }
    );

    return ctx.wizard.next();
  }
});

const declareCounterpart = new Composer();

declareCounterpart.on("message", async (ctx) => {
  const user = await User.findOne({ telegramId: ctx.message.text });

  if (!user) {
    return ctx.replyWithHTML(
      `⚠️ <b>Invalid Telegram ID</b>\n\nOops! It seems the Telegram ID you provided is invalid or we couldn't find a user with that ID. Please double-check the ID and make sure it belongs to your counterpart in the deal.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🚫 Cancel Deal", callback_data: "cancel-deal" }],
          ],
        },
      }
    );
  }

  if (user.telegramId === ctx.message.from.id) {
    return ctx.replyWithHTML(
      `⚠️ <b>Invalid Counterpart</b>\n\nOops! It appears you've entered your own Telegram ID as the counterpart. Please provide the Telegram ID of the other party involved in the deal.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🚫 Cancel Deal", callback_data: "cancel-deal" }],
          ],
        },
      }
    );
  }

  if (ctx.session.__scenes.state.createdBy === "seller") {
    ctx.session.__scenes.state.buyer = user.telegramId;
  } else {
    ctx.session.__scenes.state.seller = user.telegramId;
  }

  await ctx.replyWithHTML(
    `🤝 <b>Deal Roles Confirmed</b>\n\nGreat! Both parties have declared their roles. Now, let's outline the terms of the deal.\n\nFor example, you can specify the terms, conditions of the deal as follows:\n\n<b><u>"Exchange $200 worth of Apple Gift Card for Bitcoin."</u></b>\n\nPlease provide the terms, conditions, or any specific details related to the deal.\n\nReply with the terms of the deal to continue.`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🚫 Cancel Deal", callback_data: "cancel-deal" }],
        ],
      },
    }
  );

  return ctx.wizard.next();
});

const declaresTerms = new Composer();

declaresTerms.on("message", async (ctx) => {
  ctx.session.__scenes.state.terms = ctx.message.text;

  const supportedCurrencies = await Promise.all(
    config.SUPPORTED_CURRENCIES.map((supportedCurrency) => {
      return {
        text: `${
          supportedCurrency.name
        } (${supportedCurrency.symbol.toUpperCase()})`,
        callback_data: `declarePaymentMethod-${supportedCurrency.symbol}`,
      };
    })
  );

  supportedCurrencies.push({
    text: "🚫 Cancel Deal",
    callback_data: "cancel-deal",
  });

  const paymentMethods = supportedCurrencies.map((currency) => [currency]);

  await ctx.replyWithHTML(
    `💰 <b>Choose Payment Method</b>\n\nExcellent! The terms of the deal have been declared. Now, let's decide on the payment method. Please choose the cryptocurrency you'd like to use by clicking the corresponding button:`,
    { reply_markup: { inline_keyboard: paymentMethods } }
  );

  return ctx.wizard.next();
});

const declarePaymentMethod = new Composer();

declarePaymentMethod.action(/declarePaymentMethod-.*/, async (ctx) => {
  ctx.session.__scenes.state.paymentMethod =
    ctx.update.callback_query.data.replace("declarePaymentMethod-", "");
  ctx.deleteMessage(ctx.update.callback_query.message.message_id);

  await ctx.replyWithHTML(
    `💸 <b>Enter Deal Amount</b>\n\nGreat choice! You've selected a payment method. Now, please enter the amount of the deal in USD.\n\nReply with the desired deal amount. Make sure it aligns with the terms previously declared.`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🚫 Cancel Deal", callback_data: "cancel-deal" }],
        ],
      },
    }
  );

  return ctx.wizard.next();
});

const declareAmount = new Composer();

function isValidUSDAmount(inputAmount) {
  var regex = /^\d+(?:\.\d{0,2})$/;
  var numStr = parseFloat(inputAmount).toFixed(2);
  if (regex.test(numStr)) {
    return true;
  }
}

declareAmount.on("message", async (ctx) => {
  if (!isValidUSDAmount(ctx.message.text)) {
    return ctx.replyWithHTML(
      `⚠️ <b>Invalid Amount</b>\n\nOops! It seems you've entered an invalid amount. Please make sure to enter a valid numeric value.`
    );
  }

  const exchangeRate = await axios({
    method: "get",
    url: config.GET_EXCHANGE_RATE(ctx.session.__scenes.state.paymentMethod),
  });

  ctx.session.__scenes.state.amountUsd = ctx.message.text;
  ctx.session.__scenes.state.amountCoin = (
    parseFloat(ctx.message.text) / exchangeRate.data.usd
  ).toFixed(8);

  const dealForm = {
    sellerId: ctx.session.__scenes.state.seller,
    buyerId: ctx.session.__scenes.state.buyer,
    terms: ctx.session.__scenes.state.terms,
    paymentMethod: {
      fullName: `${
        config.SUPPORTED_CURRENCIES.find((currency) => {
          return currency.symbol === ctx.session.__scenes.state.paymentMethod;
        }).name
      } (${ctx.session.__scenes.state.paymentMethod.toUpperCase()})`,
      name: config.SUPPORTED_CURRENCIES.find((currency) => {
        return currency.symbol === ctx.session.__scenes.state.paymentMethod;
      }).name,
      symbol: ctx.session.__scenes.state.paymentMethod.toUpperCase(),
    },
    amountUsd: parseFloat(ctx.session.__scenes.state.amountUsd).toFixed(2),
    amountCoin: parseFloat(ctx.session.__scenes.state.amountCoin).toFixed(8),
  };

  await ctx.replyWithHTML(
    `🔄 <b>Confirm Deal Creation</b>\n\nGreat! You've entered the deal amount. Please review the details before confirming:\n\n<b>Seller ID:</b> <code>${dealForm.sellerId}</code>\n<b>Buyer ID:</b> <code>${dealForm.buyerId}</code>\n<b>Payment Method:</b> <code>${dealForm.paymentMethod.fullName}</code>\n<b>Amount:</b> <code>${dealForm.amountCoin} ${dealForm.paymentMethod.symbol} ~ ${dealForm.amountUsd} USD</code>\n<b>Terms and Conditions:</b> <code>${dealForm.terms}</code>\n\nIf everything looks good, click the button below to confirm the creation of the deal:\n\nIf you need to make changes or have second thoughts, use the /help command or contact our support team.\n\nHappy dealing! 🌐💼`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "✅ Create Deal", callback_data: "create-deal" },
            { text: "🚫 Cancel Deal", callback_data: "cancel-deal" },
          ],
        ],
      },
    }
  );

  return ctx.wizard.next();
});

const createDeal = new Composer();

createDeal.action(/create-deal/, async (ctx) => {
  const dealForm = {
    sellerId: ctx.session.__scenes.state.seller,
    buyerId: ctx.session.__scenes.state.buyer,
    createdBy: ctx.session.__scenes.state.createdBy,
    terms: ctx.session.__scenes.state.terms,
    paymentMethod: {
      fullName: `${
        config.SUPPORTED_CURRENCIES.find((currency) => {
          return currency.symbol === ctx.session.__scenes.state.paymentMethod;
        }).name
      } (${ctx.session.__scenes.state.paymentMethod.toUpperCase()})`,
      name: config.SUPPORTED_CURRENCIES.find((currency) => {
        return currency.symbol === ctx.session.__scenes.state.paymentMethod;
      }).name,
      symbol: ctx.session.__scenes.state.paymentMethod.toUpperCase(),
    },
    amountUsd: parseFloat(ctx.session.__scenes.state.amountUsd).toFixed(2),
    amountCoin: parseFloat(ctx.session.__scenes.state.amountCoin).toFixed(8),
  };

  new Deal({
    dealId: uniqid(),
    sellerId: dealForm.sellerId,
    buyerId: dealForm.buyerId,
    createdBy: dealForm.createdBy,
    dealTerms: dealForm.terms,
    "dealPaymentMethod.fullName": dealForm.paymentMethod.fullName,
    "dealPaymentMethod.name": dealForm.paymentMethod.name,
    "dealPaymentMethod.symbol": dealForm.paymentMethod.symbol,
    dealAmountUsd: dealForm.amountUsd,
    dealAmountCoin: dealForm.amountCoin,
  })
    .save()
    .then((deal) => {
      try {
        ctx.replyWithHTML(
          `✅ <b>Deal Created Successfully</b>\n\nCongratulations! Your deal has been successfully created with a ID: <code>${deal.dealId}</code>\n\nOnce your counterpart accept the deal, you will receive a notification about it. If you have any questions or need further assistance, use the /help command or contact our support team.\n\nHappy dealing! 🌐💼`
        );
        ctx.telegram.sendMessage(
          dealForm.createdBy === "seller"
            ? dealForm.buyerId
            : dealForm.sellerId,
          `🔄 Confirm Deal Acceptance\n\nGreat news! Your counterpart has initiated a deal. Please review the details before accepting:\n\n<b>Deal ID:</b> <code>${
            deal.dealId
          }</code>\n<b>Seller ID:</b> <code>${
            dealForm.sellerId
          }</code>\n<b>Buyer ID:</b> <code>${
            dealForm.buyerId
          }</code>\n<b>Payment Method:</b> <code>${
            dealForm.paymentMethod.fullName
          }</code>\n<b>Amount:</b> <code>${
            dealForm.amountCoin
          } ${dealForm.paymentMethod.symbol.toUpperCase()} ~ ${
            dealForm.amountUsd
          } USD</code>\n<b>Terms and Conditions:</b> <code>${
            dealForm.terms
          }</code>\n\nIf everything looks good and you agree with the terms, click the button below to confirm the acceptance of the deal:\n\nIf you have any questions or need further clarification, use the /help command or contact our support team.\n\nHappy dealing! 🌐💼`,
          {
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "✅ Accept Deal",
                    callback_data: `accept-deal-${deal.dealId}`,
                  },
                  {
                    text: "🚫 Reject Deal",
                    callback_data: `reject-deal-${deal.dealId}`,
                  },
                ],
              ],
            },
          }
        );
        ctx.answerCbQuery();
        ctx.deleteMessage(ctx.update.callback_query.message.message_id);
        return ctx.scene.leave();
      } catch (error) {
        console.log(error.message);
        return;
      }
    });
});

const initiateDeal = new Scenes.WizardScene(
  "INIT_DEAL",
  declareRole,
  declareCounterpart,
  declaresTerms,
  declarePaymentMethod,
  declareAmount,
  createDeal
);

initiateDeal.enter(async (ctx) => {
  ctx.replyWithHTML(
    `🤝 <b>Initiate a Deal</b>\n\nTo get started with a new deal, please click the button below to indicate your role:`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "👤 Seller", callback_data: "declareRole-seller" }],
          [{ text: "👥 Buyer", callback_data: "declareRole-buyer" }],
          [{ text: "🚫 Cancel Deal", callback_data: "cancel-deal" }],
        ],
      },
    }
  );
});

initiateDeal.action("cancel-deal", async (ctx) => {
  ctx.deleteMessage(ctx.update.callback_query.message.message_id);
  await ctx.replyWithHTML(
    `🚫 <b>Deal Initiation Cancelled</b>\n\nThe initiation of the deal has been cancelled. If you have any questions or need assistance with future transactions, use the /help command or contact our support team.\n\nYour satisfaction and security are our top priorities! 🌐💼`
  );

  return ctx.scene.leave();
});

initiateDeal.command("cancel_deal", async (ctx) => {
  await ctx.replyWithHTML(
    `🚫 <b>Deal Initiation Cancelled</b>\n\nThe initiation of the deal has been cancelled. If you have any questions or need assistance with future transactions, use the /help command or contact our support team.\n\nYour satisfaction and security are our top priorities! 🌐💼`
  );

  return ctx.scene.leave();
});

module.exports = initiateDeal;
