import { extractServerDetails } from "./extractServerDetails";
import fs from "fs";

const result = {
  title: "UNRAIDVM",
  cpu: "Intel® Core™ i7-8700K CPU @ 3.70GHz",
  memory: "8 GiB RAM Multi-bit ECC ",
  motherboard: "ASUS ASUSTeK COMPUTER INC. , Version Rev 2802",
  diskSpace: "815 MB used of 107 GB (0.8 %)",
  cacheSpace: "23.1 GB used of 53.7 GB (43.0 %)",
  version: "6.12.3"
};

test("Tests against extracted 6.12 version html", () => {
  const buffer = fs.readFileSync("./unraid-versions/6.12/dashboard.html");
  const input = extractServerDetails(buffer);
  expect(input.title).toBe(result.title);
  expect(input.cpu).toBe(result.cpu);
  expect(input.memory).toBe(result.memory);
  expect(input.version).toBe(result.version);

  expect(input.motherboard).toBe(result.motherboard);

  const diskSpaceRegex = /^\d+.?\d+ [A-Z]+ used of \d+.?\d? [A-Z]+ \([^)]*\)$/i;
  // https://regex-generator.olafneumann.org/

  expect(input.cacheSpace).toMatch(diskSpaceRegex);
  expect(input.diskSpace).toMatch(diskSpaceRegex);
  expect(input.motherboard).toBe(result.motherboard);
});
