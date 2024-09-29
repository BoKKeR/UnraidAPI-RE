const extractCsrfToken = (data: string) => {
  let csrf_token;

  const regex = /csrf_token:'[A-Za-z0-9]+'/gim;
  const csrf_token_array = data?.match(regex);
  if (csrf_token_array?.length) {
    csrf_token = csrf_token_array[0]
      ?.replace("csrf_token:", "")
      .replaceAll("'", "");
  }

  // used for 7.0.0 where the csrf token are as var csrf_token = "F3DFF42AABBC7746";'
  if (!csrf_token) {
    const regex700 = /var csrf_token\s*=\s*"([0-9A-Fa-f]{14,16})"/;
    const match = data.match(regex700);
    if (match) {
      csrf_token = match[1];
    }
  }

  return csrf_token;
};

export default extractCsrfToken;
