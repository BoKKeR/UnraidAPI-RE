import fs from "fs";
import extractCsrfToken from "./extractCsrfToken";

test("Tests against extracted 6.12 version html", () => {
  const responseBuffer = fs.readFileSync(
    "./unraid-versions/6.12/dashboard.html"
  );

  // checks for upperCase hex of size 16
  const csrfRegex = /^[0-9A-F]{16}$/i;

  const dasboard = responseBuffer.toString();

  const result = extractCsrfToken(dasboard);
  expect(result).toMatch(csrfRegex);
});
