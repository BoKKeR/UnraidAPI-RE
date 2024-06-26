import fs from "fs";

export default function(req, res, next) {
  let body = [];
  let response = {};
  let data;
  req
    .on("data", (chunk) => {
      body.push(chunk);
    })
    .on("end", async () => {
      const ip = Buffer.concat(body).toString();

      for (let i = 0; i < 180; i++) {
        setTimeout(() => {
          deleteIP(ip);
        }, 1000 * i);
      }

      response.status = 200;
      res.send(response);
    });
}

function deleteIP(ip) {
  const rawdata = fs.readFileSync("config/servers.json");
  let servers = JSON.parse(rawdata);

  servers[ip] = undefined;

  fs.writeFileSync("config/servers.json", JSON.stringify(servers, null, 2));
}
