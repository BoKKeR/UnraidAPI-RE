import fs from "fs";
import { extractUsbDetails } from "./extractUsbDetails";

const result = {
  id: "0627:0001",
  name: "Adomax Technology Co. QEMU USB Tablet"
};

test("Tests against extracted 6.12 version html for usb", () => {
  const buffer = fs.readFileSync("./unraid-versions/6.12/updateVM.html");
  const input = extractUsbDetails(buffer.toString());
  expect(input).toMatchObject(result);
});
