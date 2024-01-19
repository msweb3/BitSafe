const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    owner_chatId: { type: String, required: true },
    currency: { type: String, required: true },
    value: { type: Number, required: true },
    input_address: { type: String, required: true },
    input_transaction_hash: { type: String, required: true },
    type: { type: String, required: true },
  },
  { timestamps: true }
);

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
