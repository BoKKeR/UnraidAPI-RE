import { extractServerDetails } from "./extractServerDetails";
import fs from "fs";

const result = {
  title: "UNRAIDVM",
  cpu: "Intel® Core™ i7-8700K CPU @ 3.70GHz",
  memory: "8 GiB RAM Multi-bit ECC ",
  motherboard: "  ", // fix so a motherboard shows up in the VM
  diskSpace: "815 MB used of 107 GB (0.8 %)",
  cacheSpace: "23.1 GB used of 53.7 GB (43.0 %)",
  version: "6.12.3"
};

test("Tests against extracted 6.12 version html", () => {
  const buffer = fs.readFileSync("./unraid-versions/6.12/Dashboard.html");
  const input = extractServerDetails(buffer);
  expect(input.title).toBe(result.title);
  expect(input.cpu).toBe(result.cpu);
  expect(input.memory).toBe(result.memory);
  expect(input.version).toBe(result.version);

  expect(input.motherboard).toBe(result.motherboard);

  const diskSpaceRegex = /^[A-Za-z0-9]+ [A-Za-z0-9]+ used of [A-Za-z0-9]+ [A-Za-z0-9]+ \([^)]*\)$/i;
  // https://regex-generator.olafneumann.org/?sampleText=815%20MB%20used%20of%20107%20GB%20(0.8%20%25)&flags=Wi&selection=8%7CCharacter,9%7CCharacter,10%7CCharacter,11%7CCharacter,6%7CCharacter,3%7CCharacter,12%7CCharacter,13%7CCharacter,14%7CCharacter,18%7CCharacter,21%7CCharacter,22%7CCharacter,23%7CParentheses,28%7CCharacter,7%7CCharacter,4%7CAlphanumeric%20characters,19%7CAlphanumeric%20characters,0%7CAlphanumeric%20characters,15%7CAlphanumeric%20characters

  expect(input.cacheSpace).toMatch(diskSpaceRegex);
  expect(input.diskSpace).toMatch(diskSpaceRegex);
  expect(input.motherboard).toBe(result.motherboard);
});
