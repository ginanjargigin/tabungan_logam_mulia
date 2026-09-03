const BIN_ID = process.env.JSONBIN_BIN_ID;
const ACCESS_KEY = process.env.JSONBIN_ACCESS_KEY;

export default async function handler(request) {
  if (request.method !== "GET") {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Method tidak diizinkan",
      }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  if (!BIN_ID || !ACCESS_KEY) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "JSONBin environment variable belum tersedia",
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
        headers: {
          "X-Access-Key": ACCESS_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `JSONBin error: ${response.status}`
      );
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: "API Gold Save berhasil terhubung ke JSONBin",
        hasData: !!result.record,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error(error);

    return new Response(
      JSON.stringify({
        success: false,
        message: "Gagal mengakses JSONBin",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
