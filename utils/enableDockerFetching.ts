export const enableDockerFetching = (data: Buffer) => {
  const stringData = data.toString();
  return stringData.includes("initab('/Docker'");
};
