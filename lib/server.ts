export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function config() {
  const e = process.env as Record<string, string | undefined>;
  return {
    url: e.SUPABASE_URL || "",
    anon: e.SUPABASE_ANON_KEY || "",
    service: e.SUPABASE_SERVICE_ROLE_KEY || "",
    paypalId: e.PAYPAL_CLIENT_ID || "",
    paypalSecret: e.PAYPAL_CLIENT_SECRET || "",
    webhook: e.PAYPAL_WEBHOOK_ID || "",
    merchant: e.PAYPAL_MERCHANT_ID || "",
    origin: e.APP_ORIGIN || "",
    shipping: Number(e.SHIPPING_FLAT_CENTS || 0),
    live: e.PAYPAL_ENV === "live",
    enabled: e.COMMERCE_ENABLED === "true",
    cron: e.CRON_SECRET || "",
  };
}
export function connected() {
  const c = config();
  return !!(c.url && c.anon && c.service);
}
export function payable() {
  const c = config();
  return (
    connected() &&
    c.enabled &&
    !!(c.paypalId && c.paypalSecret && c.webhook && c.merchant && c.origin) &&
    Number.isSafeInteger(c.shipping) &&
    c.shipping >= 0
  );
}
export async function db(path: string, init: RequestInit = {}) {
  const c = config();
  if (!connected())
    throw new HttpError(503, "La tienda aún no está conectada.");
  const res = await fetch(c.url + "/rest/v1/" + path, {
    ...init,
    headers: {
      apikey: c.service,
      Authorization: "Bearer " + c.service,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...init.headers,
    },
  });
  if (!res.ok) {
    console.error("Database operation failed", res.status, path.split("?")[0]);
    throw new HttpError(
      res.status === 409 ? 409 : 502,
      res.status === 409
        ? "La operación entra en conflicto con el estado actual."
        : "No se pudo actualizar la tienda. Inténtalo de nuevo.",
    );
  }
  return res.status === 204 ? null : (res.json() as Promise<any>);
}
export const rpc = (name: string, data: unknown) =>
  db("rpc/" + name, { method: "POST", body: JSON.stringify(data) });
export function originGuard(req: Request) {
  const origin = req.headers.get("origin");
  const expected = config().origin || new URL(req.url).origin;
  if (!origin || origin !== expected)
    throw new HttpError(403, "Origen de solicitud no permitido.");
}
export async function body(req: Request) {
  const text = await req.text();
  if (text.length > 100000)
    throw new HttpError(413, "Solicitud demasiado grande.");
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "Solicitud no válida.");
  }
}
export function token(req: Request) {
  const raw = req.headers
    .get("cookie")
    ?.split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith("alma-session="))
    ?.slice(13);
  return raw ? decodeURIComponent(raw) : null;
}
export async function currentUser(req: Request) {
  if (!connected()) return null;
  const access = token(req);
  if (!access) return null;
  const c = config();
  const res = await fetch(c.url + "/auth/v1/user", {
    headers: { apikey: c.anon, Authorization: "Bearer " + access },
  });
  if (!res.ok) return null;
  const u = (await res.json()) as { id: string; email: string };
  const roles = await db(
    "user_roles?user_id=eq." + encodeURIComponent(u.id) + "&select=role",
  );
  return {
    ...u,
    admin: roles.some((r: { role: string }) => r.role === "admin"),
  };
}
export async function requireUser(req: Request, admin = false) {
  const u = await currentUser(req);
  if (!u) throw new HttpError(401, "Inicia sesión para continuar.");
  if (admin && !u.admin)
    throw new HttpError(403, "Esta acción requiere un administrador.");
  return u;
}
export function sessionCookie(value: string, maxAge: number, req: Request) {
  return (
    "alma-session=" +
    encodeURIComponent(value) +
    "; Path=/; HttpOnly; SameSite=Lax; Max-Age=" +
    maxAge +
    (new URL(req.url).protocol === "https:" ? "; Secure" : "")
  );
}
export function response(
  data: unknown,
  status = 200,
  headers: Record<string, string> = {},
) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}
export async function paypal(
  path: string,
  method = "GET",
  data?: unknown,
  key?: string,
) {
  const c = config();
  if (!c.paypalId || !c.paypalSecret)
    throw new HttpError(503, "PayPal todavía no está configurado.");
  const base = c.live
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
  const auth = await fetch(base + "/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(c.paypalId + ":" + c.paypalSecret),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!auth.ok) throw new HttpError(502, "No se pudo conectar con PayPal.");
  const t = (await auth.json()) as { access_token: string };
  const r = await fetch(base + path, {
    method,
    headers: {
      Authorization: "Bearer " + t.access_token,
      "Content-Type": "application/json",
      ...(key ? { "PayPal-Request-Id": key } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  const result = await r.json();
  if (!r.ok) {
    console.error("PayPal operation failed", r.status, path);
    throw new HttpError(
      502,
      "No se confirmó el pago. Revisa tus pedidos antes de reintentar.",
    );
  }
  return result as any;
}
export async function finalize(order: any, remote: any) {
  const unit = remote.purchase_units?.[0],
    capture = unit?.payments?.captures?.[0];
  if (!capture || capture.status !== "COMPLETED")
    throw new HttpError(409, "El pago sigue pendiente de confirmación.");
  if (
    remote.id !== order.paypal_id ||
    unit?.reference_id !== order.id ||
    unit?.payee?.merchant_id !== config().merchant ||
    capture.amount?.currency_code !== "MXN" ||
    Math.round(Number(capture.amount?.value) * 100) !== order.total
  )
    throw new HttpError(
      409,
      "El pago no coincide con el pedido. Se requiere revisión.",
    );
  await rpc("complete_order", {
    p_order_id: order.id,
    p_capture_id: capture.id,
    p_shipping: unit.shipping || null,
  });
  return { status: "paid", orderId: order.id };
}
