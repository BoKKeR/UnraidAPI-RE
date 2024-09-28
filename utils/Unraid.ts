import axios, { AxiosError } from "axios";
import fs from "fs";
import http from "http";
import https from "https";
import { extractServerDetails } from "./extractServerDetails";
import { extractDiskDetails } from "./extractDiskDetails";
import { extractValue } from "./extractValue";
import {
  Disk,
  DockerDetail,
  GPUData,
  HDD,
  HDDAllocationInfo,
  NicData,
  PCIData,
  ShareData,
  SoundData,
  UsbData,
  VMData
} from "~/types";
import { extractUsbDetails } from "./extractUsbDetails";
import writeTestFile from "./writeTestFile";
import extractCsrfToken from "./extractCsrfToken";
import { enableVmFetching } from "./enableVmFetching";
import {
  DockerAction,
  RootServerJSONConfig,
  ServerJSONConfig,
  Vm
} from "~/types/server";
import { enableDockerFetching } from "./enableDockerFetching";
import extractUSBData from "./extractUsbData";
import fetch from "node-fetch";
import FormData from "form-data";
import logger from "./logger";

axios.defaults.timeout = 3000;
axios.defaults.withCredentials = true;
axios.defaults.httpsAgent = new https.Agent({
  keepAlive: true,
  rejectUnauthorized: false
});

