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
  gpu?: boolean;
  id: string;
  name: string;
  checked: boolean;
  position?: number;
  bios?: string;
  sound?: boolean;
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

export type DockerDetail = {
  imageUrl: string;
  name: string;
  status: string;
  containerId: string;
  tag: string;
  uptoDate: string;
  imageId: string;
  created: string;
  details: {
    containers: {
      [key: string]: ContainerDetail;
    };
    images: {
      [key: string]: ImageDetail;
    };
  };
};

export type ContainerStatus = "started" | "stopped";

export type ContainerDetail = {
  imageUrl: string;
  name: string;
  status: ContainerStatus;
  containerId: string;
  tag: string;
};

/* imageUrl: '/webGui/images/disk.png',
imageId: '9c5683ec06a8',
created: 'Created 2 months ago' */
export type ImageDetail = {
  imageUrl: string;
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
