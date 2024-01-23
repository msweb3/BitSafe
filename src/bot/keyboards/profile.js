const axios = require("axios");

const User = require("../../../model/User");
const config = require("../../../config");

module.exports = async (ctx) => {
  const user = await User.findOne({
    telegramId: ctx.update.message.from.id,
  });
  while (true) {
    try {
      const userData = await Promise.all(
        user.cryptos.map(async (crypto) => {
          const exchangeRates = await axios({
            method: "get",
            url: config.GET_EXCHANGE_RATE(crypto.symbol.toLowerCase()),
          });

          return {
            name: crypto.name,
            symbol: crypto.symbol.toUpperCase(),
            address: crypto.address,
            balance: crypto.balance,
            balanceInUSD: crypto.balance * exchangeRates.data.usd,
            exchangeRate: exchangeRates.data.usd,
          };
        })
      );

      const totalBalanceUSD = userData.reduce(
        (total, asset) => total + asset.balanceInUSD,
        0
      );

      const profileMessage = `<b>👤 Your BitSafe Profile</b>\n\n<b>Account Information:</b>\n- <b>Username:</b> ${
        ctx.update.message.from.username
          ? "@" + ctx.update.message.from.username
          : ctx.update.message.from.first_name
      }\n- <b>ID:</b> <code><b>${
        ctx.update.message.from.id
      }</b></code>\n\n<b>Crypto Asset Balances:</b>${userData
        .map(
          (asset) =>
            `\n- <b>${asset.name} (${
              asset.symbol
            }):</b> <code>${asset.balance.toString()} ${
              asset.symbol
            } ($${asset.balanceInUSD.toFixed(2)} USD)</code>`
        )
        .join(
          ""
        )}\n\n<b>Total Portfolio Value:</b> <code>$${totalBalanceUSD.toFixed(
        2
      )} USD</code>\n\nFeel free to manage your account details and explore other BitSafe features. If you have any questions, use the /help command or contact our support team.`;

      ctx.reply(profileMessage, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "Deposit 📥", callback_data: "deposit-btn" },
              { text: "📤 Withdraw", callback_data: "withdraw-btn" },
            ],
            [
              {
                text: "📝 Deposit history",
                callback_data: "deposit-history-btn",
              },
              {
                text: "📝 Withdrawal history",
                callback_data: "withdrawal-history-btn",
              },
            ],
            [
              !user.pin
                ? { text: "🔐 Set PIN-code", callback_data: "set-pincode-btn" }
                : {
                    text: "✏️ Update PIN-code",
                    callback_data: "update-pincode-btn",
                  },
            ],
          ],
        },
      });
      break;
    } catch (error) {
      return;
    }
  }
};
