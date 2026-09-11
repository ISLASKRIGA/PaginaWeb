"use client";
import {
  ArrowRight,
  ArrowUpRight,
  ShoppingBag,
  UserRound,
  Sparkles,
  Leaf,
  Headphones,
  Truck,
  Play,
  Gem,
  Heart,
} from "lucide-react";
import { ShopProvider, useShop } from "./shop-context";
import { ShopViews } from "./shop-views";
import { Toaster } from "@/components/ui/sonner";
const bowl =
  "https://images.unsplash.com/photo-1746802401350-b99c6e692a05?auto=format&fit=crop&w=1200&q=85";
const crystal =
  "https://images.unsplash.com/photo-1659233236926-add1ff68173f?auto=format&fit=crop&w=1200&q=85";
export default function Storefront({
  view = "inicio",
  productId,
}: {
  view?: string;
  productId?: string;
}) {
  return (
    <ShopProvider>
      <Surface view={view} productId={productId} />
      <Toaster position="bottom-right" />
    </ShopProvider>
  );
}
function Surface({ view, productId }: { view: string; productId?: string }) {
  const { cart } = useShop();
  return (
    <>
      <div className="announcement">
        Un espacio para volver a ti <span>✧</span> Envíos a todo México
      </div>
      <header className="header">
        <a className="brand" href="/">
          <Sparkles strokeWidth={1.2} />
          <span>
            alma <i>&</i> tierra<small>BIENESTAR CON INTENCIÓN</small>
          </span>
        </a>
        <nav aria-label="Principal">
          {[
            ["inicio", "Inicio"],
            ["tienda", "Tienda"],
            ["meditaciones", "Meditaciones"],
            ["recursos", "Recursos"],
            ["cursos", "Clases y cursos"],
          ].map(([id, label]) => (
            <a
              className={view === id ? "active" : ""}
              href={id === "inicio" ? "/" : "/" + id}
              key={id}
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <a href="/mi-cuenta" aria-label="Mi cuenta">
            <UserRound size={21} />
          </a>
          <a href="/carrito" aria-label="Abrir carrito">
            <ShoppingBag size={21} />
            <span className="bag-count">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          </a>
        </div>
      </header>
      <main>
        {view !== "inicio" ? (
          <ShopViews view={view} productId={productId} />
        ) : (
          <>
            <section className="hero">
              <div className="hero-copy">
                <div className="eyebrow">
                  <span /> PEQUEÑOS RITUALES, GRANDES CAMBIOS
                </div>
                <h1>
                  Encuentra tu calma.
                  <br />
                  <em>Conecta con tu esencia.</em>
                </h1>
                <p>
                  Objetos con intención, meditaciones y experiencias
                  <br className="desktop" /> para acompañarte en tu camino de
                  bienestar.
                </p>
                <div className="hero-buttons">
                  <a className="button" href="/tienda">
                    Explorar la tienda <ArrowUpRight size={18} />
                  </a>
                  <a className="text-button" href="/meditaciones">
                    <span className="play-circle">
                      <Play size={13} fill="currentColor" />
                    </span>
                    Regálate una pausa
                  </a>
                </div>
                <div className="hero-foot">
                  <Leaf size={17} /> Elegido con amor. Creado para tu bienestar.
                </div>
              </div>
              <div className="hero-photo">
                <img
                  src="https://images.pexels.com/photos/6634253/pexels-photo-6634253.jpeg?auto=compress&cs=tinysrgb&w=1800"
                  alt="Cuenco tibetano y elementos naturales para un ritual de calma"
                />
                <div className="photo-label">
                  <Sparkles size={19} />
                  <span>
                    Tu momento de paz
                    <br />
                    <strong>empieza aquí.</strong>
                  </span>
                </div>
                <span className="photo-caption">
                  CONECTA · RESPIRA · FLORECE
                </span>
              </div>
            </section>
            <div className="benefits">
              <span>
                <Gem /> Piezas seleccionadas con intención
              </span>
              <span>
                <Headphones /> Meditaciones para cada momento
              </span>
              <span>
                <Truck /> Envíos a todo México
              </span>
              <span>
                <Heart /> Un camino, a tu ritmo
              </span>
            </div>
            <section className="section">
              <div className="section-heading">
                <div>
                  <div className="eyebrow">TU RITUAL, TU ESENCIA</div>
                  <h2>Encuentra lo que resuena contigo</h2>
                </div>
                <a className="text-link" href="/tienda">
                  Ver toda la tienda <ArrowRight size={17} />
                </a>
              </div>
              <div className="category-grid">
                {[
                  {
                    name: "Cuarzos",
                    desc: "La belleza de lo natural",
                    img: crystal,
                  },
                  {
                    name: "Cuencos tibetanos",
                    desc: "Sonidos que invitan a pausar",
                    img: bowl,
                  },
                  {
                    name: "Tu espacio de calma",
                    desc: "Pequeños rituales cotidianos",
                    img: "https://images.pexels.com/photos/10574239/pexels-photo-10574239.jpeg?auto=compress&cs=tinysrgb&w=1000",
                  },
                ].map((c) => (
                  <a
                    href={
                      "/tienda?categoria=" +
                      encodeURIComponent(
                        c.name === "Tu espacio de calma" ? "Todos" : c.name,
                      )
                    }
                    className="category-card"
                    key={c.name}
                  >
                    <div className="category-image">
                      <img src={c.img} alt={c.name} />
                      <span className="round-arrow">
                        <ArrowUpRight size={20} />
                      </span>
                    </div>
                    <h3>{c.name}</h3>
                    <p>{c.desc}</p>
                  </a>
                ))}
              </div>
            </section>
            <section className="pause-banner">
              <div className="eyebrow">UN REGALO PARA TI</div>
              <h2>
                No tienes que hacer más.
                <br />
                <em>Solo estar aquí.</em>
              </h2>
              <p>
                Haz espacio para una respiración consciente.
                <br />
                Explora nuestra biblioteca de meditaciones gratuitas.
              </p>
              <a className="button" href="/meditaciones">
                <Headphones size={18} /> Escuchar una meditación
              </a>
            </section>
          </>
        )}
      </main>
      <footer>
        <a className="brand" href="/">
          alma <i>&</i> tierra
        </a>
        <p>Un espacio para volver a ti.</p>
        <div>
          <a href="/tienda">Tienda</a>
          <a href="/meditaciones">Meditaciones</a>
          <a href="/cursos">Clases y cursos</a>
          <a href="/admin">Administración</a>
        </div>
        <small>
          © {new Date().getFullYear()} Alma & Tierra · Catálogo de muestra
        </small>
      </footer>
    </>
  );
}
