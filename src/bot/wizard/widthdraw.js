const axios = require("axios");

const { Telegraf, Composer, Scenes } = require("telegraf");

const User = require("../../../model/User");
const Transaction = require("../../../model/Transaction");
const config = require("../../../config");

const paymentMethod = new Composer();
paymentMethod.action(/withdrawalCoin-.*/, async (ctx) => {
  const user = await User.findOne({
    telegramId: ctx.update.callback_query.from.id,
  });

  const selectedCoin = ctx.update.callback_query.data.replace(
    "withdrawalCoin-",
    ""
  );

  const exchangeRates = await axios({
    method: "get",
    url: config.GET_EXCHANGE_RATE(selectedCoin.toLowerCase()),
  });

  const selectedAsset = user.cryptos.find((asset) => {
    return asset.symbol === selectedCoin;
  });

  const withdrawalFunds = selectedAsset.balance * exchangeRates.data.usd;

  await ctx.replyWithHTML(
    `💸 <b>Withdrawal Amount</b>\n\nGreat choice! You've selected a withdrawal payment method. Now, please enter the amount you wish to withdraw in USD.\n\n💼 <b>Available ${
      selectedAsset.name
    } (${selectedAsset.symbol}) for Withdrawal: $${withdrawalFunds.toFixed(
      2
    )} USD</b>\n\nReply with the desired withdrawal amount. Make sure it doesn't exceed your available funds.`
  );
  ctx.answerCbQuery();
  ctx.deleteMessage(ctx.update.callback_query.message.message_id);
  ctx.session.__scenes.state.selectedAsset = selectedCoin;
  return ctx.wizard.next();
});

function isValidUSDAmount(inputAmount) {
  var regex = /^\d+(?:\.\d{0,2})$/;
  var numStr = parseFloat(inputAmount).toFixed(2);
  if (regex.test(numStr)) {
    return true;
  }
}

const withdrawalAmount = new Composer();
withdrawalAmount.on("message", async (ctx) => {
  if (!isValidUSDAmount(ctx.message.text)) {
    return ctx.replyWithHTML(
      `⚠️ <b>Invalid Withdrawal Amount</b>\n\nOops! It seems you've entered an invalid withdrawal amount. Please make sure to enter a valid numeric value for the withdrawal.`
    );
  }

  const user = await User.findOne({
    telegramId: ctx.update.message.from.id,
  });

  const userAsset = user.cryptos.find((userAsset) => {
    return userAsset.symbol === ctx.session.__scenes.state.selectedAsset;
  });

  const exchangeRates = await axios({
    method: "get",
    url: config.GET_EXCHANGE_RATE(userAsset.symbol.toLowerCase()),
  });

  const assetAmount = parseFloat(ctx.message.text) / exchangeRates.data.usd;

  if (userAsset.balance < assetAmount.toFixed(8)) {
    return ctx.replyWithHTML(
      `⚠️ <b>Insufficient Funds</b>\n\nOops! The withdrawal amount you entered exceeds your available funds.\n\n💼 <b>Available ${
        userAsset.name
      } (${userAsset.symbol}) for Withdrawal: $${(
        userAsset.balance * exchangeRates.data.usd
      ).toFixed(
        2
      )} USD</b>\n\nPlease review your available funds and re-enter a withdrawal amount that doesn't exceed your balance.`
    );
  }

  await ctx.replyWithHTML(
    `🌐 <b>Withdrawal Destination Address</b>\n\nExcellent! You've entered the withdrawal amount. Now, please provide the destination address where you want the funds to be sent.\n\nReply with the correct destination address for the withdrawal.`
  );
  ctx.session.__scenes.state.withdrawalAmount = assetAmount.toFixed(8);
  return ctx.wizard.next();
});

const destinationAddress = new Composer();
destinationAddress.on("message", async (ctx) => {
  ctx.session.__scenes.state.withdrawalAddress = ctx.message.text;
  await ctx.replyWithHTML(
    `🔒 <b>Verification Required</b>\n\nTo ensure the security of your withdrawal, please enter your 6-digit verification PIN.\n\nReply with your PIN to proceed with the withdrawal.`
  );

  return ctx.wizard.next();
});

const verificationPin = new Composer();

