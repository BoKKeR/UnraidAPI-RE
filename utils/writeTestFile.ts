import fs from "fs";

const writeTestFile = (data: string, name: string, override?: boolean) => {
  if (process.env.WRITE_HTML_OUTPUT === "true" || override) {
    const path = `config/html_output`;
    const file = `${name}.html`;
    const fullPath = `${path}/${file}`;
    fs.mkdir(path, { recursive: true }, function(err) {
      if (err) {
        console.log(err);
      } else {
        fs.writeFile(fullPath, data, (err) => {
          if (err) {
            console.error(err);
          }
          console.log(`${fullPath} written successfully`);
        });
      }
    });
  }
};

export default writeTestFile;
