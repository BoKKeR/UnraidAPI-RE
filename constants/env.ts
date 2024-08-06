export default {
  MQTTBroker: process.env.MQTTBroker,
  RetainMessages: process.env.RetainMessages === "true",
  MQTTBaseTopic: process.env.MQTTBaseTopic,
  MQTTRefreshRate: process.env.MQTTRefreshRate
    ? parseInt(process.env.MQTTRefreshRate)
    : 60,
  MQTTCacheTime: process.env.MQTTCacheTime
    ? parseInt(process.env.MQTTCacheTime)
    : 60,
  KeyStorage: process.env.KeyStorage || "secure",

  MQTTConnection: {
    username: process.env.MQTTUser, // MQTT username
    password: process.env.MQTTPass, // MQTT password
    port: process.env.MQTTPort, // MQTT port
    host: process.env.MQTTBroker, // MQTT broker host
    rejectUnauthorized: process.env.MQTTSelfSigned !== "true", // Determine if self-signed certificates are rejected
    secure: process.env.MQTTSecure === "true"
  }
};
