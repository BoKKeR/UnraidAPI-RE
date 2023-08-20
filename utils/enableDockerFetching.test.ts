import fs from "fs";
import { enableDockerFetching } from "./enableDockerFetching";

test("Tests against extracted 6.12 version with no Docker tab", () => {
  const responseBuffer = fs.readFileSync(
    "./unraid-versions/6.12/dashboardVmDockerDisabled.html"
  );

  const result = enableDockerFetching(responseBuffer);

  expect(result).toBe(false);
});

test("Tests against extracted 6.12 version html with Docker tab", () => {
  const responseBuffer = fs.readFileSync(
    "./unraid-versions/6.12/dashboard.html"
  );

  const result = enableDockerFetching(responseBuffer);

  expect(result).toBe(true);
});
