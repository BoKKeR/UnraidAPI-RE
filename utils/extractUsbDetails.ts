import { extractValue } from "./extractValue";

export const extractUsbDetails = (data) => {
  let row = extractValue(data, '<label for="usb', "</label>");
  console.log({
    id: extractValue(row, 'value="', '"'),
    name: extractValue(row, "/> ", " (")
  });

  const nameSplits = extractValue(row, "/> ", " (").split(">");
  return {
    id: extractValue(row, 'value="', '"'),
    name: nameSplits[nameSplits.length - 1].trim()
  };
};
