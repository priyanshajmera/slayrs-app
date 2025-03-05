module.exports = {
  expo: {
    name: "Slayrs",
    slug: "slayrs",
    // ... other expo config
    scheme: "slayrs",
    extra: {
      apiBaseUrl: process.env.API_BASE_URL,
    },
  },
}; 