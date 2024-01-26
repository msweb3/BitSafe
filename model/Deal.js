const mongoose = require("mongoose");

const dealSchema = new mongoose.Schema(
  {
    dealId: { type: String },
    sellerId: { type: String },
    buyerId: { type: String },
    createdBy: { type: String },
    dealTerms: { type: String },
    dealPaymentMethod: {
      fullName: { type: String },
      name: { type: String },
      symbol: { type: String },
    },
    dealAmountUsd: { type: String },
    dealAmountCoin: { type: String },
    dealStatus: {
      isPaid: { type: Boolean, default: false },
      isAccepted: { type: Boolean, default: false },
      status: { type: String, default: "CREATED" }, // CREATED, ACCEPTED, PAID, DISPUTED, COMPLETED
    },
  },
  { timestamps: true }
);

const Deal = mongoose.model("Deal", dealSchema);

module.exports = Deal;
