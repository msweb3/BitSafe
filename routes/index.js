const express = require("express");
const { Telegraf } = require("telegraf");

const router = express.Router();
const bot = new Telegraf(process.env.BOT_TOKEN);

const User = require("../model/User");
/* GET home page. */
const Transaction = require("../model/Transaction");

const config = require("../config");

router.post("/payment-callbacks", async function (req, res, next) {
  try {
    console.log(req.body);
    if (req.body.account != process.env.APIRONE_ID) {
      return res.status(401).send("401 Unauthorized").type("text/plain");
    }

    if (req.body.confirmations === 0) {
      return res
        .status(409)
        .send("409 Transaction Not Confirmed")
        .type("text/plain");
    }

    const transaction = await Transaction.find({
      input_transaction_hash: req.body.input_transaction_hash,
    });

    if (transaction.length > 0) {
      return res
        .status(409)
        .send("409 Transaction Already Found")
        .type("text/plain");
    }

    const user = await User.findOne({
      telegramId: req.body.data.id.toString(),
    });

    if (!user) {
      return res.status(404).send("404 User Not Found").type("text/plain");
    }

    const userAsset = user.cryptos.find((userAsset) => {
      return userAsset.address === req.body.input_address;
    });

    // Given values
    const amountInSatoshi = req.body.value;
    const unitsFactor = 1e-8;

    // Conversion
    const amountInBaseCurrency = amountInSatoshi * unitsFactor;

    userAsset.balance =
      parseFloat(userAsset.balance) + parseFloat(amountInBaseCurrency);
    user
      .save()
      .then((updatedUser) => {
        new Transaction({
          owner_id: updatedUser._id,
          owner_chatId: updatedUser.telegramId,
          currency: req.body.currency,
          value: req.body.value,
          input_address: req.body.input_address,
          input_transaction_hash: req.body.input_transaction_hash,
          type: "in",
        })
          .save()
          .then((transaction) => {
            try {
              const asset = config.SUPPORTED_CURRENCIES.find((currency) => {
                return currency.symbol === transaction.currency;
              });
              bot.telegram.sendMessage(
                transaction.owner_chatId,
                `🌐 <b>New Crypto Payment Detected</b>\n\nGood news! We've detected a new crypto payment deposit to your BitSafe account. Here are the details:\n\n<b>Crypto Asset:</b> ${
                  asset.name
                } (${asset.symbol.toUpperCase()})\n<b>Amount:</b> <code>${
                  transaction.value * 1e-8
                }</code> ${asset.symbol.toUpperCase()}\n<b>Transaction ID:</b> <code>${
                  transaction.input_transaction_hash
                }</code>\n\nYour account has been credited with the deposited amount. If you have any questions or need further assistance, feel free to use the /help command or contact our support team.\n\nHappy trading! 💼💰`,
                { parse_mode: "HTML" }
              );
              return res.status(200).send("ok").type("text/plain");
            } catch (error) {
              console.log(error.message);
            }
          })
          .catch((err) => {
            console.log(err.message);
          });
      })
      .catch((err) => {
        console.log(err.message);
      });
  } catch (error) {
    console.log(error.message);
  }
});

module.exports = router;
