import { UsbData, VMData } from "~/types";
import { extractValue } from "./extractValue";
import writeTestFile from "./writeTestFile";
import * as cheerio from "cheerio";

// maybe its not VMData
function extractUSBData(data: string, vmObject: VMData, ip: string) {
  writeTestFile(JSON.stringify(vmObject), "vmObject.json");

  const usbs: UsbData[] = [];

  const usbInfo = extractValue(data, "<td>USB Devices:</td>", "</td>");
  const $ = cheerio.load(usbInfo, null, false);

  $("label").map((index, elm) => {
    const isChecked = !!$(elm)
      .html()
      ?.includes("checked");
    const nameWithId = $(elm)
      .text()
      .trim();

    const idArray = nameWithId.split(" (");

    const name = idArray[idArray.length - 2];

    const id = $(elm)
      .find("input")
      .attr("value");
    usbs.push({
      // @ts-ignore
      id: id,
      name: name,
      checked: isChecked,
      connected: isChecked
    });
  });

  return usbs;
}

export default extractUSBData;
