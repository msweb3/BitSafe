const mongoose = require("mongoose");

const cryptoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  symbol: { type: String, required: true },
  address: { type: String, required: true },
  balance: { type: mongoose.Types.Decimal128, required: true },
});

const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  pin: { type: String },
  cryptos: [cryptoSchema],
});

const User = mongoose.model("User", userSchema);

module.exports = User;
