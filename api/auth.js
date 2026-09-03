export default async function handler() {
  return new Response(
    JSON.stringify({
      success: true,
      message: "Gold Save API berhasil berjalan",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
