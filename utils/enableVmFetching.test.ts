import fs from "fs";
import { enableVmFetching } from "./enableVmFetching";

test("Tests against extracted 6.12 version with no VM tab", () => {
  const responseBuffer = fs.readFileSync(
    "./unraid-versions/6.12/dashboardVmDockerDisabled.html"
  );

  const result = enableVmFetching(responseBuffer);

  expect(result).toBe(false);
});

test("Tests against extracted 6.12 version html with VM tab", () => {
  const responseBuffer = fs.readFileSync(
    "./unraid-versions/6.12/dashboard.html"
  );

  const result = enableVmFetching(responseBuffer);

  expect(result).toBe(true);
});
