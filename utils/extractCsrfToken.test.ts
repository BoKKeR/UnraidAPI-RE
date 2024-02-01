import fs from "fs";
import extractCsrfToken from "./extractCsrfToken";

test("Tests against extracted version html", () => {
  const responseBuffer = fs.readFileSync(
    `./unraid-versions/${process.env.UNRAID_VERSION}/dashboard.html`
  );

  // checks for upperCase hex of size 14 or 16
  const csrfRegex = /^[0-9A-F]{14,16}$/i;

  const dasboard = responseBuffer.toString();

  const result = extractCsrfToken(dasboard);
  expect(result).toMatch(csrfRegex);
});
