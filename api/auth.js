export default async function handler(request, response) {
  const BIN_ID = process.env.JSONBIN_BIN_ID;
  const ACCESS_KEY = process.env.JSONBIN_ACCESS_KEY;

  if (!BIN_ID || !ACCESS_KEY) {
    return response.status(500).json({
      success: false,
      step: "environment",
      message: "Environment variable JSONBin belum tersedia",
      hasBinId: !!BIN_ID,
      hasAccessKey: !!ACCESS_KEY,
    });
  }

  try {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 8000);

    const jsonbinResponse = await fetch(
      `https://api.jsonbin.io/v3/b/${BIN_ID}/latest`,
      {
        method: "GET",
        headers: {
          "X-Access-Key": ACCESS_KEY,
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    const text = await jsonbinResponse.text();

    return response.status(200).json({
      success: jsonbinResponse.ok,
      step: "jsonbin",
      status: jsonbinResponse.status,
      response: text.substring(0, 500),
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      step: "jsonbin",
      errorName: error?.name || "UnknownError",
      errorMessage: error?.message || "Unknown error",
    });
  }
}
