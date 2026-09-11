"use client";
import { useEffect, useState } from "react";
import { api } from "@/components/shop-context";
export default function Reset() {
  const [token, setToken] = useState(""),
    [done, setDone] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const h = new URLSearchParams(location.hash.slice(1));
    if (h.get("type") === "recovery") setToken(h.get("access_token") || "");
    history.replaceState(null, "", location.pathname);
  }, []);
  return (
    <main className="section" style={{ maxWidth: 600 }}>
      <a className="brand" href="/">
        alma & tierra
      </a>
      <h1>Vuelve a tu espacio</h1>
      {done ? (
        <>
          <p>Tu contraseña fue actualizada.</p>
          <a href="/mi-cuenta" className="button">
            Iniciar sesión
          </a>
        </>
      ) : (
        <form
          className="form-card"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await api("/api/auth/reset", {
                token,
                password: new FormData(e.currentTarget).get("password"),
              });
              setDone(true);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Nueva contraseña
            <input
              name="password"
              type="password"
              minLength={8}
              maxLength={128}
              required
              autoComplete="new-password"
            />
          </label>
          {!token && (
            <p>
              Abre el enlace de recuperación enviado a tu correo. Si ya venció,
              solicita otro desde Mi cuenta.
            </p>
          )}
          {error && <p role="alert">{error}</p>}
          <button className="button" disabled={!token || busy}>
            Actualizar contraseña
          </button>
        </form>
      )}
    </main>
  );
}
