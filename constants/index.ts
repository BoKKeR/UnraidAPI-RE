export default {
  MQTTRefreshRate: process.env.MQTTRefreshRate
    ? parseInt(process.env.MQTTRefreshRate)
    : 20000,
  MQTTRetain: process.env.MQTTRetain === "true",
  MQTTBaseTopic: process.env.MQTTBaseTopic,
  MQTTBroker: process.env.MQTTBroker,
  MQTTSecure: process.env.MQTTSecure === "true",
  MQTTUser: process.env.MQTTUser,
  MQTTPass: process.env.MQTTPass,
  MQTTPort: process.env.MQTTPort,
  MQTTSelfSigned: process.env.MQTTSelfSigned !== "true",
  KeyStorage: process.env.KeyStorage,
  MQTTCacheTime: process.env.MQTTCacheTime
    ? parseInt(process.env.MQTTCacheTime)
    : 60
};
