import fs from "fs";
import { enableDockerFetching } from "./enableDockerFetching";

test("Tests against extracted 6.12 version with no Docker tab", () => {
  const responseBuffer = fs.readFileSync(
    `./unraid-versions/${process.env.UNRAID_VERSION}/dashboardVmDockerDisabled.html`
  );

  const result = enableDockerFetching(responseBuffer);

  expect(result).toBe(false);
});

test("Tests against extracted 6.12 version html with Docker tab", () => {
  const responseBuffer = fs.readFileSync(
    `./unraid-versions/${process.env.UNRAID_VERSION}/dashboard.html`
  );

  const result = enableDockerFetching(responseBuffer);

  expect(result).toBe(true);
});
