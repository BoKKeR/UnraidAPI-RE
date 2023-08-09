import { UsbData, VMData } from "~/types";
import { extractValue } from "./extractValue";
import fs from "fs";
import writeTestFile from "./writeTestFile";

// maybe its not VMData
function extractUSBData(data: string, vmObject: VMData, ip: string) {
  writeTestFile(JSON.stringify(vmObject), "vmObject");

  let usbs: UsbData[] = [];
  let usbInfo = extractValue(data, "<td>USB Devices:</td>", "</td>");
  while (usbInfo.includes('value="')) {
    let row = extractValue(usbInfo, 'value="', " (");
    let usb = {} as UsbData;
    if (row.includes("checked")) {
      usb.checked = true;
    }
    usb.id = row.substring(0, row.indexOf('"'));
    usb.name = row.substring(row.indexOf("/") + 3);
    usb.connected = true;
    usbs.push(usb);
    usbInfo = usbInfo.replace('value="', "");
  }
  let rawdata = fs.readFileSync("config/servers.json");
  let servers = JSON.parse(rawdata.toString());
  let oldUsbs: UsbData[] = [];
  try {
    if (servers[ip].vm?.details[vmObject.id]?.edit) {
      oldUsbs = servers[ip].vm.details[vmObject.id].edit.usbs;
    }
  } catch (error) {
    console.log("error getting old Usb devices for VM");
  }
  if (oldUsbs && oldUsbs.length > usbs.length) {
    oldUsbs.forEach((usb) => {
      if (usbs.filter((usbInner) => usbInner.id === usb.id).length === 0) {
        usb.connected = false;
        usbs.push(usb);
      }
    });
  }

  return usbs;
}

export default extractUSBData;
