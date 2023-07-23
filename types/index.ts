export type Disk = {
  select: string;
  image: string;
  driver: string;
  bus: string;
  size: string;
};

export type ShareData = {
  source: string;
  target: string;
};

export type UsbData = {
  id: string;
  name: string;
  connected: boolean;
  checked?: boolean;
};

export type PCIData = {
  name: string;
  checked: boolean;
  id: string;
};

export type GPUData = {
  gpu: boolean;
  id: string;
  name: string;
  checked: boolean;
  position: number;
  model?: string;
  keymap?: string;
  bios: string;
};

export type VMData = {
  name: string;
  id: string;
  status: string;
  icon: string;
  coreCount: string;
  ramAllocation: string;
  hddAllocation: HDDAllocationInfo;
  primaryGPU: string;
};

export type HDDAllocationInfo = {
  all: any;
  total: string;
};

export type HDD = {
  path: string;
  interface: string;
  allocated: string;
  used: string;
};

export type Docker = {
  imageUrl: string;
  name: string;
  status: string;
  containerId: string;
  tag: string;
  uptoDate: string;
  imageId: string;
  created: string;
};

export type SoundData = {
  sound: boolean;
  name: string;
  id: string;
  checked: boolean;
};

export type NicData = {
  mac: string;
  network: string;
};
