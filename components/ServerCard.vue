<template xmlns:v-slot="http://www.w3.org/1999/XSL/Transform">
  <v-flex xs12 sm6 md4>
    <v-card>
      <v-card-title class="headline">
        {{ server.serverDetails ? server.serverDetails.title : "Server" }}
      </v-card-title>
      <v-expansion-panel>
        <v-expansion-panel-content v-if="server.vm">
          <template v-slot:header>
            Details
          </template>
          <v-btn
            v-if="
              server.serverDetails.arrayStatus &&
                !server.serverDetails.arrayStatus.includes('Started')
            "
            :disabled="server.isBusy"
            color="success"
            fab
            small
            dark
            @click="startArray()"
          >
            Start Array
          </v-btn>
          <v-btn
            v-if="
              server.serverDetails.arrayStatus &&
                server.serverDetails.arrayStatus.includes('Started')
            "
            :disabled="server.isBusy"
            color="error"
            fab
            small
            dark
            @click="stopArray()"
          >
            Stop Array
          </v-btn>
          <v-chip>IP: {{ ip }}</v-chip>
          <v-chip v-for="(detail, key) in server.serverDetails" :key="key">
            {{ key.charAt(0).toUpperCase() + key.slice(1) }}: {{ detail }}
          </v-chip>
        </v-expansion-panel-content>
        <v-expansion-panel-content v-if="server.vm">
          <template v-slot:header>
            VMs:
          </template>
          <v-expansion-panel>
            <v-expansion-panel-content
              v-for="vm in server.vm.details"
              :key="vm.id"
              style="display: inline-block;"
            >
              <template v-slot:header>
                <div style="width: 50%;">
                  {{ vm.name }}
                  <div>
                    <v-btn
                      v-if="vm.status !== 'started'"
                      :disabled="vm.isBusy"
                      color="success"
                      fab
                      small
                      dark
                      @click="startVM(vm)"
                    >
                      <v-icon style="font-size: 28px;">
                        play_circle_outline
                      </v-icon>
                    </v-btn>
                    <v-btn
                      v-if="vm.status === 'started'"
                      :disabled="vm.isBusy"
                      color="info"
                      fab
                      small
                      dark
                      @click="pauseVM(vm)"
                    >
                      <v-icon style="font-size: 28px;">
                        pause_circle_outline
                      </v-icon>
                    </v-btn>
                    <v-btn
                      v-if="vm.status === 'started'"
                      :disabled="vm.isBusy"
                      color="warning"
                      fab
                      small
                      dark
                      @click="restartVM(vm)"
                    >
                      <v-icon style="font-size: 28px;">
                        autorenew
                      </v-icon>
                    </v-btn>
                    <v-btn
                      v-if="vm.status !== 'stopped'"
                      :disabled="vm.isBusy"
                      color="error"
                      fab
                      small
                      dark
                      @click="stopVM(vm)"
                    >
                      <v-icon style="font-size: 28px;">
                        stop
                      </v-icon>
                    </v-btn>
                    <v-btn
                      v-if="vm.status !== 'stopped'"
                      :disabled="vm.isBusy"
                      color="black"
                      fab
                      small
                      dark
                      @click="forceStopVM(vm)"
                    >
                      <v-icon style="font-size: 28px;">
                        cancel
                      </v-icon>
                    </v-btn>
                  </div>
                </div>
                <v-chip
                  :class="{
                    success: vm.status === 'started',
                    error: vm.status === 'stopped',
                    warning: vm.status === 'paused'
                  }"
                  style="width: 20px;"
                  right
                  justify-center
                >
                  <v-progress-circular
                    v-if="vm.isBusy"
                    indeterminate
                    style="width: 20px;"
                  />
                  <div v-if="!vm.isBusy">
                    {{ vm.status }}
                  </div>
                </v-chip>
              </template>
              <img class="left" :src="vm.icon" />
              <edit-vm-card :vm="vm" />
              <v-btn color="info" dark v-on:click="downloadXML(vm)">
                XML
              </v-btn>
              <v-chip>{{ vm.id }}</v-chip>
              <v-chip>Cores: {{ vm.coreCount }}</v-chip>
              <v-chip>RAM: {{ vm.ramAllocation }}</v-chip>
              <v-chip>HDD: {{ vm.hddAllocation.total }}</v-chip>
              <v-chip>Primary GPU: {{ vm.primaryGPU }}</v-chip>
              <v-expansion-panel>
                Disks:
                <v-expansion-panel-content
                  v-for="(row, rowIndex) in vm.hddAllocation.all"
                  :key="rowIndex"
                >
                  <template v-slot:header>
                    <div>{{ rowIndex }}</div>
                  </template>
                  <v-chip v-for="(detail, name) in row" :key="name">
                    {{ name }}: {{ detail }}
                  </v-chip>
                  <br />
                </v-expansion-panel-content>
                <v-expansion-panel-content v-if="vm.edit">
                  <template v-slot:header>
                    USBs:
                  </template>
                  <div v-for="usb in vm.edit.usbs" :key="usb.id">
                    <usb-detail
                      v-if="usb.checked"
                      :id="vm.id"
                      :detail="usb"
                      :server="server"
                      :ip="ip"
                      :check-for-server-password="checkForServerPassword"
                      :reattachable="true"
                      :detachable="true"
                    />
                  </div>
                </v-expansion-panel-content>
                <v-expansion-panel-content v-if="vm.edit">
                  <template v-slot:header>
                    PCI Devices
                  </template>
                  <v-expansion-panel>
                    <v-expansion-panel-content v-if="vm.edit.pcis">
                      <template v-slot:header>
                        GPUs
                      </template>
                      <div v-for="(detail, key) in vm.edit.pcis" :key="key">
                        <usb-detail
                          v-if="detail.gpu && detail.checked"
                          :id="vm.id"
                          :detail="detail"
                          :server="server"
                          :ip="ip"
                          :pci="true"
                          :check-for-server-password="checkForServerPassword"
                          :detachable="true"
                        />
                      </div>
                    </v-expansion-panel-content>
                    <v-expansion-panel-content v-if="vm.edit.pcis">
                      <template v-slot:header>
                        Sound
                      </template>
                      <div v-for="(detail, key) in vm.edit.pcis" :key="key">
                        <usb-detail
                          v-if="detail.sound && detail.checked"
                          :id="vm.id"
                          :detail="detail"
                          :server="server"
                          :ip="ip"
                          :pci="true"
                          :check-for-server-password="checkForServerPassword"
                          :detachable="true"
                        />
                      </div>
                    </v-expansion-panel-content>
                    <v-expansion-panel-content v-if="vm.edit.pcis">
                      <template v-slot:header>
                        Other
                      </template>
                      <div v-for="(detail, key) in vm.edit.pcis" :key="key">
                        <usb-detail
                          v-if="!detail.sound && !detail.gpu && detail.checked"
                          :id="vm.id"
                          :detail="detail"
                          :server="server"
                          :ip="ip"
                          :pci="true"
                          :check-for-server-password="checkForServerPassword"
                          :detachable="true"
                        />
                      </div>
                    </v-expansion-panel-content>
                  </v-expansion-panel>
                </v-expansion-panel-content>
              </v-expansion-panel>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panel-content>
        <v-expansion-panel-content v-if="server.usbDetails">
          <template v-slot:header>
            USBs
          </template>
          <div v-for="(detail, key) in server.usbDetails" :key="key">
            <usb-detail
              :detail="detail"
              :server="server"
              :ip="ip"
              :check-for-server-password="checkForServerPassword"
            />
          </div>
        </v-expansion-panel-content>
        <v-expansion-panel-content v-if="server.pciDetails">
          <template v-slot:header>
            PCI Devices
          </template>
          <v-expansion-panel>
            <v-expansion-panel-content v-if="server.pciDetails">
              <template v-slot:header>
                GPUs
              </template>
              <div v-for="(detail, key) in server.pciDetails" :key="key">
                <usb-detail
                  v-if="detail.gpu"
                  :detail="detail"
                  :server="server"
                  :ip="ip"
                  :pci="true"
                  :check-for-server-password="checkForServerPassword"
                />
              </div>
            </v-expansion-panel-content>
            <v-expansion-panel-content v-if="server.pciDetails">
              <template v-slot:header>
                Sound
              </template>
              <div v-for="(detail, key) in server.pciDetails" :key="key">
                <usb-detail
                  v-if="detail.sound"
                  :detail="detail"
                  :server="server"
                  :ip="ip"
                  :pci="true"
                  :check-for-server-password="checkForServerPassword"
                />
              </div>
            </v-expansion-panel-content>
            <v-expansion-panel-content v-if="server.pciDetails">
              <template v-slot:header>
                Other
              </template>
              <div v-for="(detail, key) in server.pciDetails" :key="key">
                <usb-detail
                  v-if="!detail.sound && !detail.gpu"
                  :detail="detail"
                  :server="server"
                  :ip="ip"
                  :pci="true"
                  :check-for-server-password="checkForServerPassword"
                />
              </div>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panel-content>
        <v-expansion-panel-content v-if="server.docker">
          <template v-slot:header>
            Dockers
          </template>
          <v-expansion-panel>
            <v-expansion-panel-content
              v-for="docker in server.docker.details.containers"
              :key="docker.containerId"
              style="display: inline-block;"
              ><template v-slot:header>
                <div style="width: 50%;">
                  {{ docker.name }}
                  <div>
                    <v-btn
                      v-if="docker.status !== 'started'"
                      :disabled="docker.isBusy"
                      color="success"
                      fab
                      small
                      dark
                      @click="startDocker(docker)"
                    >
                      <v-icon style="font-size: 28px;">
                        play_circle_outline
                      </v-icon>
                    </v-btn>
                    <v-btn
                      v-if="docker.status === 'started'"
                      :disabled="docker.isBusy"
                      color="info"
                      fab
                      small
                      dark
                      @click="pauseDocker(docker)"
                    >
                      <v-icon style="font-size: 28px;">
                        pause_circle_outline
                      </v-icon>
                    </v-btn>
                    <v-btn
                      v-if="docker.status === 'started'"
                      :disabled="docker.isBusy"
                      color="warning"
                      fab
                      small
                      dark
                      @click="restartDocker(docker)"
                    >
                      <v-icon style="font-size: 28px;">
                        autorenew
                      </v-icon>
                    </v-btn>
                    <v-btn
                      v-if="docker.status !== 'stopped'"
                      :disabled="docker.isBusy"
                      color="error"
                      fab
                      small
                      dark
                      @click="stopDocker(docker)"
                    >
                      <v-icon style="font-size: 28px;">
                        stop
                      </v-icon>
                    </v-btn>
                  </div>
                </div>
                <v-chip
                  :class="{
                    success: docker.status === 'started',
                    error: docker.status === 'stopped',
                    warning: docker.status === 'paused'
                  }"
                  style="width: 20px;"
                  right
                  justify-center
                >
                  <v-progress-circular
                    v-if="docker.isBusy"
                    indeterminate
                    style="width: 20px;"
                  />
                  <div v-if="!docker.isBusy">
                    {{ docker.status }}
                  </div>
                </v-chip>
              </template>
              <v-chip>Container ID: {{ docker.containerId }}</v-chip>
              <v-chip>Tag: {{ docker.tag }}</v-chip>
              <v-chip>Up to date: {{ docker.uptoDate }}</v-chip>
              <img class="left" :src="docker.imageUrl" />
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panel-content>
        <v-expansion-panel-content v-if="server.vm">
          <template v-slot:header>
            Utils
          </template>
          <gpu-swap
            :server="server"
            :ip="ip"
            :check-for-server-password="checkForServerPassword"
          />
        </v-expansion-panel-content>
        <v-expansion-panel-content v-if="false">
          <template v-slot:header>
            Terminal
          </template>
          <iframe
            style="width: 100%;"
            height="500px"
            :src="'http://' + ip + '/webterminal/'"
          />
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-card>
  </v-flex>