verificationPin.on("message", async (ctx) => {
  try {
    function validatePIN(pin) {
      // Define a regular expression for a 6-digit PIN
      const pinRegex = /^\d{6}$/;

      // Test the input PIN against the regular expression
      return pinRegex.test(pin);
    }

    if (!validatePIN(ctx.message.text)) {
      return ctx.replyWithHTML(
        `⚠️ <b>Invalid PIN</b>\n\nOops! The verification PIN you entered is not valid. Please make sure to enter the valid 6-digit PIN associated with your account.`
      );
    }

    const user = await User.findOne({ telegramId: ctx.message.from.id });

    if (ctx.message.text != user.pin) {
      return ctx.replyWithHTML(
        `⚠️ <b>Incorrect PIN</b>\n\nOops! The verification PIN you entered is incorrect. Please make sure to enter the correct 6-digit PIN associated with your account.`
      );
    }

    const estimatedTransaction = await axios({
      method: "get",
      url: config.GET_ESTIMATED_TRANSACTION(process.env.APIRONE_ID),
      params: {
        currency: ctx.session.__scenes.state.selectedAsset.toLowerCase(),
        destinations: `${ctx.session.__scenes.state.withdrawalAddress}:${
          parseFloat(ctx.session.__scenes.state.withdrawalAmount).toFixed(8) /
          1e-8
        }`,
        fee: "normal",
        "subtract-fee-from-amount": true,
      },
    });

    const exchangeRates = await axios({
      method: "get",
      url: config.GET_EXCHANGE_RATE(
        ctx.session.__scenes.state.selectedAsset.toLowerCase()
      ),
    });

    const withdrawalForm = {
      paymentMethod: ctx.session.__scenes.state.selectedAsset,
      destinationAddress: ctx.session.__scenes.state.withdrawalAddress,
      networkFee: {
        units: estimatedTransaction.data.fee.network.amount,
        amount: estimatedTransaction.data.fee.network.amount * 1e-8,
        usd: (
          exchangeRates.data.usd *
          (estimatedTransaction.data.fee.network.amount * 1e-8)
        ).toFixed(2),
      },
      serviceFee: {
        units: estimatedTransaction.data.fee.processing.amount,
        amount: estimatedTransaction.data.fee.processing.amount * 1e-8,
        usd: (
          exchangeRates.data.usd *
          (estimatedTransaction.data.fee.processing.amount * 1e-8)
        ).toFixed(2),
      },
      receivingAmount: {
        units:
          estimatedTransaction.data.total -
          (estimatedTransaction.data.fee.network.amount +
            estimatedTransaction.data.fee.processing.amount),
        amount: parseFloat(
          (
            estimatedTransaction.data.total * 1e-8 -
            (estimatedTransaction.data.fee.network.amount +
              estimatedTransaction.data.fee.processing.amount) *
              1e-8
          ).toFixed(8)
        ),
        usd: (
          exchangeRates.data.usd *
          (estimatedTransaction.data.total * 1e-8 -
            (estimatedTransaction.data.fee.network.amount +
              estimatedTransaction.data.fee.processing.amount) *
              1e-8)
        ).toFixed(2),
      },
      totalAmount: {
        units: estimatedTransaction.data.total,
        amount: estimatedTransaction.data.total * 1e-8,
        usd: (
          exchangeRates.data.usd *
          (estimatedTransaction.data.total * 1e-8)
        ).toFixed(2),
      },
    };

    await ctx.replyWithHTML(
      `🔄 <b>Confirm Withdrawal</b>\n\nGreat! You're almost there. Please review the details before confirming:\n\n<b>Withdrawal Coin:</b> <code>${withdrawalForm.paymentMethod}</code>\n<b>Withdrawal Total Amount:</b> <code>${withdrawalForm.totalAmount.amount} ~ $${withdrawalForm.totalAmount.usd} USD</code>\n<b>Receiving Amount:</b> <code>${withdrawalForm.receivingAmount.amount} ~ $${withdrawalForm.receivingAmount.usd} USD</code>\n<b>Network Fee:</b> <code>${withdrawalForm.networkFee.amount} ~ $${withdrawalForm.networkFee.usd} USD</code>\n<b>Service Fee:</b> <code>${withdrawalForm.serviceFee.amount} ~ $${withdrawalForm.serviceFee.usd} USD</code>\n<b>Destination Address:</b> <code>${withdrawalForm.destinationAddress}</code>\n\nIf everything looks good, click the button below to confirm the withdrawal:`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "✅ Confirm", callback_data: "confirm-transaction" },
              { text: "🚫 Cancel", callback_data: "cancel-transaction" },
            ],
          ],
        },
      }
    );

    return ctx.wizard.next();
  } catch (error) {
    console.log(error.response.data);
    if (
      error.response.data.message ===
      `Destination address ${ctx.message.text} is not valid.`
    ) {
      return ctx.replyWithHTML(
        `⚠️ <b>Invalid Destination Address</b>\n\nOops! It seems the destination address you entered is invalid. Please make sure to provide a correct and valid destination address for the withdrawal.`
      );
    }
  }
});

const withdrawalConfirmation = new Composer();

