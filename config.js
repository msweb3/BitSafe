module.exports = {
  SUPPORTED_CURRENCIES: [
    { name: "Bitcoin", symbol: "btc" },
    { name: "Litecoin", symbol: "ltc" },
    { name: "Bitcoin Cash", symbol: "bch" },
    { name: "Dogecoin", symbol: "doge" },
    { name: "Bitcoin Testnet", symbol: "tbtc" },
  ],
  GENERATE_ADDRESS: (account) => {
    return `https://apirone.com/api/v2/accounts/${account}/addresses`;
  },
  GET_ESTIMATED_TRANSACTION: (account) => {
    return `https://apirone.com/api/v2/accounts/${account}/transfer`;
  },
  GET_EXCHANGE_RATE: (currency) => {
    return `https://apirone.com/api/v2/ticker?currency=${currency}`;
  },
  GET_NETWORK_FEE: (currency) => {
    return `https://apirone.com/api/v2/networks/${currency}/fee`;
  },
  TRANSFER_FUNDS: (account) => {
    return `https://apirone.com/api/v2/accounts/${account}/transfer`;
  },
};
