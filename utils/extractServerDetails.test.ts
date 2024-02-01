import { extractServerDetails } from "./extractServerDetails";
import fs from "fs";

const result = {
  title: "UNRAIDVM",
  cpu: "Intel® Core™ i7-8700K CPU @ 3.70GHz",
  memory: "8 GiB RAM Multi-bit ECC ",
  motherboard: "ASUS ASUSTeK COMPUTER INC. , Version Rev 2802",
  diskSpace: "815 MB used of 107 GB (0.8 %)",
  cacheSpace: "23.1 GB used of 53.7 GB (43.0 %)",
  version: process.env.UNRAID_VERSION
};

const buffer = fs.readFileSync(
  `./unraid-versions/${process.env.UNRAID_VERSION}/dashboard.html`
);

test("Test version extraction", () => {
  const input = extractServerDetails(buffer);
  expect(input.version).toBe(result.version);
});

test("Test CPU extraction", () => {
  const input = extractServerDetails(buffer);
  expect(input.cpu).toBe(result.cpu);
});

test("Test memory extraction", () => {
  const input = extractServerDetails(buffer);
  expect(input.memory).toBe(result.memory);
});

test("Test motherboard extraction", () => {
  const input = extractServerDetails(buffer);
  expect(input.motherboard).toBe(result.motherboard);
});

test("Test disk space extraction", () => {
  const input = extractServerDetails(buffer);
  const diskSpaceRegex = /^\d+.?\d+ [A-Z]+ used of \d+.?\d? [A-Z]+ \([^)]*\)$/i;
  expect(input.diskSpace).toMatch(diskSpaceRegex);
});

test("Test cache space extraction", () => {
  const input = extractServerDetails(buffer);
  const diskSpaceRegex = /^\d+.?\d+ [A-Z]+ used of \d+.?\d? [A-Z]+ \([^)]*\)$/i;
  expect(input.cacheSpace).toMatch(diskSpaceRegex);
});

test("Test title extraction", () => {
  const input = extractServerDetails(buffer);
  expect(input.title).toBe(result.title);
});
