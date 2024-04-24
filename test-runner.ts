import * as fs from "fs";
import * as process from "process";
import * as child_process from "child_process";
import { setTimeout } from "timers/promises";

const directoryPath = "./unraid-versions";

const testFolderParam = process.argv[2];

const main = async () => {
  // Read the directory
  const files = fs.readdirSync(directoryPath);

  if (testFolderParam) {
    await testVersion(testFolderParam);
  } else {
    // Assuming each folder name is a valid environment variable
    for (const folder of files) {
      if (folder !== ".DS_Store") {
        // Set environment variable based on folder name
        await testVersion(folder);
      }
    }
  }
};

const testVersion = async (folder: string) => {
  // Set environment variable based on folder name
  process.env.UNRAID_VERSION = folder;
  console.log(`Set environment variable ${folder} to ${folder}`);

  // Execute Jest for each folder
  const jestProcess = child_process.spawn(
    "./node_modules/.bin/jest --coverage=false",
    [],
    {
      stdio: "inherit",
      shell: true,
      env: { ...process.env } // Pass the current environment along with the new variable
    }
  );
  await setTimeout(5000);

  jestProcess.on("exit", (code, signal) => {
    console.log(`Jest process for ${folder} exited with code ${code}`);
  });
};

main();
