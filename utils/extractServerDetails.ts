import * as cheerio from "cheerio";
import { extractValue } from "./extractValue";

export const extractServerDetails = (data: Buffer) => {
  const $ = cheerio.load(data);

  const stringData = data.toString();
  const details = {
    title: extractValue(stringData, "title>", "/"),
    cpu: $('#db-box1 > [title="Processor Information"] > tr:nth-child(2) > td')
      .contents()
      .first()
      .text(),
    memory: $(
      '#db-box1 > [title="Memory Utilization"] > tr:nth-child(1) > td > div > span'
    )
      .text()
      .replace("Memory: ", ""),
    motherboard: $(
      '#db-box1 > [title="Motherboard Information"] > tr:nth-child(2) > td'
    )
      .contents()
      .first()
      .text(),
    diskSpace: $("#array_list > tr:nth-child(1) > td > div > span")
      .contents()
      .first()
      .text(),
    cacheSpace: $("#pool_list0 > tr:nth-child(1) > td > div > span")
      .contents()
      .first()
      .text(),
    version:
      extractValue(stringData, "Version: ", "&nbsp;").length < 10
        ? extractValue(stringData, "Version: ", "&nbsp;")
        : ""
  };

  return details;
};
