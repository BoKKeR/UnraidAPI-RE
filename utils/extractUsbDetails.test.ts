import fs from "fs";
import { extractUsbDetails } from "./extractUsbDetails";

const result = {
  id: "0951:1666",
  name: "Kingston Technology DataTraveler 100 G3/G4/SE9 G2/50"
};

test("Tests against extracted 6.12 version html for usb", () => {
  const buffer = fs.readFileSync("./unraid-versions/6.12/updateVM.html");
  const input = extractUsbDetails(buffer.toString());
  expect(input).toMatchObject(result);
});
