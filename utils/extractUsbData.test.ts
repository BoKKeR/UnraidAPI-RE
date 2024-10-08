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

test("Tests against extracted version html", () => {
  const responseBuffer = fs.readFileSync(
    `./unraid-versions/${process.env.UNRAID_VERSION}/updateVM.html`
  );
  const vmObjectBuffer = fs.readFileSync(
    `./unraid-versions/${process.env.UNRAID_VERSION}/vmObject.json`
  );

  const vmObject = JSON.parse(vmObjectBuffer.toString());
  const input = extractUSBData(
    responseBuffer.toString(),
    vmObject,
    "10.0.0.63"
  );

  // Manually compare objects
  const foundDevices = result.filter((device) =>
    input.some((inputDevice) =>
      Object.keys(device).every((key) => device[key] === inputDevice[key])
    )
  );

  expect(foundDevices.length).toBeGreaterThan(0); // At least one device should be present
});
