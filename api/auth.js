import crypto from "crypto";

const COOKIE_NAME = "gold_save_session";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

function createSignature(payload) {
  return crypto
    .createHmac(
      "sha256",
      process.env.GOLD_SAVE_SESSION_SECRET
    )
    .update(payload)
    .digest("base64url");
}

function createSession() {
  const payload = JSON.stringify({
    exp: Date.now() + SESSION_DURATION,
  });

  const encodedPayload = Buffer
    .from(payload)
    .toString("base64url");

  const signature = createSignature(
    encodedPayload
  );

  return `${encodedPayload}.${signature}`;
}

function verifySession(cookieHeader) {
  if (!cookieHeader) {
    return false;
  }

  const cookies = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim());

  const sessionCookie = cookies.find(
    (cookie) =>
      cookie.startsWith(`${COOKIE_NAME}=`)
  );

  if (!sessionCookie) {
    return false;
  }

  const token = sessionCookie.substring(
    COOKIE_NAME.length + 1
  );

  const parts = token.split(".");

  if (parts.length !== 2) {
    return false;
  }

  const [encodedPayload, signature] = parts;

  const expectedSignature =
    createSignature(encodedPayload);

  try {
    const signatureBuffer =
      Buffer.from(signature);

    const expectedBuffer =
      Buffer.from(expectedSignature);

    if (
      signatureBuffer.length !==
      expectedBuffer.length
    ) {
      return false;
    }

    if (
      !crypto.timingSafeEqual(
        signatureBuffer,
        expectedBuffer
      )
    ) {
      return false;
    }

    const payload = JSON.parse(
      Buffer.from(
        encodedPayload,
        "base64url"
      ).toString("utf8")
    );

    if (!payload.exp) {
      return false;
    }

    if (Date.now() >= payload.exp) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function safeCompare(value1, value2) {
  if (
    typeof value1 !== "string" ||
    typeof value2 !== "string"
  ) {
    return false;
  }

  const hash1 = crypto
    .createHash("sha256")
    .update(value1)
    .digest();

  const hash2 = crypto
    .createHash("sha256")
    .update(value2)
    .digest();

  return crypto.timingSafeEqual(
    hash1,
    hash2
  );
}

export default async function handler(
  request,
  response
) {
  const username =
    process.env.GOLD_SAVE_USERNAME;

  const password =
    process.env.GOLD_SAVE_PASSWORD;

  const sessionSecret =
    process.env.GOLD_SAVE_SESSION_SECRET;

  if (
    !username ||
    !password ||
    !sessionSecret
  ) {
    return response.status(500).json({
      success: false,
      message:
        "Konfigurasi login belum lengkap.",
    });
  }

  // =========================
  // CEK STATUS LOGIN
  // GET /api/auth
  // =========================
  if (request.method === "GET") {
    const authenticated = verifySession(
      request.headers.cookie
    );

    return response.status(200).json({
      success: true,
      authenticated,
    });
  }

  // =========================
  // LOGIN
  // POST /api/auth
  // =========================
  if (request.method === "POST") {
    try {
      const {
        username: inputUsername,
        password: inputPassword,
      } = request.body || {};

      const validUsername =
        safeCompare(
          inputUsername,
          username
        );

      const validPassword =
        safeCompare(
          inputPassword,
          password
        );

      if (
        !validUsername ||
        !validPassword
      ) {
        return response.status(401).json({
          success: false,
          message:
            "Username atau password salah.",
        });
      }

      const session = createSession();

      response.setHeader(
        "Set-Cookie",
        `${COOKIE_NAME}=${session}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${
          SESSION_DURATION / 1000
        }`
      );

      return response.status(200).json({
        success: true,
        authenticated: true,
      });
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      return response.status(500).json({
        success: false,
        message:
          "Terjadi kesalahan saat login.",
      });
    }
  }

  // =========================
  // LOGOUT
  // DELETE /api/auth
  // =========================
  if (request.method === "DELETE") {
    response.setHeader(
      "Set-Cookie",
      `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
    );

    return response.status(200).json({
      success: true,
      authenticated: false,
    });
  }

  return response.status(405).json({
    success: false,
    message: "Method tidak diizinkan.",
  });
}
