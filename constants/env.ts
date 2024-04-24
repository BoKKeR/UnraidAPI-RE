export default {
  MQTTBroker: process.env.MQTTBroker,
  RetainMessages: process.env.RetainMessages === "true",
  MQTTBaseTopic: process.env.MQTTBaseTopic,
  MQTTRefreshRate: process.env.MQTTRefreshRate
    ? parseInt(process.env.MQTTRefreshRate)
    : 20,
  MQTTCacheTime: process.env.MQTTCacheTime
    ? parseInt(process.env.MQTTCacheTime)
    : 60
};