</template>

<script>
import axios from "axios";
import EditVmCard from "./EditVmCard";
import UsbDetail from "./UsbDetail";
import GpuSwap from "./GpuSwap";

export default {
  name: "ServerCardVue",
  components: {
    GpuSwap,
    EditVmCard,
    UsbDetail
  },
  props: ["server", "ip", "checkForServerPassword"],
  methods: {
    startArray() {
      this.changeArrayStatus("start");
    },
    stopArray() {
      this.changeArrayStatus("stop");
    },
    async changeArrayStatus(action) {
      let auth = await this.checkForServerPassword(this.ip);
      this.server.isBusy = true;
      axios({
        method: "post",
        url: "api/arrayStatus",
        data: {
          action: action,
          server: this.ip,
          auth
        }
      }).then((response) => {
        if (response) {
          this.server.isBusy = false;
          if (
            response.data &&
            response.data.message &&
            response.data.message.success
          ) {
            this.server.arrayStatus = response.data.message.state;
          } else if (
            response &&
            response.data &&
            response.data.message &&
            response.data.message.error
          ) {
            alert(response.data.message.error);
          }
        }
      });
    },
    startVM(vm) {
      if (vm.status === "paused" || vm.status === "pmsuspended") {
        this.changeVMStatus(vm, "domain-resume");
      } else {
        this.changeVMStatus(vm, "domain-start");
      }
    },
    restartVM(vm) {
      this.changeVMStatus(vm, "domain-restart");
    },
    pauseVM(vm) {
      this.changeVMStatus(vm, "domain-pause");
    },
    stopVM(vm) {
      this.changeVMStatus(vm, "domain-stop");
    },
    forceStopVM(vm) {
      this.changeVMStatus(vm, "domain-destroy");
    },
    async changeVMStatus(vm, action) {
      let auth = await this.checkForServerPassword(this.ip);
      this.server.vm.details[vm.id].isBusy = true;
      axios({
        method: "post",
        url: "api/vmStatus",
        data: {
          id: vm.id,
          action: action,
          server: this.ip,
          auth
        }
      }).then((response) => {
        if (response) {
          this.server.vm.details[vm.id].isBusy = false;
          if (
            response.data &&
            response.data.message &&
            response.data.message.success
          ) {
            this.server.vm.details[vm.id].status = response.data.message.state;
          } else if (
            response &&
            response.data &&
            response.data.message &&
            response.data.message.error
          ) {
            if (
              response.data.message.error ===
              "Requested operation is not valid: domain is not running"
            ) {
              this.server.vm.details[vm.id].status = "stopped";
            }
            alert(response.data.message.error);
          }
        }
      });
    },
    startDocker(docker) {
      if (docker.status === "paused") {
        this.changeDockerStatus(docker, "domain-resume");
      } else {
        this.changeDockerStatus(docker, "domain-start");
      }
    },
    restartDocker(docker) {
      this.changeDockerStatus(docker, "domain-restart");
    },
    pauseDocker(docker) {
      this.changeDockerStatus(docker, "domain-pause");
    },
    stopDocker(docker) {
      this.changeDockerStatus(docker, "domain-stop");
    },
    async changeDockerStatus(docker, action) {
      let auth = await this.checkForServerPassword(this.ip);
      this.server.docker.details.containers[docker.containerId].isBusy = true;
      axios({
        method: "post",
        url: "api/dockerStatus",
        data: {
          id: docker.containerId,
          action: action,
          server: this.ip,
          auth
        }
      }).then((response) => {
        if (response) {
          this.server.docker.details.containers[
            docker.containerId
          ].isBusy = false;
          if (
            response.data &&
            response.data.message &&
            response.data.includes("success")
          ) {
            if (action.includes("pause")) {
              this.server.docker.details.containers[docker.containerId].status =
                "paused";
            } else if (action.includes("stop")) {
              this.server.docker.details.containers[docker.containerId].status =
                "stopped";
            } else {
              this.server.docker.details.containers[docker.containerId].status =
                "started";
            }
          } else if (
            response &&
            response.data &&
            response.data.message &&
            response.data.message.error
          ) {
            if (
              response.data.message.error ===
              "Requested operation is not valid: domain is not running"
            ) {
              this.server.docker.details.containers[docker.containerId].status =
                "stopped";
            }
            alert(response.data.message.error);
          }
        }
      });
    },
    downloadXML(vm) {
      this.download(`${vm.name}.xml`, vm.xml);
    },
    download(filename, text) {
      var element = document.createElement("a");
      element.setAttribute(
        "href",
        `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`
      );
      element.setAttribute("download", filename);

      element.style.display = "none";
      document.body.appendChild(element);

      element.click();

      document.body.removeChild(element);
    }
  }
};
</script>

<style lang="css" scoped>
img {
  width: 50px;
  height: 50px;
}
</style>
