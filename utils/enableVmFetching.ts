export const enableVmFetching = (data: Buffer) => {
  const stringData = data.toString();
  return stringData.includes("initab('/VMs'");
};
