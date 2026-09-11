import { products } from "@/lib/catalog";
import {
  config,
  connected,
  payable,
  db,
  rpc,
  HttpError,
  originGuard,
  body,
  currentUser,
  requireUser,
  sessionCookie,
  response,
  paypal,
  finalize,
  token,
} from "@/lib/server";
export const dynamic = "force-dynamic";
const q = encodeURIComponent;
async function handler(req: Request) {
  try {
    const path = new URL(req.url).pathname.replace("/api/", "");
    const c = config();
    if (
      req.method === "POST" &&
      !["webhooks/paypal", "jobs/reconcile"].includes(path)
    )
      originGuard(req);
    if (req.method === "GET" && path === "catalog") {
      const user = await currentUser(req);
      return response({
        configured: connected(),
        checkout: payable(),
        clientId: payable() ? c.paypalId : null,
        user: user
          ? { id: user.id, email: user.email, admin: user.admin }
          : null,
        products: connected()
          ? await db(
              "products?published=eq.true&select=id,name,category,price,stock,kind,description,image,gallery,video,tag,sku,published&order=created_at.asc",
            )
          : products,
      });
    }
    if (path.startsWith("auth/") && req.method === "POST") {
      if (!connected())
        throw new HttpError(503, "Las cuentas todavía no están disponibles.");
      const action = path.slice(5);
      if (action === "reset") {
        const d = await body(req);
        if (
          typeof d.token !== "string" ||
          typeof d.password !== "string" ||
          d.password.length < 8 ||
          d.password.length > 128
        )
          throw new HttpError(400, "Datos de recuperación no válidos.");
        const r = await fetch(c.url + "/auth/v1/user", {
          method: "PUT",
          headers: {
            apikey: c.anon,
            Authorization: "Bearer " + d.token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password: d.password }),
        });
        if (!r.ok)
          throw new HttpError(
            400,
            "El enlace no es válido o ha vencido. Solicita uno nuevo.",
          );
        return response({ ok: true });
      }
      if (action === "logout") {
        const access = token(req);
        if (access)
          await fetch(c.url + "/auth/v1/logout", {
            method: "POST",
            headers: { apikey: c.anon, Authorization: "Bearer " + access },
          });
        return response({ ok: true }, 200, {
          "Set-Cookie": sessionCookie("", 0, req),
        });
      }
      const d = await body(req);
      if (
        typeof d.email !== "string" ||
        !/^\S+@\S+\.\S+$/.test(d.email) ||
        d.email.length > 254
      )
        throw new HttpError(400, "Escribe un correo electrónico válido.");
      if (!["login", "signup", "recover"].includes(action))
        throw new HttpError(404, "Acción no disponible.");
      if (
        action !== "recover" &&
        (typeof d.password !== "string" ||
          d.password.length < 8 ||
          d.password.length > 128)
      )
        throw new HttpError(
          400,
          "La contraseña debe tener entre 8 y 128 caracteres.",
        );
      const endpoint =
        action === "login"
          ? "token?grant_type=password"
          : action === "signup"
            ? "signup"
            : "recover";
      const res = await fetch(c.url + "/auth/v1/" + endpoint, {
        method: "POST",
        headers: { apikey: c.anon, "Content-Type": "application/json" },
        body: JSON.stringify({
          email: d.email,
          password: d.password,
          ...(action === "recover"
            ? { redirect_to: c.origin + "/recuperar" }
            : {}),
        }),
      });
      const result = (await res.json()) as any;
      if (!res.ok)
        throw new HttpError(
          400,
          action === "login"
            ? "No pudimos iniciar sesión. Revisa tu correo y contraseña."
            : "No se pudo procesar la solicitud. Inténtalo más tarde.",
        );
      if (result.access_token)
        return response({ ok: true }, 200, {
          "Set-Cookie": sessionCookie(
            result.access_token,
            Math.min(result.expires_in || 3600, 3600),
            req,
          ),
        });
      return response({
        message:
          action === "recover"
            ? "Si el correo está registrado, recibirás un enlace."
            : "Revisa tu correo para confirmar tu cuenta.",
      });
    }
    if (path === "me/library" && req.method === "GET") {
      const u = await requireUser(req);
      const [grants, orders] = await Promise.all([
        db(
          "entitlements?user_id=eq." +
            q(u.id) +
            "&active=eq.true&select=product_id",
        ),
        db(
          "orders?user_id=eq." +
            q(u.id) +
            "&select=id,status,total,created_at&order=created_at.desc&limit=100",
        ),
      ]);
      const ids = [...new Set(grants.map((g: any) => g.product_id))];
      const library = ids.length
        ? await db(
            "products?id=in.(" +
              ids.map((x) => q(String(x))).join(",") +
              ")&select=id,name,kind",
          )
        : [];
      return response({ library, orders });
    }
    const access = path.match(/^assets\/([\w-]+)\/access$/);
    if (access && req.method === "POST") {
      const u = await requireUser(req);
      const grants = await db(
        "entitlements?user_id=eq." +
          q(u.id) +
          "&product_id=eq." +
          q(access[1]) +
          "&active=eq.true&limit=1",
      );
      if (!grants.length)
        throw new HttpError(
          403,
          "Este contenido requiere una compra confirmada.",
        );
      const assets = await db(
        "digital_assets?product_id=eq." + q(access[1]) + "&select=path&limit=1",
      );
      if (!assets.length)
        throw new HttpError(404, "El archivo aún no está disponible.");
      const r = await fetch(
        c.url + "/storage/v1/object/sign/premium/" + assets[0].path,
        {
          method: "POST",
          headers: {
            apikey: c.service,
            Authorization: "Bearer " + c.service,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ expiresIn: 3600 }),
        },
      );
      if (!r.ok) throw new HttpError(502, "No se pudo abrir el archivo.");
      const d = (await r.json()) as any;
      return response({ url: c.url + "/storage/v1" + d.signedURL });
    }
    if (path === "checkout/orders" && req.method === "POST") {
      if (!payable())
        throw new HttpError(503, "Las compras todavía no están habilitadas.");
      const u = await requireUser(req);
      const d = await body(req);
      if (
        !Array.isArray(d.items) ||
        !d.items.length ||
        d.items.length > 30 ||
        d.items.some(
          (i: any) =>
            typeof i.id !== "string" ||
            !/^[\w-]{1,80}$/.test(i.id) ||
            !Number.isInteger(i.quantity) ||
            i.quantity < 1 ||
            i.quantity > 20,
        ) ||
        new Set(d.items.map((i: any) => i.id)).size !== d.items.length
      )
        throw new HttpError(400, "El carrito no es válido.");
      const order = await rpc("reserve_order", {
        p_user_id: u.id,
        p_items: d.items,
        p_shipping: c.shipping,
      });
      const remote = await paypal(
        "/v2/checkout/orders",
        "POST",
        {
          intent: "CAPTURE",
          purchase_units: [
            {
              reference_id: order.id,
              custom_id: order.id,
              amount: {
                currency_code: "MXN",
                value: (order.total / 100).toFixed(2),
              },
              payee: { merchant_id: c.merchant },
            },
          ],
          payment_source: {
            paypal: {
              experience_context: {
                shipping_preference: order.physical
                  ? "GET_FROM_FILE"
                  : "NO_SHIPPING",
                user_action: "PAY_NOW",
              },
            },
          },
        },
        order.id,
      );
      await db("orders?id=eq." + q(order.id), {
        method: "PATCH",
        body: JSON.stringify({ paypal_id: remote.id }),
      });
      return response({ orderId: order.id, paypalId: remote.id });
    }
    if (path === "checkout/capture" && req.method === "POST") {
      if (!payable())
        throw new HttpError(503, "Las compras no están habilitadas.");
      const u = await requireUser(req);
      const d = await body(req);
      if (typeof d.orderId !== "string" || typeof d.paypalId !== "string")
        throw new HttpError(400, "Pedido no válido.");
      const rows = await db(
        "orders?id=eq." + q(d.orderId) + "&user_id=eq." + q(u.id) + "&limit=1",
      );
      const order = rows[0];
      if (!order || order.paypal_id !== d.paypalId)
        throw new HttpError(404, "Pedido no encontrado.");
      if (order.status === "paid") return response({ status: "paid" });
      if (!["pending", "capturing"].includes(order.status))
        throw new HttpError(409, "El pedido ya no admite pagos.");
      await db("orders?id=eq." + q(order.id) + "&status=eq.pending", {
        method: "PATCH",
        body: JSON.stringify({ status: "capturing" }),
      });
      const before = await paypal("/v2/checkout/orders/" + q(order.paypal_id));
      if (before.status === "COMPLETED")
        return response(await finalize(order, before));
      if (
        order.physical &&
        before.purchase_units?.[0]?.shipping?.address?.country_code !== "MX"
      )
        throw new HttpError(
          400,
          "Por ahora solo realizamos envíos dentro de México. No se ha capturado el pago.",
        );
      const remote = await paypal(
        "/v2/checkout/orders/" + q(order.paypal_id) + "/capture",
        "POST",
        {},
        "capture-" + order.id,
      );
      return response(await finalize(order, remote));
    }
    if (path === "webhooks/paypal" && req.method === "POST") {
      if (!c.webhook) throw new HttpError(503, "Webhook no configurado.");
      const event = await body(req);
      const verified = await paypal(
        "/v1/notifications/verify-webhook-signature",
        "POST",
        {
          auth_algo: req.headers.get("paypal-auth-algo"),
          cert_url: req.headers.get("paypal-cert-url"),
          transmission_id: req.headers.get("paypal-transmission-id"),
          transmission_sig: req.headers.get("paypal-transmission-sig"),
          transmission_time: req.headers.get("paypal-transmission-time"),
          webhook_id: c.webhook,
          webhook_event: event,
        },
      );
      if (verified.verification_status !== "SUCCESS")
        throw new HttpError(401, "Firma de evento no válida.");
      if (typeof event.id !== "string")
        throw new HttpError(400, "Evento no válido.");
      const existing = await db(
        "webhook_events?id=eq." + q(event.id) + "&select=processed",
      );
      if (existing[0]?.processed) return response({ ok: true });
      await db("webhook_events?on_conflict=id", {
        method: "POST",
        headers: {
          Prefer: "resolution=ignore-duplicates,return=representation",
        },
        body: JSON.stringify({
          id: event.id,
          type: event.event_type,
          processed: false,
        }),
      });
      if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
        const paypalId =
          event.resource?.supplementary_data?.related_ids?.order_id;
        if (paypalId) {
          const rows = await db(
            "orders?paypal_id=eq." + q(paypalId) + "&limit=1",
          );
          if (!rows.length)
            throw new HttpError(409, "Pedido aún no registrado.");
          await finalize(
            rows[0],
            await paypal("/v2/checkout/orders/" + q(paypalId)),
          );
        }
      } else if (
        ["PAYMENT.CAPTURE.REFUNDED", "PAYMENT.CAPTURE.REVERSED"].includes(
          event.event_type,
        )
      ) {
        const captureId =
          event.resource?.supplementary_data?.related_ids?.capture_id ||
          (event.event_type === "PAYMENT.CAPTURE.REVERSED"
            ? event.resource?.id
            : event.resource?.links
                ?.find((l: any) => l.rel === "up")
                ?.href?.match(/\/v2\/payments\/captures\/([A-Z0-9]+)$/)?.[1]);
        if (captureId)
          await rpc("suspend_refunded_order", { p_capture_id: captureId });
      }
      await db("webhook_events?id=eq." + q(event.id), {
        method: "PATCH",
        body: JSON.stringify({ processed: true }),
      });
      return response({ ok: true });
    }
    if (path === "jobs/reconcile" && req.method === "POST") {
      if (!c.cron || req.headers.get("authorization") !== "Bearer " + c.cron)
        throw new HttpError(401, "No autorizado.");
      const rows = await db(
        "orders?status=in.(pending,capturing)&order=created_at.asc&limit=50",
      );
      let checked = 0;
      for (const order of rows) {
        try {
          if (!order.paypal_id) {
            continue;
          }
          const remote = await paypal(
            "/v2/checkout/orders/" + q(order.paypal_id),
          );
          if (remote.status === "COMPLETED") await finalize(order, remote);
          else if (remote.status === "VOIDED")
            await rpc("release_order", { p_order_id: order.id });
          checked++;
        } catch {
          console.error("Reconciliation requires review", order.id);
        }
      }
      return response({ checked });
    }
    if (path === "admin/inventory" && req.method === "POST") {
      const u = await requireUser(req, true);
      const d = await body(req);
      if (
        !Array.isArray(d.rows) ||
        d.rows.length < 1 ||
        d.rows.length > 500 ||
        d.rows.some(
          (r: any) =>
            typeof r.sku !== "string" ||
            !Number.isSafeInteger(r.stock) ||
            Math.abs(r.stock) > 100000 ||
            (r.price !== undefined &&
              (!Number.isSafeInteger(r.price) ||
                r.price < 0 ||
                r.price > 100000000)),
        ) ||
        new Set(d.rows.map((r: any) => r.sku)).size !== d.rows.length
      )
        throw new HttpError(400, "Ajustes no válidos.");
      await rpc("adjust_inventory", { p_rows: d.rows, p_actor: u.id });
      return response({ ok: true });
    }
    if (path === "admin/upload" && req.method === "POST") {
      await requireUser(req, true);
      const d = await body(req);
      const mimes: Record<string, string[]> = {
        image: ["image/jpeg", "image/png", "image/webp"],
        video: ["video/mp4"],
        audio: ["audio/mpeg", "audio/wav"],
        ebook: ["application/pdf"],
      };
      if (
        !mimes[d.kind]?.includes(d.contentType) ||
        !Number.isInteger(d.size) ||
        d.size <= 0 ||
        d.size > 50 * 1024 * 1024 ||
        typeof d.productId !== "string" ||
        !/^[\w-]{1,80}$/.test(d.productId)
      )
        throw new HttpError(
          400,
          "Tipo o tamaño de archivo no válido. Máximo 50 MB.",
        );
      const rows = await db(
        "products?id=eq." + q(d.productId) + "&select=id,kind",
      );
      if (!rows.length) throw new HttpError(404, "Producto no encontrado.");
      if (["audio", "ebook"].includes(d.kind) && rows[0].kind !== d.kind)
        throw new HttpError(
          400,
          "El archivo no corresponde al tipo de producto.",
        );
      const extension = (
        {
          "image/jpeg": "jpg",
          "image/png": "png",
          "image/webp": "webp",
          "video/mp4": "mp4",
          "audio/mpeg": "mp3",
          "audio/wav": "wav",
          "application/pdf": "pdf",
        } as Record<string, string>
      )[d.contentType];
      const path = d.productId + "/" + crypto.randomUUID() + "." + extension;
      const bucket = ["audio", "ebook"].includes(d.kind)
        ? "premium"
        : "catalog";
      const r = await fetch(
        c.url + "/storage/v1/object/upload/sign/" + bucket + "/" + path,
        {
          method: "POST",
          headers: {
            apikey: c.service,
            Authorization: "Bearer " + c.service,
            "Content-Type": "application/json",
          },
          body: "{}",
        },
      );
      if (!r.ok) throw new HttpError(502, "No se pudo preparar la subida.");
      const result = (await r.json()) as any;
      return response({ path, uploadUrl: c.url + "/storage/v1" + result.url });
    }
    if (path === "admin/upload/complete" && req.method === "POST") {
      await requireUser(req, true);
      const d = await body(req);
      if (
        typeof d.path !== "string" ||
        typeof d.productId !== "string" ||
        !new RegExp(
          "^" +
            d.productId.replace(/[^\w-]/g, "") +
            "/[a-f0-9-]+\\.(jpg|png|webp|mp4|mp3|wav|pdf)$",
        ).test(d.path) ||
        !["image", "video", "audio", "ebook"].includes(d.kind)
      )
        throw new HttpError(400, "Archivo no válido.");
      const privateFile = ["audio", "ebook"].includes(d.kind),
        bucket = privateFile ? "premium" : "catalog";
      const info = await fetch(
        c.url + "/storage/v1/object/info/" + bucket + "/" + d.path,
        {
          headers: { apikey: c.service, Authorization: "Bearer " + c.service },
        },
      );
      if (!info.ok) throw new HttpError(409, "La subida no está completa.");
      if (privateFile)
        await db("digital_assets?on_conflict=product_id", {
          method: "POST",
          headers: {
            Prefer: "resolution=merge-duplicates,return=representation",
          },
          body: JSON.stringify({ product_id: d.productId, path: d.path }),
        });
      else {
        const url = c.url + "/storage/v1/object/public/catalog/" + d.path;
        if (d.kind === "image") {
          const rows = await db(
            "products?id=eq." + q(d.productId) + "&select=gallery",
          );
          await db("products?id=eq." + q(d.productId), {
            method: "PATCH",
            body: JSON.stringify({
              image: url,
              gallery: [url, ...(rows[0]?.gallery || [])].slice(0, 10),
            }),
          });
        }
      }
      if (d.kind === "video")
        await db("products?id=eq." + q(d.productId), {
          method: "PATCH",
          body: JSON.stringify({
            video: c.url + "/storage/v1/object/public/catalog/" + d.path,
          }),
        });
      return response({ ok: true });
    }
    throw new HttpError(404, "Ruta no disponible.");
  } catch (e) {
    if (e instanceof HttpError) return response({ error: e.message }, e.status);
    console.error(
      "Unhandled API failure",
      e instanceof Error ? e.name : "unknown",
    );
    return response(
      { error: "No se pudo completar la operación. Intenta de nuevo." },
      500,
    );
  }
}
export const GET = handler;
export const POST = handler;
