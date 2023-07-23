import { extractValue } from "./extractValue";

export const extractUsbDetails = (data) => {
  let row = extractValue(data, '<label for="usb', "</label>");

  const nameSplits = extractValue(row, "/> ", " (").split(">");
  return {
    id: extractValue(row, 'value="', '"'),
    name: nameSplits[nameSplits.length - 1].trim()
  };
};
