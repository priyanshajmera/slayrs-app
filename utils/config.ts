interface Config {
  apiBaseUrl: string;
}

const developmentConfig: Config = {
  apiBaseUrl: "http://192.168.1.7:3000", // Your local development API
};

const productionConfig: Config = {
  apiBaseUrl: "http://192.168.1.7:3000", // Your production API
};

const stagingConfig: Config = {
  apiBaseUrl: "http://192.168.1.7:3000", // Your staging API
};

const getConfig = (): Config => {
  if (__DEV__) {
    return developmentConfig;
  }
  // You can add more environment checks here
  return productionConfig;
};

export const config = getConfig();
