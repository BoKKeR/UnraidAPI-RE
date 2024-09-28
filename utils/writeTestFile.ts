import fs from "fs";
import logger from "./logger";

const writeTestFile = (data: string, name: string, override?: boolean) => {
  if (process.env.WRITE_HTML_OUTPUT === "true" || override) {
    const path = `config/html_output`;
    const fullPath = `${path}/${name}`;
    fs.mkdir(path, { recursive: true }, function(err) {
      if (err) {
        console.log(err);
      } else {
        fs.writeFile(fullPath, data, (err) => {
          if (err) {
            console.error(err);
          }
          logger.info(`${fullPath} written successfully`);
        });
      }
    });
  }
};

export default writeTestFile;
