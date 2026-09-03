import { useEffect, useState } from "react";

const MODE_KEY = "gold-save-mode";

export default function LoginGate({ children }) {
  const [mode, setMode] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedMode = sessionStorage.getItem(MODE_KEY);

    if (savedMode === "guest") {
      setMode("guest");
      setLoading(false);
      return;
    }

    checkLogin();
  }, []);

  async function checkLogin() {
    try {
      const response = await fetch("/api/auth", {
        method: "GET",
        credentials: "include",
      });

      const result = await response.json();

      if (result.authenticated) {
        sessionStorage.setItem(MODE_KEY, "full");
        setMode("full");
      }
    } catch (error) {
      console.error("Gagal mengecek login:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();

    setError("");
    setLoginLoading(true);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(
          result.message ||
            "Username atau password salah."
        );
        return;
      }

      sessionStorage.setItem(MODE_KEY, "full");
      setMode("full");

      setUsername("");
      setPassword("");
    } catch (error) {
      console.error("Login error:", error);

      setError(
        "Tidak dapat terhubung ke server."
      );
    } finally {
      setLoginLoading(false);
    }
  }

  function handleGuest() {
    sessionStorage.setItem(MODE_KEY, "guest");

    setMode("guest");
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Memeriksa sesi...
      </div>
    );
  }

  if (mode === "full" || mode === "guest") {
    return children;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "#f5f7fa",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          background: "#ffffff",
          padding: "32px",
          borderRadius: "16px",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "28px",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "28px",
            }}
          >
            Gold Save
          </h1>

          <p
            style={{
              marginTop: "8px",
              color: "#666",
            }}
          >
            Sistem Tabungan Logam Mulia
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: "600",
              }}
            >
              Username
            </label>

            <input
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              autoComplete="username"
              required
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "16px",
              }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: "600",
              }}
            >
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              autoComplete="current-password"
              required
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "16px",
              }}
            />
          </div>

          {error && (
            <div
              style={{
                marginBottom: "16px",
                padding: "10px",
                borderRadius: "8px",
                background: "#fee2e2",
                color: "#b91c1c",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loginLoading}
            style={{
              width: "100%",
              padding: "12px",
              border: "none",
              borderRadius: "8px",
              background: "#111827",
              color: "#ffffff",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            {loginLoading
              ? "Memproses..."
              : "MASUK"}
          </button>
        </form>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            margin: "24px 0",
            color: "#999",
          }}
        >
          <div
            style={{
              flex: 1,
              height: "1px",
              background: "#ddd",
            }}
          />

          <span>atau</span>

          <div
            style={{
              flex: 1,
              height: "1px",
              background: "#ddd",
            }}
          />
        </div>

        <button
          type="button"
          onClick={handleGuest}
          style={{
            width: "100%",
            padding: "12px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            background: "#ffffff",
            color: "#333",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          👤 MASUK SEBAGAI GUEST
        </button>

        <p
          style={{
            marginTop: "16px",
            marginBottom: 0,
            textAlign: "center",
            fontSize: "13px",
            color: "#777",
          }}
        >
          Guest hanya dapat melihat mode demo.
        </p>
      </div>
    </div>
  );
}
