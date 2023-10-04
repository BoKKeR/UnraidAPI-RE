function sanitise(string: string) {
  if (!string) {
    return "";
  }
  return string
    .toLowerCase()
    .split(" ")
    .join("_")
    .split(".")
    .join("")
    .split("(")
    .join("")
    .split(")")
    .join("")
    .split(":")
    .join("_")
    .trim();
}

export default sanitise;
