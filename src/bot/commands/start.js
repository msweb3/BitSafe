const { Markup } = require("telegraf");
const axios = require("axios");

const User = require("../../../model/User");
const config = require("../../../config");

module.exports = async (ctx) => {
  const user = await User.findOne({
    telegramId: ctx.update.message.from.id,
  }).catch((err) => {
    console.log(err.message);
  });

  if (!user) {
    const cryptoSchema = await Promise.all(
      config.SUPPORTED_CURRENCIES.map(async (currenciesSymbols) => {
        const response = await axios({
          method: "post",
          url: config.GENERATE_ADDRESS(process.env.APIRONE_ID),
          data: {
            currency: currenciesSymbols.symbol,
            callback: {
              method: "POST",
              url: process.env.CALLBACK_URL,
              data: { id: ctx.update.message.from.id },
            },
          },
        });

        return {
          name: currenciesSymbols.name,
          symbol: currenciesSymbols.symbol.toUpperCase(),
          address: response.data.address,
          balance: 0,
        };
      })
    );

    // Assuming User is a model with an asynchronous creation method.
    new User({
      telegramId: ctx.update.message.from.id,
      cryptos: cryptoSchema,
    })
      .save()
      .catch((err) => {
        console.log("Line 44, ", err.message);
      });
  } else {
    const missingCrypto = config.SUPPORTED_CURRENCIES.filter(
      (crypto) =>
        !user.cryptos.some(
          (userCrypto) =>
            crypto.symbol.toLowerCase() ===
            userCrypto.symbol.toLocaleLowerCase()
        )
    );

    const newCryptos = await Promise.all(
      missingCrypto.map(async (currenciesSymbols) => {
        const response = await axios({
          method: "post",
          url: config.GENERATE_ADDRESS(process.env.APIRONE_ID),
          data: {
            currency: currenciesSymbols.symbol,
            callback: {
              method: "POST",
              url: process.env.CALLBACK_URL,
              data: {
                id: ctx.update.message.from.id,
                secret: process.env.CALLBACK_SECRET,
              },
            },
          },
        });

        return {
          name: currenciesSymbols.name,
          symbol: currenciesSymbols.symbol.toUpperCase(),
          address: response.data.address,
          balance: 0,
        };
      })
    );

    newCryptos.forEach((newCrypto) => {
      user.cryptos.push(newCrypto);
    });

    user.save().catch((err) => {
      console.log(err.message);
    });
  }

  ctx.replyWithPhoto(
    { source: "public/images/start.png" },
    {
      caption: `🤖 <b>BitSafe - Your Secure Digital Escrow Bot</b>\n\nBitSafe is your trusted companion for secure transactions of digital goods using cryptocurrencies. Our bot simplifies the process, ensuring a safe and transparent experience for both buyers and sellers.\n\n<b>Key Features:</b>\n\n🔐 <b>Security First:</b>\n- BitSafe employs top-notch security measures to protect your transactions and sensitive information.\n\n💼 <b>Digital Goods Escrow:</b>\n- Facilitate smooth transactions for digital goods with the assurance of an escrow service.\n\n🤝 <b>Trusted Transactions:</b>\n- Build trust in your digital exchanges by leveraging BitSafe's reliable escrow services.\n\n📈 <b>Multiple Cryptocurrencies:</b>\n- BitSafe supports a variety of cryptocurrencies, providing flexibility for your transactions.\n\n🌐 <b>Why BitSafe?</b>\n- BitSafe simplifies and secures your digital transactions, fostering a trustworthy environment for buyers and sellers alike.\n\n🤖 <b>Thank you for choosing BitSafe! For more information, use the /help command.</b>\n\nHappy trading! 🌐💼`,
      parse_mode: "HTML",
      ...Markup.keyboard([
        ["🔐 Initiate Deal"],
        ["👤 Profile", "🤝 Active Deals"],
        ["🚀 Help / Support", "🖇 Our channels"],
        ["🔖 Terms and Conditions"],
      ])
        .resize()
        .oneTime(),
    }
  );
};
