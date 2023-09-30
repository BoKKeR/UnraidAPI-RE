import { Disk, Docker, PCIData, UsbData } from ".";

export type DockerAction = "domain-start" | "domain-restart" | "domain-stop";

export interface RootServerJSONConfig {
  [key: string]: ServerJSONConfig;
}

export interface ServerJSONConfig {
  docker?: Docker;
  serverDetails: ServerDetails;
  vm?: Vm;
  pciDetails?: PCIData[];
  status: string;
  usbDetails?: any[];
}

export interface DockerObject {
  details: Details;
}

export interface Details {
  images: DockerImages;
  containers: Containers;
}

export interface DockerImages {
  [key: string]: DockerImage;
}

export interface DockerImage {
  imageUrl: string;
  imageId: string;
  created: string;
}

export type Containers = {
  [key: string]: Docker;
};

export interface ServerDetails {
  arrayStatus: string;
  arrayProtection: string;
  moverRunning: boolean;
  parityCheckRunning: boolean;
  title: string;
  cpu: string;
  memory: string;
  motherboard: string;
  diskSpace: string;
  cacheSpace: string;
  version: string;
  arrayUsedSpace: string;
  arrayTotalSpace: string;
  arrayFreeSpace: string;
  cacheUsedSpace: string;
  cacheTotalSpace: string;
  cacheFreeSpace: string;
  on: boolean;

  vmEnabled?: boolean;
  dockerEnabled?: boolean;
}

export interface Vm {
  extras: string;
  details: VmDetails;
}

export interface VmDetails {
  [key: string]: VmDetail; // probably same as VMData
}

export interface VmDetail {
  name: string;
  id: string;
  status: string;
  icon: string;
  coreCount: string;
  ramAllocation: string;
  hddAllocation: HddAllocation;
  primaryGPU: string;
  xml: string;
  edit: Edit;
}

export interface HddAllocation {
  all: All[];
  total: string;
}

export interface All {
  path: string;
  interface: string;
}

export interface Edit {
  template_os: string;
  domain_type: string;
  template_name: string;
  template_icon: string;
  domain_persistent: string;
  domain_clock: string;
  domain_arch: string;
  domain_oldname: string;
  domain_name: string;
  domain_desc: string;
  domain_cpumode: string;
  domain_mem: string;
  domain_maxmem: string;
  domain_machine: string;
  domain_hyperv: string;
  domain_usbmode: string;
  domain_ovmf: string;
  media_cdrom: string;
  media_cdrombus: string;
  media_drivers: string;
  media_driversbus: string;
  gpu_bios: string;
  nic_0_mac: string;
  vcpus: string[];
  disks: Disk[];
  shares: any[];
  usbs: UsbData[];
  pcis: Pci[];
  nics: Nic[];
}

export interface Pci {
  gpu?: boolean;
  id: string;
  name: string;
  checked: boolean;
  position?: number;
  bios?: string;
  sound?: boolean;
}

export interface Nic {
  mac: string;
  network: string;
}
