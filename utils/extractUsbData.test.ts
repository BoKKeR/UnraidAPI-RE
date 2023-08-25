import fs from "fs";
import extractUSBData from "./extractUsbData";

const result = [
  {
    id: "05e3:0749",
    name: "Genesys Logic SD Card Reader and Writer",
    checked: true,
    connected: true
  },
  {
    id: "0627:0001",
    name: "Adomax Technology Co. QEMU USB Tablet",
    checked: false,
    connected: false
  }
];

test("Tests against extracted 6.12 version html", () => {
  const responseBuffer = fs.readFileSync(
    "./unraid-versions/6.12/updateVM.html"
  );
  const vmObjectBuffer = fs.readFileSync(
    "./unraid-versions/6.12/vmObject.json"
  );

  const vmObject = JSON.parse(vmObjectBuffer.toString());
  const input = extractUSBData(
    responseBuffer.toString(),
    vmObject,
    "10.0.0.63"
  );
  expect(input).toMatchObject(result);
});
