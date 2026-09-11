"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { products as samples, Product } from "@/lib/catalog";
import { toast } from "sonner";
export type CartItem = { id: string; quantity: number };
type Shop = {
  products: Product[];
  cart: CartItem[];
  add: (id: string) => void;
  update: (id: string, q: number) => void;
  clear: () => void;
  ready: boolean;
  configured: boolean;
  checkout: boolean;
  clientId: string;
  user: { id: string; email: string; admin?: boolean } | null;
  refresh: () => Promise<void>;
  error: string;
};
const Context = createContext<Shop | null>(null);
export const useShop = () => {
  const c = useContext(Context);
  if (!c) throw new Error("Shop provider missing");
  return c;
};
export async function api(path: string, body?: unknown, method?: string) {
  const res = await fetch(path, {
    method: method || (body ? "POST" : "GET"),
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json()) as any;
  if (!res.ok)
    throw new Error(data.error || "No se pudo completar la solicitud.");
  return data;
}
export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(samples),
    [cart, setCart] = useState<CartItem[]>([]),
    [ready, setReady] = useState(false),
    [configured, setConfigured] = useState(false),
    [checkout, setCheckout] = useState(false),
    [clientId, setClientId] = useState(""),
    [user, setUser] = useState<Shop["user"]>(null),
    [error, setError] = useState("");
  const refresh = useCallback(async () => {
    try {
      const d = await api("/api/catalog");
      setConfigured(d.configured);
      setCheckout(d.checkout);
      setClientId(d.clientId || "");
      setProducts(d.products);
      setUser(d.user);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("alma-cart-draft") || "[]");
      if (Array.isArray(saved))
        setCart(
          saved
            .filter(
              (v) =>
                typeof v.id === "string" &&
                Number.isInteger(v.quantity) &&
                v.quantity > 0 &&
                v.quantity <= 20,
            )
            .slice(0, 30),
        );
    } catch {}
    setReady(true);
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (ready) localStorage.setItem("alma-cart-draft", JSON.stringify(cart));
  }, [cart, ready]);
  const update = useCallback(
    (id: string, q: number) =>
      setCart((c) => {
        const p = products.find((p) => p.id === id);
        if (!p) return c.filter((x) => x.id !== id);
        const quantity = Math.max(
          0,
          Math.min(q, p.kind === "physical" ? p.stock : 1, 20),
        );
        return quantity
          ? c.some((x) => x.id === id)
            ? c.map((x) => (x.id === id ? { id, quantity } : x))
            : [...c, { id, quantity }]
          : c.filter((x) => x.id !== id);
      }),
    [products],
  );
  const add = useCallback(
    (id: string) => {
      const p = products.find((p) => p.id === id);
      if (!p || p.stock < 1) return;
      setCart((c) => {
        const old = c.find((x) => x.id === id);
        const quantity = Math.min(
          (old?.quantity || 0) + 1,
          p.kind === "physical" ? p.stock : 1,
          20,
        );
        return old
          ? c.map((x) => (x.id === id ? { id, quantity } : x))
          : [...c, { id, quantity }];
      });
      toast.success("Agregado a tu carrito", {
        description: p.name,
        action: {
          label: "Ver carrito",
          onClick: () => location.assign("/carrito"),
        },
      });
    },
    [products],
  );
  useEffect(() => {
    const ctx = (
      document as unknown as {
        modelContext?: {
          registerTool: (tool: unknown, options: unknown) => void;
        };
      }
    ).modelContext;
    if (!ctx?.registerTool) return;
    const ac = new AbortController();
    try {
      ctx.registerTool(
        {
          name: "search_catalog",
          description:
            "Buscar productos publicados de Alma & Tierra por nombre o categoría.",
          inputSchema: {
            type: "object",
            properties: { query: { type: "string" } },
            required: ["query"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true },
          execute: (input: unknown) => {
            if (
              !input ||
              typeof (input as { query?: unknown }).query !== "string"
            )
              throw new Error("query debe ser texto");
            const q = (input as { query: string }).query.toLowerCase();
            return products
              .filter((p) =>
                (p.name + " " + p.category).toLowerCase().includes(q),
              )
              .map(({ id, name, price, stock }) => ({
                id,
                name,
                price,
                currency: "MXN",
                stock,
              }));
          },
        },
        { signal: ac.signal },
      );
    } catch {}
    return () => ac.abort();
  }, [products]);
  return (
    <Context.Provider
      value={{
        products,
        cart,
        add,
        update,
        clear: () => setCart([]),
        ready,
        configured,
        checkout,
        clientId,
        user,
        refresh,
        error,
      }}
    >
      {children}
    </Context.Provider>
  );
}