// Add a request interceptor
axios.interceptors.request.use(
  (request) => {
    // Log the request URL
    logger.debug(`Request URL: ${request.url}`);
    return request;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const authCookies = {};

export async function getImage(
  servers: RootServerJSONConfig,
  res,
  path: string
) {
  const serverAuth = JSON.parse(
    fs
      .readFileSync(
        `${
          process.env.KeyStorage ? `${process.env.KeyStorage}/` : "secure/"
        }mqttKeys`
      )
      .toString()
  );
  // await logIn(servers, serverAuth); // TODO: fix
  let sent = false;

  Object.keys(servers).forEach((server) => {
    fetch(
      (server.includes("http") ? server : `http://${server}`) +
        (path.includes("plugins") ? "/state" : "/plugins") +
        path,
      {
        method: "get",
        headers: {
          Authorization: `Basic ${serverAuth[server]}`,
          Cookie: authCookies[server],
          "content-type": "image/png"
        }
      }
    )
      .then((image) => {
        image.buffer().then((buffer) => {
          if (buffer.toString().includes("<!DOCTYPE html>")) {
            return;
          }
          if (!sent) {
            sent = true;
            try {
              res.set({ "content-type": "image/png" });
              res.send(buffer);
            } catch (e) {}
          }
        });
      })
      .catch((err) => {
        logger.error(err);
      });
  });
}

export async function getUnraidDetails(
  servers: RootServerJSONConfig,
  serverAuth: string
) {
  for (const ip of Object.keys(servers)) {
    const server = servers[ip];
    logger.debug(`Starting processing ${ip}`);

    try {
      if (!serverAuth[ip]) {
        logger.info(`No serverAuth, skipping ${ip}`);
        continue;
      }
      if (!authCookies[ip]) {
        await logIn(server, serverAuth, ip);
      }

      await getServerDetails(server, serverAuth, ip);
      if (server.serverDetails.vmEnabled) {
        await getVMs(server, serverAuth, ip);
      } else {
        logger.warn(`Skipping VMs for ${ip}`);
      }
      await getUSBDetails(server, serverAuth, ip);
      getPCIDetails(server, ip);

      if (server.serverDetails.dockerEnabled) {
        await getDockers(server, serverAuth, ip);
      } else {
        logger.warn(`Skipping docker for ${ip}`);
      }
    } catch (error) {
      logger.error(error);
    }
  }
}

async function logIn(server: ServerJSONConfig, serverAuth: string, ip: string) {
  // if (!serverAuth[ip] || (authCookies[ip] && authCookies[ip] !== undefined)) {
  //   if (!serverAuth[ip]) {
  //     servers[ip].status = "offline";
  //   } else {
  //     servers[ip].status = "online";
  //   }
  //   continue;
  // }
  server.status = "offline";
  const buff = Buffer.from(serverAuth[ip], "base64");
  const details = buff.toString("ascii");
  const data = new FormData();
  data.append("username", details.substring(0, details.indexOf(":")));
  data.append("password", details.substring(details.indexOf(":") + 1));

  await logInToUrl(
    `${ip.includes("http") ? ip : `http://${ip}`}/login`,
    data,
    ip
  );
  server.status = "online";
}

async function logInToUrl(url: string, data: any, ip: string) {
  try {
    // Login often gets the cookie from the catch part
    const response = await axios({
      url,
      method: "POST",
      data,
      headers: {
        ...data.getHeaders(),
        "cache-control": "no-cache",
        "Content-Type": "application/x-www-form-urlencoded"
      },
      httpAgent: new http.Agent({ keepAlive: true }),
      maxRedirects: 0
    });

    if (response.headers["set-cookie"] && response.headers["set-cookie"][0]) {
      authCookies[ip] = response.headers["set-cookie"][0];
      logger.info(`Updating auth cookie for ${ip} ${authCookies[ip]}`);
    }
  } catch (error) {
    if (
      error.response?.headers["set-cookie"] &&
      error.response.headers["set-cookie"][0]
    ) {
      authCookies[ip] = error.response.headers["set-cookie"][0];
      logger.info(`Updating auth cookie for ${ip} ${authCookies[ip]}`);
    } else if (error.response?.headers.location) {
      return logInToUrl(
        error.response.headers.location,
        data,
        error.response.headers.location
      );
    } else {
      throw new Error(`Failed to fetch login for ${ip}`);
    }
  }
}

export function getPCIDetails(
  server: ServerJSONConfig,
  ip: string,
  skipSave?: boolean
) {
  if (
    server.vm?.details &&
    Object.keys(server.vm.details).length > 0 &&
    server.vm.details[Object.keys(server.vm.details)[0]].edit
  ) {
    server.pciDetails =
      server.vm.details[Object.keys(server.vm.details)[0]].edit.pcis;
  }
  if (!skipSave) {
    updateFile(server, ip, "pciDetails");
  }
}
async function getUSBDetails(server: ServerJSONConfig, serverAuth, ip: string) {
  if (server.vm?.details && Object.keys(server.vm.details).length > 0) {
    try {
      const response = await axios({
        method: "get",
        url: `${ip.includes("http") ? ip : `http://${ip}`}/VMs/UpdateVM?uuid=${
          server.vm.details[Object.keys(server.vm.details)[0]].id
        }`,
        headers: {
          Authorization: `Basic ${serverAuth[ip]}`,
          Cookie: authCookies[ip] ? authCookies[ip] : ""
        }
      });

      callSucceeded(ip);
      writeTestFile(response.data, "updateVM.html");
      updateFile(server, ip, "status");
      server.usbDetails = [];

      while (response.data.toString().includes('<label for="usb')) {
        const usbDevice = extractUsbDetails(response.data);
        server.usbDetails.push(usbDevice);
        response.data = response.data.replace('<label for="usb', "");
      }

      updateFile(server, ip, "usbDetails");
    } catch (e) {
      logger.info(`Get USB Details for ip: ${ip} Failed`);
      if (e.response?.status) {
        callFailed(ip, e.response.status);
      } else {
        callFailed(ip, 404);
      }
      logger.error(e.message);
      if (e.message.includes("ETIMEDOUT")) {
        updateFile(server, ip, "status");
      }
    }
  }
}

const getServerDetails = async (
  server: ServerJSONConfig,
  serverAuth: string,
  ip: string
) => {
  if (server.serverDetails === undefined) {
    server.serverDetails = {};
  }

  if (!serverAuth[ip]) {
    server.serverDetails.on = false;
    return;
  }

  server.serverDetails =
    (await scrapeHTML(ip, serverAuth)) || server.serverDetails;
  server.serverDetails =
    {
      ...(await scrapeMainHTML(ip, serverAuth)),
      ...server.serverDetails
    } || server.serverDetails;

  server.serverDetails.on = server.status === "online";
  updateFile(server, ip, "serverDetails");

  // vm not enabled, we clear the object
  if (!server.serverDetails.vmEnabled) {
    delete server.vm;
    delete server.pciDetails;
    delete server.usbDetails;
    updateFile(server, ip, "vm");
    updateFile(server, ip, "pciDetails");
    updateFile(server, ip, "usbDetails");
  }

  if (
    !server.serverDetails.arrayStatus &&
    !server.serverDetails.cpu &&
    !server.serverDetails.motherboard &&
    !server.serverDetails.arrayProtection
  ) {
    logger.info("Possibly expired cookies, clearing cookies for next call");
    authCookies[ip] = undefined;
  }

  // docker not enabled, we clear the object
  if (!server.serverDetails.dockerEnabled) {
    delete server.docker;
    updateFile(server, ip, "docker");
  }
};

async function scrapeHTML(ip: string, serverAuth: any) {
  try {
    const response = await axios({
      method: "get",
      url: `${ip.includes("http") ? ip : `http://${ip}`}/Dashboard`,
      headers: {
        Authorization: `Basic ${serverAuth[ip]}`,
        Cookie: authCookies[ip] ? authCookies[ip] : ""
      }
    });

    callSucceeded(ip);
    writeTestFile(response.data, "dashboard.html");

    const details = extractServerDetails(response.data);
    extractDiskDetails(details, "diskSpace", "array");
    extractDiskDetails(details, "cacheSpace", "cache");

    return details;
  } catch (e) {
    logger.info(
      `Get Dashboard Details for ip: ${ip} Failed with status code: ${e.response?.status}`
    );
    if (e.response?.status) {
      callFailed(ip, e.response.status);
    } else {
      callFailed(ip, 404);
    }
    logger.error(e.message);
  }
}

async function scrapeMainHTML(ip: string, serverAuth: string) {
  try {
    const response = await axios({
      method: "get",
      url: `${ip.includes("http") ? ip : `http://${ip}`}/Main`,
      headers: {
        Authorization: `Basic ${serverAuth[ip]}`,
        Cookie: authCookies[ip] ? authCookies[ip] : ""
      }
    });

    callSucceeded(ip);

    const protection = extractValue(
      response.data,
      "</td></tr>\n          <tr><td>",
      "</td><td>"
    );

    return {
      arrayStatus: extractReverseValue(
        extractValue(response.data, '<table class="array_status">', "/span>"),
        "<",
        ">"
      ).split(",")[0],
      arrayProtection: protection.includes(">") ? undefined : protection,
      moverRunning: response.data.includes("Disabled - Mover is running."),
      parityCheckRunning: response.data.includes("Parity-Check in progress."),
      vmEnabled: enableVmFetching(response.data),
      dockerEnabled: enableDockerFetching(response.data)
    };
  } catch (e) {
    logger.info(`Get Main Details for ip: ${ip} Failed`);
    if (e.response?.status) {
      callFailed(ip, e.response.status);
    } else {
      callFailed(ip, 404);
    }
    logger.error(e.message);
  }
}

async function getVMs(
  server: ServerJSONConfig,
  serverAuth: string,
  ip: string
) {
  try {
    const response = await axios({
      method: "get",
      url: `${
        ip.includes("http") ? ip : `http://${ip}`
      }/plugins/dynamix.vm.manager/include/VMMachines.php`,
      headers: {
        Authorization: `Basic ${serverAuth[ip]}`,
        Cookie: authCookies[ip] ? authCookies[ip] : ""
      }
    });

    callSucceeded(ip);
    server.vm = {} as Vm;
    let htmlDetails;

    writeTestFile(response.data, "virtualMachines.html");

    if (response.data.toString().includes("\u0000")) {
      const parts = response.data.toString().split("\u0000");
      htmlDetails = JSON.stringify(parts[0]);
      try {
        server.vm.extras = parts[1];
      } catch (error) {
        logger.info("Error in servers[ip].vm.extras = parts[1];");
      }
    } else {
      htmlDetails = response.data.toString();
    }

    const details = parseHTML(htmlDetails);
    try {
      server.vm.details = await processVMResponse(details, ip, serverAuth[ip]);
    } catch (error) {
      logger.error("Error processing VM response for ip:", ip);
    }

    updateFile(server, ip, "vm");
  } catch (e) {
    logger.error(`Get VM Details for ip: ${ip} Failed`);
    if (e.response?.status) {
      callFailed(ip, e.response.status);
    } else {
      callFailed(ip, 404);
    }
    logger.error(e.message);
  }
}

function processDockerResponse(details) {
  const images = {};
  const containers = {};
  details.forEach((row) => {
    if (!row.content || !row.content.includes("undefined")) {
      const docker: Partial<DockerDetail> = {};
      row.children.forEach((child, index) => {
        try {
          if (child.tags.class) {
            switch (child.tags.class) {
              case "ct-name":
                docker.imageUrl = child.children[1].children[0].children[0].tags.src.split(
                  "?"
                )[0];
                if (child.children[1].children[1].children[0].children[0]) {
                  docker.name =
                    child.children[1].children[1].children[0].children[0].contents;
                } else {
                  docker.name =
                    child.children[1].children[1].children[0].contents;
                }
                if (child.children[1].children[1].children[1].children[1]) {
                  docker.status =
                    child.children[1].children[1].children[1].children[1].contents;
                }
                if (child.children[2]?.contents) {
                  docker.containerId = child.children[2].contents.replace(
                    "Container ID: ",
                    ""
                  );
                }
                break;
              case "updatecolumn":
                if (child.children[2]?.contents) {
                  docker.tag = child.children[2].contents.trim();
                }
                if (child.children[0]?.contents) {
                  docker.uptoDate = child.children[0].contents.trim();
                }
                break;
            }
            if (docker.containerId) {
              containers[docker.containerId] = docker;
            }
          } else {
            switch (index) {
              case 0:
                docker.imageUrl =
                  child.children[0].children[0].children[0].tags.src;
                break;
              case 1:
                if (child?.contents) {
                  docker.imageId = child.contents.replace("Image ID: ", "");
                }
                break;
              case 2:
                if (child?.contents?.includes("Created")) {
                  docker.created = child.contents;
                }
                break;
            }
            if (docker.imageId) {
              images[docker.imageId] = docker;
            }
          }
        } catch (e) {
          logger.error(
            "There was a problem retrieving a field for a docker image"
          );
          logger.error(e.message);
        }
      });
    }
  });
  return { images, containers };
}
async function getDockers(
  server: ServerJSONConfig,
  serverAuth: string,
  ip: string
) {
  try {
    const response = await axios({
      method: "get",
      url: `${
        ip.includes("http") ? ip : `http://${ip}`
      }/plugins/dynamix.docker.manager/include/DockerContainers.php`,
      headers: {
        Authorization: `Basic ${serverAuth[ip]}`,
        Cookie: authCookies[ip] ? authCookies[ip] : ""
      }
    });

    callSucceeded(ip);
    const htmlDetails = JSON.stringify(response.data);
    const details = parseHTML(htmlDetails);
    server.docker = {};
    server.docker.details = await processDockerResponse(details);
    updateFile(server, ip, "docker");
  } catch (e) {
    logger.error(`Get Docker Details for ip: ${ip} Failed`);
    if (e.response?.status) {
      callFailed(ip, e.response.status);
    } else {
      callFailed(ip, 404);
    }
    logger.error(e.message);
  }
}

function updateFile(server: ServerJSONConfig, ip: string, tag: string) {
  let oldServers = {};
  try {
    const rawdata = fs.readFileSync("config/servers.json");
    oldServers = JSON.parse(rawdata.toString());
  } catch (e) {
    logger.error(e);
  } finally {
    if (!oldServers[ip]) {
      oldServers[ip] = {};
    }
    oldServers[ip][tag] = server[tag];
    fs.writeFileSync(
      "config/servers.json",
      JSON.stringify(oldServers, null, 2)
    );
  }
}

function parseHTML(html: string) {
  const parsedHtml = [];
  while (isRemaining(html)) {
    const result = parseTag(
      html.substring(html.indexOf("<"), html.indexOf(">") + 1),
      html
    );
    html = result.remaining;
    parsedHtml.push(result.contains);
    while (isAnyClosingTag(html)) {
      html = html.substring(html.indexOf(">") + 1);
    }
  }
  return parsedHtml;
}

function isRemaining(remaining: string) {
  return remaining && remaining.indexOf("<") >= 0;
}

function isAnyClosingTag(remaining: string) {
  return remaining && remaining.indexOf("</") === 0;
}

function parseTag(tag: string, remaining: string) {
  remaining = remaining.replace(tag, "");
  let object = {};
  const open = processTags(tag, object);

  if (!isClosingTag(remaining, open) && isRemaining(remaining)) {
    const result = {};
    result.contains = [];
    const contentCheck = checkContents(remaining, object);
    remaining = contentCheck.remaining;
    object = contentCheck.object;
    while (hasChildren(remaining)) {
      if (remaining.indexOf("<img") === 0) {
        const img = {};
        processTags(
          remaining.substring(
            remaining.indexOf("<"),
            remaining.indexOf(">") + 1
          ),
          img
        );
        result.contains.push(img);
        remaining = remaining.substring(remaining.indexOf(">") + 1);
        continue;
      }
      const child = parseTag(
        remaining.substring(remaining.indexOf("<"), remaining.indexOf(">") + 1),
        remaining
      );
      result.contains.push(child.contains);
      remaining = child.remaining;
      const contentCheck = checkContents(remaining, object);
      remaining = contentCheck.remaining;
      object = contentCheck.object;
    }
    if (result.remaining) {
      remaining = result.remaining;
    }
    object.children = result.contains;
  }
  if (isRemaining(remaining) && isClosingTag(remaining, open)) {
    const contentCheck = checkContents(remaining, object);
    remaining = contentCheck.remaining;
    object = contentCheck.object;
    remaining = remaining.substring(remaining.indexOf(">") + 1);
  }
  if (!isRemaining(remaining)) {
    remaining = "";
  }
  return { contains: object, remaining };
}

function processTags(tag, object) {
  tag = tag.replace(">", "");
  const tagParts = tag.split(" ");
  const open = tagParts.shift().substring(1);
  object.tags = {};
  if (tagParts && tagParts.length > 0) {
    tagParts
      .map((part) => {
        const tags = part.split("=");
        return { name: clean(tags[0]), value: clean(tags[1]) };
      })
      .forEach((tag) => {
        object.tags[tag.name] = tag.value;
      });
  }
  object.tags.html = open;
  return open;
}

function clean(value: string) {
  if (value) {
    return value.replace(/\'/g, "");
  }
}

function isClosingTag(remaining, open) {
  return remaining.indexOf(`</${open}>`) === 0;
}

function checkContents(remaining, object) {
  if (hasContents(remaining)) {
    if (object.contents) {
      object.content += object.contents;
    } else {
      object.contents = remaining.substring(0, remaining.indexOf("<"));
    }
    remaining = remaining.substring(remaining.indexOf("<"));
  }
  return { remaining, object };
}

function hasContents(remaining) {
  return remaining.indexOf("</") !== 0 && remaining.indexOf("<") !== 0;
}

function hasChildren(remaining) {
  return remaining.indexOf("<") === 0 && remaining.indexOf("</") !== 0;
}

function processVMResponse(response, ip: string, auth: string) {
  const object = [];
  groupVmDetails(response, object);
  return simplifyResponse(object, ip, auth);
}

function groupVmDetails(response, object) {
  response.forEach((row) => {
    if (row.tags["parent-id"]) {
      if (!object[row.tags["parent-id"]]) {
        object[row.tags["parent-id"]] = {};
      }
      object[row.tags["parent-id"]].parent = row;
    } else if (row.tags["child-id"]) {
      if (!object[row.tags["child-id"]]) {
        object[row.tags["child-id"]] = {};
      }
      object[row.tags["child-id"]].child = row;
    }
  });
}

async function simplifyResponse(object, ip: string, auth: string) {
  const temp = {};
  for (const vm of object) {
    let newVMObject = {} as VMData;
    newVMObject.name =
      vm.parent.children[0].children[1].children[1].children[0].contents;
    newVMObject.id = vm.parent.children[0].children[1].children[0].tags.id.replace(
      "vm-",
      ""
    );
    newVMObject.status =
      vm.parent.children[0].children[1].children[1].children[1].children[1].contents;
    newVMObject.icon =
      vm.parent.children[0].children[1].children[0].children[0].tags.src;
    newVMObject.coreCount = vm.parent.children[2].children[0].contents;
    newVMObject.ramAllocation = vm.parent.children[3].contents;
    newVMObject.hddAllocation = {} as HDDAllocationInfo;
    newVMObject.hddAllocation.all = [];
    newVMObject.hddAllocation.total = vm.parent.children[4].contents;

    if (vm.child.children[0].children[0].children[0].children) {
      vm.child.children[0].children[0].children[0].children.forEach(
        (driveDetails) => {
          const detailsArr = driveDetails.children.map((drive) => {
            return drive.contents;
          });
          const details = {
            path: detailsArr[0],
            interface: detailsArr[1],
            allocated: detailsArr[2],
            used: detailsArr[3]
          } as HDD;
          newVMObject.hddAllocation.all.push(details);
        }
      );
    }
    newVMObject.primaryGPU = vm.parent.children[5].contents;
    newVMObject = await gatherDetailsFromEditVM(
      ip,
      newVMObject.id,
      newVMObject,
      auth
    );
    temp[newVMObject.id] = newVMObject;
  }
  return temp;
}

export async function getCSRFToken(server: string, auth: string) {
  try {
    const response = await axios({
      method: "get",
      url: `${server.includes("http") ? server : `http://${server}`}/Dashboard`,
      headers: {
        Authorization: `Basic ${auth}`,
        Cookie: authCookies[server]
      }
    });

    callSucceeded(server);
    return extractCsrfToken(response.data);
  } catch (e) {
    logger.error(`Get CSRF Token for server: ${server} Failed`);
    if (e.response?.status) {
      callFailed(server, e.response.status);
    } else {
      callFailed(server, 404);
    }
    logger.error(e.message);
  }
}

export function extractReverseValue(
  data: string,
  value: string,
  terminator: string
) {
  return extractValue(
    data
      .split("")
      .reverse()
      .join(""),
    value
      .split("")
      .reverse()
      .join(""),
    terminator
      .split("")
      .reverse()
      .join("")
  )
    .split("")
    .reverse()
    .join("");
}

export function changeArrayState(
  action: string,
  server: string,
  auth: string,
  token: string
) {
  return axios({
    method: "POST",
    url: `${server.includes("http") ? server : `http://${server}`}/update.htm`,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest",
      Cookie: authCookies[server]
    },
    data:
      action === "start"
        ? `startState=STOPPED&file=&csrf_token=${token}&cmdStart=Start`
        : `startState=STARTED&file=&csrf_token=${token}&cmdStop=Stop`,
    httpAgent: new http.Agent({ keepAlive: true })
  })
    .then((response) => {
      callSucceeded(server);
      return response.data;
    })
    .catch((e) => {
      logger.error(`Change Array State for ip: ${server} Failed`);
      if (e.response?.status) {
        callFailed(server, e.response.status);
      } else {
        callFailed(server, 404);
      }
      logger.error(e.message);
    });
}

export function changeServerState(
  action: string,
  server: string,
  auth: string,
  token: string
) {
  switch (action) {
    case "shutdown":
      return axios({
        method: "POST",
        url: `${
          server.includes("http") ? server : `http://${server}`
        }/webGui/include/Boot.php`,
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
          Cookie: authCookies[server]
        },
        data: `csrf_token=${token}&cmd=shutdown`,
        httpAgent: new http.Agent({ keepAlive: true })
      })
        .then(() => {
          return { success: true };
        })
        .catch((e) => {
          logger.error(e);
          return { success: false };
        });
    case "reboot":
      return axios({
        method: "POST",
        url: `${
          server.includes("http") ? server : `http://${server}`
        }/webGui/include/Boot.php`,
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
          Cookie: authCookies[server]
        },
        data: `csrf_token=${token}&cmd=reboot`,
        httpAgent: new http.Agent({ keepAlive: true })
      })
        .then(() => {
          return { success: true };
        })
        .catch((e) => {
          logger.error(e);
          return { success: false };
        });
    case "move":
      return axios({
        method: "POST",
        url: `${
          server.includes("http") ? server : `http://${server}`
        }/update.htm`,
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
          Cookie: authCookies[server]
        },
        data: `cmdStartMover=Move&csrf_token=${token}`,
        httpAgent: new http.Agent({ keepAlive: true })
      })
        .then(() => {
          return { success: true };
        })
        .catch((e) => {
          logger.error(e);
          return { success: false };
        });
    case "check":
      return axios({
        method: "POST",
        url: `${
          server.includes("http") ? server : `http://${server}`
        }/update.htm`,
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
          Cookie: authCookies[server]
        },
        data: `startState=STARTED&file=&cmdCheck=Check&optionCorrect=correct&csrf_token=${token}`,
        httpAgent: new http.Agent({ keepAlive: true })
      })
        .then(() => {
          return { success: true };
        })
        .catch((e) => {
          logger.error(e);
          return { success: false };
        });
    case "check-cancel":
      return axios({
        method: "POST",
        url: `${
          server.includes("http") ? server : `http://${server}`
        }/update.htm`,
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
          Cookie: authCookies[server]
        },
        data: `startState=STARTED&file=&csrf_token=${token}&cmdNoCheck=Cancel`,
        httpAgent: new http.Agent({ keepAlive: true })
      })
        .then(() => {
          return { success: true };
        })
        .catch((e) => {
          logger.error(e);
          return { success: false };
        });
    case "sleep":
      return axios({
        method: "GET",
        url: `${
          server.includes("http") ? server : `http://${server}`
        }/plugins/dynamix.s3.sleep/include/SleepMode.php`,
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
          Cookie: authCookies[server]
        }
      })
        .then(() => {
          return { success: true };
        })
        .catch((e) => {
          logger.error(e);
          return { success: false };
        });
    default:
      logger.error(
        "Looks like you tried to change the server state but without describing how."
      );
  }
}

export async function changeVMState(
  id: string,
  action: string,
  server: string,
  auth: string,
  token: string
) {
  if (!token) {
    token = (await getCSRFToken(server, auth)) as string;
    console.info(`Got new CSRF_token: ${token}`);
  }
  return axios({
    method: "POST",
    url: `${
      server.includes("http") ? server : `http://${server}`
    }/plugins/dynamix.vm.manager/include/VMajax.php`,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest",
      Cookie: authCookies[server]
    },
    data: `uuid=${id}&action=${action}&csrf_token=${token}`,
    httpAgent: new http.Agent({ keepAlive: true })
  })
    .then((response) => {
      callSucceeded(server);
      if (response.data.state === "running") {
        response.data.state = "started";
      }
      if (response.data.state === "shutoff") {
        response.data.state = "stopped";
      }
      return response.data;
    })
    .catch((e) => {
      logger.error(`Change VM State for ip: ${server} Failed`);
      if (e.response?.status) {
        callFailed(server, e.response.status);
      } else {
        callFailed(server, 404);
      }
      logger.error(e.message);
    });
}

export async function changeDockerState(
  id: string,
  action: DockerAction,
  server: string,
  auth: string,
  token: string
) {
  if (!token) {
    token = (await getCSRFToken(server, auth)) as string;
    logger.info(`Got new CSRF_token: ${token}`);
  }
  return axios({
    method: "POST",
    url: `${
      server.includes("http") ? server : `http://${server}`
    }/plugins/dynamix.docker.manager/include/Events.php`,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest",
      Cookie: authCookies[server]
    },
    data: `container=${id}&action=${action.replace(
      "domain-",
      ""
    )}&csrf_token=${token}`,
    httpAgent: new http.Agent({ keepAlive: true })
  })
    .then((response) => {
      callSucceeded(server);
      if (response.data.state === "running") {
        response.data.state = "started";
      }
      if (response.data.state === "shutoff") {
        response.data.state = "stopped";
      }
      return response.data;
    })
    .catch((e) => {
      logger.error(`Change Docker State for ip: ${server} Failed`);
      if (e.response?.status) {
        callFailed(server, e.response.status);
      } else {
        callFailed(server, 404);
      }
      logger.error(e.message);
    });
}

export function gatherDetailsFromEditVM(
  ip: string,
  id: string,
  vmObject,
  auth
) {
  const rawdata = fs.readFileSync("config/servers.json");
  const servers = JSON.parse(rawdata.toString());
  if (!vmObject) {
    vmObject = servers[ip].vm.details[id];
  }
  return axios({
    method: "get",
    url: `${ip.includes("http") ? ip : `http://${ip}`}/VMs/UpdateVM?uuid=${id}`,
    headers: {
      Authorization: `Basic ${auth}`,
      Cookie: authCookies[ip] ? authCookies[ip] : ""
    }
  })
    .then((response) => {
      callSucceeded(ip);
      return extractVMDetails(vmObject, response.data, ip);
    })
    .catch((e) => {
      logger.error(`Get VM Edit details for ip: ${ip} Failed`);
      if (e.response?.status) {
        callFailed(ip, e.response.status);
      } else {
        callFailed(ip, 404);
      }
      logger.error(e.message);
      vmObject.edit = servers[ip].vm.details[id].edit;
      return vmObject;
    });
}

function getVMStaticData(data: string) {
  return {
    template_os: extractValue(data, 'id="template_os" value="', '"'),
    domain_type: extractValue(data, 'domain[type]" value="', '"'),
    template_name: extractValue(data, 'template[name]" value="', '"'),
    template_icon: extractValue(data, 'id="template_icon" value="', '"'),
    domain_persistent: extractValue(data, 'domain[persistent]" value="', '"'),
    domain_clock: extractValue(
      data,
      'domain[clock]" id="domain_clock" value="',
      '"'
    ),
    domain_arch: extractValue(data, 'domain[arch]" value="', '"'),
    domain_oldname: extractValue(
      data,
      'domain[oldname]" id="domain_oldname" value="',
      '"'
    ),
    domain_name: extractValue(
      data,
      'placeholder="e.g. My Workstation" value="',
      '"'
    ),
    domain_desc: extractValue(
      data,
      'placeholder="description of virtual machine (optional)" value="',
      '"'
    ),
    domain_cpumode: extractValue(
      extractValue(data, 'domain[cpumode]" title="', "</td>"),
      "selected>",
      "</option>"
    ),
    domain_mem: extractReverseValue(
      extractValue(data, '<select name="domain[mem]"', "selected>"),
      "'",
      "value='"
    ),
    domain_maxmem: extractReverseValue(
      extractValue(data, '<select name="domain[maxmem]"', "selected>"),
      "'",
      "value='"
    ),
    domain_machine: extractReverseValue(
      extractValue(data, '<select name="domain[machine]"', "selected>"),
      "'",
      "value='"
    ),
    domain_hyperv: extractReverseValue(
      extractValue(data, '<select name="domain[hyperv]"', "selected>"),
      "'",
      "value='"
    ),
    domain_usbmode: extractReverseValue(
      extractValue(data, '<select name="domain[usbmode]"', "selected>"),
      "'",
      "value='"
    ),
    domain_ovmf: extractValue(data, 'name="domain[ovmf]" value="', '"'),
    media_cdrom: extractValue(
      data,
      'name="media[cdrom]" class="cdrom" value="',
      '"'
    ),
    media_cdrombus: extractReverseValue(
      extractValue(data, '<select name="media[cdrombus]"', "selected>"),
      "'",
      "value='"
    ),
    media_drivers: extractValue(
      data,
      'name="media[drivers]" class="cdrom" value="',
      '"'
    ),
    media_driversbus: extractReverseValue(
      extractValue(data, '<select name="media[driversbus]"', "selected>"),
      "'",
      "value='"
    ),
    gpu_bios: extractValue(data, '="^[^.].*" data-pickroot="/" value="', '"'), //todo deprecate
    nic_0_mac: extractValue(
      data,
      'name="nic[0][mac]" class="narrow" value="',
      '"'
    ) //todo deprecate
  };
}

function extractCPUDetails(data: string) {
  const cpuDetails: string[] = [];
  while (data.includes("for='vcpu")) {
    const row = extractValue(data, "<label for='vcpu", "</label>");
    if (row.includes("checked")) {
      cpuDetails.push(extractValue(row, "value='", "'"));
    }
    data = data.replace("for='vcpu", "");
  }
  return cpuDetails;
}

function extractDiskData(data: string) {
  const disks: Disk[] = [];
  while (data.includes('id="disk_')) {
    const row = extractValue(data, 'id="disk_', ">");
    const disk = extractValue(row, "", '"');
    const diskselect = extractReverseValue(
      extractValue(data, `<select name="disk[${disk}][select]"`, "selected>"),
      "'",
      "value='"
    );
    const diskdriver = extractReverseValue(
      extractValue(data, `<select name="disk[${disk}][driver]"`, "selected>"),
      "'",
      "value='"
    );
    const diskbus = extractReverseValue(
      extractValue(data, `<select name="disk[${disk}][bus]"`, "selected>"),
      "'",
      "value='"
    );
    const disksize = extractValue(
      data,
      `name="disk[${disk}][size]" value="`,
      '"'
    );
    const diskpath = extractValue(row, 'value="', '"');
    if (diskpath) {
      disks.push({
        select: diskselect,
        image: diskpath,
        driver: diskdriver,
        bus: diskbus,
        size: disksize
      });
    }
    data = data.replace('id="disk_', "");
  }
  return disks;
}

function extractShareData(data: string) {
  const shares: ShareData[] = [];
  data.replace(
    '<script type="text/html" id="tmplShare">\n' +
      '                                                                                <table class="domain_os other">\n' +
      '                                                                                    <tr class="advanced">\n' +
      "                                                                                        <td>Unraid Share:</td>",
    ""
  );

  while (data.includes("<td>Unraid Share:</td>")) {
    const sourceRow = extractValue(data, "<td>Unraid Share:</td>", "</td>");
    const targetRow = extractValue(data, "<td>Unraid Mount tag:</td>", "</td>");
    shares.push({
      source: extractValue(sourceRow, 'value="', '"'),
      target: extractValue(targetRow, 'value="', '"')
    });
    data = data.replace("<td>Unraid Share:</td>", "");
  }
  return shares;
}

function extractPCIData(data: string) {
  const pcis: PCIData[] = [];
  while (data.includes(' name="pci[]" id')) {
    const row = extractValue(data, ' name="pci[]" id', "/>");
    const device = {} as PCIData;
    device.name = extractValue(
      extractValue(data, ' name="pci[]" id', "/label>"),
      ">",
      "<"
    );
    if (row.includes("checked")) {
      device.checked = true;
    }
    device.id = extractValue(row, 'value="', '"');
    pcis.push(device);

    data = data.replace(' name="pci[]" id', "");
  }
  return pcis;
}

function extractIndividualGPU(
  gpuInfo: string,
  gpuNo: number,
  vmObject,
  data: string
) {
  while (gpuInfo.includes("<option value='")) {
    const row = extractValue(gpuInfo, "<option value='", ">");
    const gpu = {} as GPUData;
    gpu.gpu = true;
    gpu.id = row.substring(0, row.indexOf("'"));
    gpu.name = extractValue(
      extractValue(gpuInfo, "<option value='", "/option>"),
      ">",
      "<"
    );
    if (row.includes("selected")) {
      gpu.checked = true;
      gpu.position = gpuNo;
      if (gpuNo > 0 && vmObject.edit.pcis && vmObject.edit.pcis.length > 0) {
        vmObject.edit.pcis.forEach((device, index) => {
          if (device.id === gpu.id) {
            vmObject.edit.pcis.splice(index, 1);
            vmObject.edit.pcis.push(gpu);
          }
        });
      }
    }

    const gpuModel = extractValue(data, "<td>Graphics Card:</td>", "</table>");
    if (gpuModel.includes("<td>VNC Video Driver:</td>")) {
      gpu.model = extractReverseValue(
        extractValue(
          gpuModel,
          `<select name="gpu[${gpuNo}][model]"`,
          "selected>"
        ),
        "'",
        "value='"
      );
      gpu.keymap = extractReverseValue(
        extractValue(
          gpuModel,
          `<select name="gpu[${gpuNo}][keymap]"`,
          "selected>"
        ),
        "'",
        "value='"
      );
    }

    gpu.bios = extractReverseValue(
      extractValue(data, "<td>Graphics ROM BIOS:</td>", ' name="gpu['),
      '"',
      'value="'
    );

    if (gpuNo === 0) {
      vmObject.edit.pcis.push(gpu);
    }

    gpuInfo = gpuInfo.replace("<option value='", "");
  }
}

function extractGPUData(response: string, vmObject) {
  let gpuNo = 0;
  while (response.includes("<td>Graphics Card:</td>")) {
    const gpuInfo = extractValue(response, "<td>Graphics Card:</td>", "</td>");
    extractIndividualGPU(gpuInfo, gpuNo, vmObject, response);
    gpuNo++;
    response = response.replace("<td>Graphics Card:</td>", "");
  }
}

function extractSoundData(response: string, vmObject) {
  let soundInfo = extractValue(response, "<td>Sound Card:</td>", "</td>");
  while (soundInfo.includes("<option value='")) {
    const row = extractValue(soundInfo, "<option value='", ">");
    const soundCard = {} as SoundData;
    soundCard.sound = true;
    soundCard.name = extractValue(
      extractValue(soundInfo, "<option value='", "/option>"),
      ">",
      "<"
    );
    if (row.includes("selected")) {
      soundCard.checked = true;
    }
    soundCard.id = row.substring(0, row.indexOf("'"));
    vmObject.edit.pcis.push(soundCard);

    soundInfo = soundInfo.replace("<option value='", "");
  }
}

function extractNICInformation(data: string) {
  let nicInfo = extractValue(
    data,
    '<table data-category="Network" data-multiple="true"',
    "</table>"
  );
  const nicNo = 0;

  const nics: NicData[] = [];
  while (nicInfo.includes("<td>Network MAC:</td>")) {
    const nic = {} as NicData;
    nic.mac = extractValue(
      nicInfo,
      `name="nic[${nicNo}][mac]" class="narrow" value="`,
      '"'
    );
    nic.network = extractReverseValue(
      extractValue(nicInfo, `name="nic[${nicNo}][network]"`, "selected>"),
      "'",
      "value='"
    );
    nics.push(nic);

    nicInfo = nicInfo.replace("<td>Network MAC:</td>", "");
  }
  return nics;
}

function extractVMDetails(vmObject, data: string, ip: string) {
  vmObject.xml = extractValue(
    data,
    '<textarea id="addcode" name="xmldesc" placeholder="Copy &amp; Paste Domain XML Configuration Here." autofocus>',
    "</textarea>"
  )
    .split("&lt;")
    .join("<")
    .split("&gt;")
    .join(">");
  vmObject.edit = getVMStaticData(data);
  vmObject.edit.vcpus = extractCPUDetails(data);
  vmObject.edit.disks = extractDiskData(data);
  vmObject.edit.shares = extractShareData(data);
  vmObject.edit.usbs = extractUSBData(data, vmObject, ip);
  vmObject.edit.pcis = extractPCIData(data);

  extractGPUData(data, vmObject);

  extractSoundData(data, vmObject);

  vmObject.edit.nics = extractNICInformation(data);
  return vmObject;
}

export async function requestChange(
  ip: string,
  id: string,
  auth: string,
  vmObject,
  create
) {
  return axios({
    method: "POST",
    url: `${
      ip.includes("http") ? ip : `http://${ip}`
    }/plugins/dynamix.vm.manager/templates/Custom.form.php`,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest",
      Cookie: authCookies[ip] ? authCookies[ip] : ""
    },
    data: await buildForm(ip, auth, id, vmObject, create),
    httpAgent: new http.Agent({ keepAlive: true })
  })
    .then((response) => {
      callSucceeded(ip);
      return response.data;
    })
    .catch((e) => {
      logger.error(`Make Edit for ip: ${ip} Failed`);
      if (e.response?.status) {
        callFailed(ip, e.response.status);
      } else {
        callFailed(ip, 404);
      }
      logger.error(e.message);
    });
}

async function buildForm(
  ip: string,
  auth: string,
  id: string,
  vmObject,
  create
) {
  let form = getStaticPart(vmObject, id, create);
  form += `&csrf_token=${await getCSRFToken(ip, auth)}`;
  form = getCPUPart(vmObject, form);
  form = getDiskPart(vmObject, form);
  form = getSharePart(vmObject, form);
  form = getPCIPart(vmObject, form);
  form = getUSBPart(vmObject, form);
  form = getNetworkPart(vmObject, form);
  return form;
}

export function getStaticPart(vmObject, id: string, create: boolean) {
  return `template%5Bos%5D=${vmObject.template_os}template%5Bname%5D=${
    vmObject.template_name
  }template%5Bicon%5D=${vmObject.template_icon}&domain%5Bpersistent%5D=${
    vmObject.domain_persistent
  }&domain%5Btype%5D=${
    vmObject.domain_type
  }&domain%5Bautostart%5D=${1}&domain%5Buuid%5D=${id}&domain%5Bclock%5D=${
    vmObject.domain_clock
  }&domain%5Boldname%5D=${vmObject.domain_oldname}&domain%5Bname%5D=${
    vmObject.domain_name
  }&domain%5Barch%5D=${vmObject.domain_arch}&domain%5Bdesc%5D=${
    vmObject.domain_desc
  }&domain%5Bcpumode%5D=${vmObject.domain_cpumode}&domain%5Bovmf%5D=${
    vmObject.domain_ovmf
  }&domain%5Bmem%5D=${vmObject.domain_mem}&domain%5Bmaxmem%5D=${
    vmObject.domain_maxmem
  }&domain%5Bmachine%5D=${vmObject.domain_machine}&domain%5Bhyperv%5D=${
    vmObject.domain_hyperv
  }&domain%5Busbmode%5D=${vmObject.domain_usbmode}&media%5Bcdrom%5D=${
    vmObject.media_cdrom //todo is encodeURI needed for these 4?
  }&media%5Bcdrombus%5D=${vmObject.media_cdrombus}&media%5Bdrivers%5D=${
    vmObject.media_drivers
  }&media%5Bdriversbus%5D=${vmObject.media_driversbus}${
    create ? `&createvm=${1}` : `&updatevm=${1}`
  }&domain%5Bpassword%5D=`;
}

export function getCPUPart(vmObject, form) {
  if (vmObject.vcpus && vmObject.vcpus.length > 0) {
    vmObject.vcpus.forEach((cpu) => {
      form += `&domain%5Bvcpu%5D%5B%5D=${cpu}`;
    });
  }
  return form;
}

export function getDiskPart(vmObject, form) {
  if (vmObject.disks && vmObject.disks.length > 0) {
    vmObject.disks.forEach((disk, index) => {
      form += `&disk%5B${index}%5D%5Bimage%5D=${disk.image}`;
      form += `&disk%5B${index}%5D%5Bselect%5D=${disk.select}`;
      form += `&disk%5B${index}%5D%5Bsize%5D=${disk.size}`;
      form += `&disk%5B${index}%5D%5Bdriver%5D=${disk.driver}`;
      form += `&disk%5B${index}%5D%5Bbus%5D=${disk.bus}`;
    });
  }
  return form;
}

export function getSharePart(vmObject, form) {
  if (vmObject.shares && vmObject.shares.length > 0) {
    vmObject.shares.forEach((share, index) => {
      form += `&shares%5B${index}%5D%5Bsource%5D=${share.source}`;
      form += `&shares%5B${index}%5D%5Btarget%5D=${share.target}`;
    });
  }
  return form;
}

export function getPCIPart(vmObject, form) {
  let audioDevices = 0;
  let gpus = 0;
  if (vmObject.pcis && vmObject.pcis.length > 0) {
    vmObject.pcis.forEach((pciDevice) => {
      if (pciDevice.id === "vnc" || !pciDevice.id) {
        return;
      }

      if (pciDevice.gpu && pciDevice.checked) {
        form += `&gpu%5B${gpus}%5D%5Bid%5D=${encodeURI(pciDevice.id)}`;
        form += `&gpu%5B${gpus}%5D%5Bmodel%5D=${encodeURI("qxl")}`;
        form += `&gpu%5B${gpus}%5D%5Bkeymap%5D=${
          pciDevice.keymap ? encodeURI(pciDevice.keymap) : ""
        }`;
        form += `&gpu%5B${gpus}%5D%5Bbios%5D=${
          pciDevice.bios ? encodeURI(pciDevice.bios) : ""
        }`;
        gpus++;
      } else if (pciDevice.audio && pciDevice.checked) {
        form += `&audio%5B${audioDevices}%5D%5Bid%5D=${encodeURI(
          pciDevice.id
        )}`;
        audioDevices++;
      } else {
        form += `&pci%5B%5D=${encodeURI(pciDevice.id)}${
          pciDevice.checked ? "" : "%23remove"
        }`;
      }
    });
  }
  return form;
}

export function getUSBPart(vmObject, form) {
  if (vmObject.usbs && vmObject.usbs.length > 0) {
    vmObject.usbs.forEach((usbDevice) => {
      form += `&usb%5B%5D=${encodeURI(usbDevice.id)}${
        usbDevice.checked ? "" : "%23remove"
      }`;
    });
  }
  return form;
}

export function getNetworkPart(vmObject, form: string) {
  if (vmObject.nics && vmObject.nics.length > 0) {
    vmObject.nics.forEach((nicDevice, index) => {
      form += `&nic%5B${index}%5D%5Bmac%5D=${nicDevice.mac}`;
      form += `&nic%5B${index}%5D%5Bnetwork%5D=${nicDevice.network}`;
    });
  }
  return form;
}

export function removePCICheck(details, id: string) {
  details.pcis
    .filter((pciDevice) => pciDevice.id.split(".")[0] === id.split(".")[0])
    .map((device) => (device.checked = false));
}

export function addPCICheck(details, id: string) {
  details.pcis
    .filter((pciDevice) => pciDevice.id.split(".")[0] === id.split(".")[0])
    .map((device) => (device.checked = true));
}

export function flipPCICheck(details, id: string) {
  let check;
  details.pcis
    .filter((pciDevice) => pciDevice.id.split(".")[0] === id.split(".")[0])
    .map((device) => {
      device.checked = check ? check : !device.checked;
      if (!check) {
        check = device.checked;
      }
    });
}

const failed = {};

function callSucceeded(ip: string) {
  failed[ip] = 0;
}

function callFailed(ip: string, status: number) {
  if (!failed[ip]) {
    failed[ip] = 1;
  } else {
    failed[ip]++;
  }

  let threshold = 2;
  if (status === 503) {
    threshold = 5;
  }

  if (failed[ip] > threshold) {
    failed[ip] = 0;
    authCookies[ip] = undefined;
  }
}
