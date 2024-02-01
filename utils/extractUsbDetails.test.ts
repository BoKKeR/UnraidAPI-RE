import fs from "fs";
import { extractUsbDetails } from "./extractUsbDetails";

const result = [
  {
    id: "05e3:0749",
    name: "Genesys Logic SD Card Reader and Writer"
  },
  {
    id: "0627:0001",
    name: "Adomax Technology Co. QEMU USB Tablet"
  }
];

test("Tests against extracted version html for usb", () => {
  const buffer = fs.readFileSync(
    `./unraid-versions/${process.env.UNRAID_VERSION}/updateVM.html`
  );
  const inputObj = extractUsbDetails(buffer.toString());
  expect(result.some((resultObj) => isEqual(inputObj, resultObj))).toBeTruthy();
});

function isEqual(objA: any, objB: any): boolean {
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (objA[key] !== objB[key]) return false;
  }

  return true;
}
