import fs from "fs";

const writeTestFile = (data: string, name: string) => {
  if (process.env.WRITE_HTML_OUTPUT === "true") {
    const path = `config/html_output/${name}.html`;
    fs.mkdir(path, { recursive: true }, function(err) {
      if (err) {
        console.log(err);
      } else {
        fs.writeFile(path, data, (err) => {
          if (err) {
            console.error(err);
          }
          console.log(`${path} written successfully`);
        });
      }
    });
  }
};

export default writeTestFile;
