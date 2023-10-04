import sanitise from "~/utils/sanitiseName";

function getDockerDetails(
  client,
  serverTitleSanitised,
  disabledDevices,
  dockerId: string,
  ip: string,
  server
) {
  console.log(
    client,
    serverTitleSanitised,
    disabledDevices,
    dockerId,
    ip,
    server
  );

  if (disabledDevices.includes(`${ip}|${dockerId}`)) {
    return;
  }
  if (!server?.docker?.details?.containers) {
    return;
  }
  const docker = server.docker.details.containers[dockerId];
  if (!docker) {
    return;
  }
  docker.name = sanitise(docker.name);

  if (!updated[ip]) {
    updated[ip] = {};
  }

  if (!updated[ip].dockers) {
    updated[ip].dockers = {};
  }

  if (updated[ip].dockers[dockerId] !== JSON.stringify(docker)) {
    client.publish(
      `${process.env.MQTTBaseTopic}/switch/${serverTitleSanitised}/${docker.name}/config`,
      JSON.stringify({
        payload_on: "started",
        payload_off: "stopped",
        value_template: "{{ value_json.status }}",
        state_topic: `${process.env.MQTTBaseTopic}/${serverTitleSanitised}/${docker.name}`,
        json_attributes_topic: `${process.env.MQTTBaseTopic}/${serverTitleSanitised}/${docker.name}`,
        name: `${serverTitleSanitised}_docker_${docker.name}`,
        unique_id: `${serverTitleSanitised}_${docker.name}`,
        device: {
          identifiers: [serverTitleSanitised],
          name: serverTitleSanitised,
          manufacturer: server.serverDetails.motherboard,
          model: "Docker"
        },
        command_topic: `${process.env.MQTTBaseTopic}/${serverTitleSanitised}/${docker.name}/dockerState`
      }),
      { retain: false }
    );
    client.publish(
      `${process.env.MQTTBaseTopic}/${serverTitleSanitised}/${docker.name}`,
      JSON.stringify(docker),
      { retain: false }
    );
    // publish restart container button
    client.publish(
      `${process.env.MQTTBaseTopic}/button/${serverTitleSanitised}/${docker.name}/config`,
      JSON.stringify({
        payload_available: true,
        payload_not_available: false,
        value_template: "{{ value_json.status }}",
        state_topic: `${process.env.MQTTBaseTopic}/${serverTitleSanitised}/${docker.name}`,
        json_attributes_topic: `${process.env.MQTTBaseTopic}/${serverTitleSanitised}/${docker.name}`,
        name: `${serverTitleSanitised}_docker_${docker.name}_restart`,
        unique_id: `${serverTitleSanitised}_${docker.name}_restart`,
        payload_press: "restart",
        device: {
          identifiers: [serverTitleSanitised],
          name: serverTitleSanitised,
          manufacturer: server.serverDetails.motherboard,
          model: "Docker"
        },
        command_topic: `${process.env.MQTTBaseTopic}/${serverTitleSanitised}/${docker.name}/dockerState`
      })
    );
    client.subscribe(
      `${process.env.MQTTBaseTopic}/${serverTitleSanitised}/${docker.name}/dockerState`
    );
    updated[ip].dockers[dockerId] = JSON.stringify(docker);
  }
}

export default getDockerDetails;
