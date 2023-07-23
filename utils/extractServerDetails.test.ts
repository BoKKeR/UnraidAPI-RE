import { extractServerDetails } from "./extractServerDetails";
import fs from "fs";

const result = {
  title: "Tower",
  cpu: "Intel® Celeron® CPU J3455 @ 1.50GHz",
  memory: "8 GiB DDR3 ",
  motherboard: "Intel Corporation NUC6CAYB , Version J23203-402",
  diskSpace: "34.2 GB used of 39.9 GB (85.6 %)",
  cacheSpace: "2.17 GB used of 61.9 GB (3.5 %)",
  version: "6.12.3"
};

test("Tests against extracted 6.12 version html", () => {
  const buffer = fs.readFileSync("./unraid-versions/6.12/dashboard.html");
  const input = extractServerDetails(buffer);
  expect(input).toMatchObject(result);
});
