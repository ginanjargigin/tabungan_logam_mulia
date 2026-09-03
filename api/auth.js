export default async function handler() {
  const started = Date.now();

  const BIN_ID = process.env.JSONBIN_BIN_ID;
  const ACCESS_KEY = process.env.JSONBIN_ACCESS_KEY;

  if (!BIN_ID) {
    return new Response(
      JSON.stringify({
        success: false,
        step: "environment",
        message: "JSONBIN_BIN_ID tidak tersedia",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  if (!ACCESS_KEY) {
    return new Response(
      JSON.stringify({
        success: false,
        step: "environment",
        message: "JSONBIN_ACCESS_KEY tidak tersedia",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  try {
    const response = await fetch(
      `https://api.jsonbin.io/v3/b/${BIN_ID}/latest`,
      {
        method: "GET",
        headers: {
          "X-Access-Key": ACCESS_KEY,
        },
        signal: AbortSignal.timeout(8000),
      }
    );

    const text = await response.text();

    return new Response(
      JSON.stringify({
        success: response.ok,
        step: "jsonbin",
        status: response.status,
        response: text.substring(0, 500),
        durationMs: Date.now() - started,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        step: "jsonbin",
        errorName: error?.name || "UnknownError",
        errorMessage: error?.message || "Unknown error",
        durationMs: Date.now() - started,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