withdrawalConfirmation.action(/confirm-transaction/, async (ctx) => {
  try {
    const requestData = {
      currency: ctx.session.__scenes.state.selectedAsset.toLowerCase(),
      "transfer-key": process.env.APIRONE_KEY,
      destinations: [
        {
          address: ctx.session.__scenes.state.withdrawalAddress,
          amount: ctx.session.__scenes.state.withdrawalAmount / 1e-8,
        },
      ],
      fee: "normal",
      "subtract-fee-from-amount": true,
    };

    const headers = {
      "Content-Type": "application/json",
    };

    const response = await axios.post(
      config.TRANSFER_FUNDS(process.env.APIRONE_ID),
      requestData,
      { headers }
    );

    if (response.data.id) {
      const user = await User.findOne({
        telegramId: ctx.update.callback_query.from.id,
      });

      const userAsset = user.cryptos.find((userAsset) => {
        return userAsset.symbol === response.data.currency.toUpperCase();
      });

      userAsset.balance = parseFloat(
        (userAsset.balance - response.data.total * 1e-8).toFixed(8)
      );
      user.save();

      new Transaction({
        owner_id: user._id,
        owner_chatId: user.telegramId,
        currency: ctx.session.__scenes.state.selectedAsset.toLowerCase(),
        value: parseFloat(ctx.session.__scenes.state.withdrawalAmount) / 1e-8,
        input_address: ctx.session.__scenes.state.withdrawalAddress,
        input_transaction_hash: response.data.id,
        type: "out",
      }).save();

      await ctx.replyWithHTML(
        `✅ <b>Withdrawal Successful</b>\n\nCongratulations! Your withdrawal has been successfully processed.\n\n<b>Transaction ID:</b> <code>${response.data.id}</code>\n\nYou will receive a confirmation shortly. If you have any questions or need further assistance, use the /help command or contact our support team.\n\nHappy withdrawing! 💰`
      );

      ctx.answerCbQuery();
      ctx.deleteMessage(ctx.update.callback_query.message.message_id);
      return ctx.scene.leave();
    }
  } catch (error) {
    console.log(error.message);
    ctx.answerCbQuery();
    ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    ctx.replyWithHTML(
      `⚠️ <b>Withdrawal Failed</b>\n\nOh no! It seems there was an issue processing your withdrawal. Please try again.\n\nIf the problem persists or if you have any questions, use the /help command or contact our support team for assistance.\n\nWe apologize for any inconvenience and appreciate your understanding.\n\nHappy trading! 💼💰`
    );
    return ctx.scene.leave();
  }
});

withdrawalConfirmation.action(/cancel-transaction/, async (ctx) => {
  ctx.answerCbQuery();
  ctx.deleteMessage(ctx.update.callback_query.message.message_id);
  ctx.replyWithHTML(
    `🚫 <b>Withdrawal Cancelled</b>\n\nThe withdrawal process has been cancelled. Your funds remain secure in your BitSafe account.\n\nIf you have any questions or need assistance with future transactions, use the /help command or contact our support team.\n\nYour security and satisfaction are our top priorities! 💼💰`
  );
  return ctx.scene.leave();
});

const widthdrawalScene = new Scenes.WizardScene(
  "WITHDRAW",
  paymentMethod,
  withdrawalAmount,
  destinationAddress,
  verificationPin,
  withdrawalConfirmation
);

widthdrawalScene.enter(async (ctx) => {
  const user = await User.findOne({
    telegramId: ctx.update.callback_query.from.id,
  });

  const fundedCoins = await Promise.all(
    user.cryptos.map((paymentMethod) => {
      return paymentMethod.balance > 0
        ? {
            text: `${paymentMethod.name} (${paymentMethod.symbol})`,
            callback_data: `withdrawalCoin-${paymentMethod.symbol}`,
          }
        : null;
    })
  );

  const coins = fundedCoins
    .filter((item) => item !== null) // Remove null elements
    .map((item) => [item]); // Wrap each non-null object in a parent array

  ctx.replyWithHTML(
    `🏦 <b>Withdraw Funds</b>\n\nTo proceed with the withdrawal, please choose the cryptocurrency you want to withdraw by clicking the corresponding button:`,
    { reply_markup: { inline_keyboard: coins } }
  );
});

widthdrawalScene.command("cancel_withdrawal", async (ctx) => {
  ctx.replyWithHTML(
    `🚫 <b>Withdrawal Cancelled</b>\n\nThe withdrawal process has been cancelled. Your funds remain secure in your BitSafe account.\n\nIf you have any questions or need assistance with future transactions, use the /help command or contact our support team.\n\nYour security and satisfaction are our top priorities! 💼💰`
  );
  return ctx.scene.leave();
});

module.exports = widthdrawalScene;
