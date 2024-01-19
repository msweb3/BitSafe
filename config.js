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
  GET_EXCHANGE_RATE: (currency) => {
    return `https://apirone.com/api/v2/ticker?currency=${currency}`;
  },
};
