# UnraidAPI-RE

<p align="center"> 
<img src="https://github.com/BoKKeR/UnraidAPI-RE/blob/master/static/iconx64.png?raw=true">
</p>

<p align="center"> 
<img src="https://github.com/BoKKeR/UnraidAPI-RE/blob/master/static/unraid.jpeg?raw=true">
</p>

> A new UI and API for controlling multiple unraid instances and connecting them to the Home Assistant
> Fork of the original project which is abandoned ElectricBrainUK/UnraidAPI

[Open an issue](https://github.com/bokker/UnraidAPI-RE/issues/new?assignees=&labels=Review+needed&template=bug_report.md&title=)

The tags follow the unraid major releases and should work for minor also: 

```docker pull bokker/unraidapi-re:6.12``` for unraid 6.12

## External links
* [Unraid forum support topic](https://forums.unraid.net/topic/141974-support-fork-unraid-api-re/)
* [Dockerhub](https://hub.docker.com/r/bokker/unraidapi-re/)

# Install
## Community Applications unraid
* Install CA: [Youtube guide installing CA on unraid](https://www.youtube.com/watch?v=su2miwZNuaU) & [CA support unraid forums](https://forums.unraid.net/topic/38582-plug-in-community-applications/)
* Go to the `apps` tab and search for `unraid-api` and install it.

## Home Assistant AddOn
* Add the following custom repository: https://github.com/BoKKeR/unraidapi-re
* Build the Addon
* Fill in the config section
* Start

### Env variables
| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| MQTTBroker | string | **Required if enabled** | Your broker ip-address or domain e.g. `hassio`
| MQTTPort | number | **Required if enabled** | 1883 (Plain) / 8883 (SSL on hassio)
| MQTTUser | string | none | MQTT username
| MQTTPass | string | none | MQTT password
| MQTTBaseTopic | string | homeassistant | The base topic for all MQTT publishes
| MQTTSecure | boolean | false | For MQTT Over SSL set to `true`
| MQTTSelfSigned | boolean | false | If you are using a self signed certificate set to `true`
| MQTTRefreshRate | number | 20 | Time in seconds to poll for updates
| MQTTCacheTime | number | 60 | Time in minutes after which all entities will be updated in MQTT
| KeyStorage | string | config | Where to store the secure keys. If left blank the keys are kept in memory and will be destroyed each time the container is updated. Set to config to have the data persist
| Docker host port | number | 3005 | Default web-UI port. Container 80:3005 host



# Home Assistant Integration
## Automatic
Check out the HA docs on how to set up discovery for MQTT here:
https://www.home-assistant.io/docs/mqtt/discovery/

Use the env variable section to set up the MQTT client and connect to your MQTT broker. If auto discovery is enabled in home assistant the following will be created:
- An entity for each of your servers 
    - (sensor) Monitor server status
    - (switch) On/Off switch allows you to start stop array
- An entity for each of your VMs
    - (switch) On/Off toggle VM state
    - (switch) A seperate entity with a switch to attach / detach any usbs to that vm
    - (sensor) Whether or not a particular usb device is connected to the machine (can be used to automate hotplugging e.g. when connected toggle the usb switch off and on again)
- An entity for each of your dockers
    - (switch) On/Off toggle Docker state

You will end up having entities like these:

* binary_sensor.unraid_server **(Server info in attributes)**
* binary_sensor.unraid_vm_VMNAME_usb_USBDEVICE
* sensor.unraid_vm_VMNAME_status **(VM stats in attributes)**
* switch.unraid_array 
* switch.unraid_docker_DOCKERNAME **(Docker info in attributes)**
* switch.unraid_vm_VMNAME **(VM info in attributes)**

## Manual
Manual Config Example:
The server and VM names are as they are in MQTT (spaces are underscores and all lower case)
The **payload options** are **started, stopped, paused, restart, kill, hibernate**

```
- platform: mqtt

  command_topic: "homeassistant/servername/vmname/state"
  
  payload_on: "started"
 
  payload_off: "stopped"
```

When connecting the unraid api to an mqtt broker config details for all the various api functions are posted under the various homeassistant entity types. For example under **homeassistant/switch/server/vm/config**.

<picture>
  <source
    srcset="
      https://api.star-history.com/svg?repos=bokker/UnraidAPI-RE&type=Date&theme=dark
    "
  />
  <source
    media="(prefers-color-scheme: light)"
    srcset="
      https://api.star-history.com/svg?repos=bokker/UnraidAPI-RE&type=Date
    "
  />
  <img
    alt="Star History Chart"
    src="https://api.star-history.com/svg?repos=bokker/UnraidAPI-RE&type=Date"
  />
</picture>


<p align="center"> 
Icon made by <a href="https://www.flaticon.com/authors/freepik" title="Freepik">Freepik</a>
</p>
