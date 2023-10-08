export default {
  MQTTBroker: process.env.MQTTBroker,
  RetainMessages: process.env.RetainMessages === "true",
  MQTTBaseTopic: process.env.MQTTBaseTopic
};
