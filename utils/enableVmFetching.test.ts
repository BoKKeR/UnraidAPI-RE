import fs from "fs";
import { enableVmFetching } from "./enableVmFetching";

test("Tests against extracted version with no VM tab", () => {
  const responseBuffer = fs.readFileSync(
    `./unraid-versions/${process.env.UNRAID_VERSION}/dashboardVmDockerDisabled.html`
  );

  const result = enableVmFetching(responseBuffer);

  expect(result).toBe(false);
});

test("Tests against extracted version html with VM tab", () => {
  const responseBuffer = fs.readFileSync(
    `./unraid-versions/${process.env.UNRAID_VERSION}/dashboard.html`
  );

  const result = enableVmFetching(responseBuffer);

  expect(result).toBe(true);
});
