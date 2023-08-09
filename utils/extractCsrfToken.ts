const extractCsrfToken = (data: string) => {
  const regex = /csrf_token:'[A-Za-z0-9]+'/gim;
  //@ts-ignore
  const csrf_token = data
    ?.match(regex)[0]
    ?.replace("csrf_token:", "")
    .replaceAll("'", "");
  return csrf_token;
};

export default extractCsrfToken;
