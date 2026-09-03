export default async function handler() {
  const BIN_ID = process.env.JSONBIN_BIN_ID;
  const ACCESS_KEY = process.env.JSONBIN_ACCESS_KEY;

  if (!BIN_ID || !ACCESS_KEY) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Environment variable JSONBin belum tersedia",
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
        signal: AbortSignal.timeout(10000),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Gagal membaca JSONBin",
          status: response.status,
        }),
        {
          status: response.status,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Vercel berhasil terhubung ke JSONBin",
        hasData: !!result.record,
        dataKeys: result.record
          ? Object.keys(result.record)
          : [],
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("JSONBin error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: "Tidak dapat terhubung ke JSONBin",
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
