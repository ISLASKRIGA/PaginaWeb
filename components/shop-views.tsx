"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  Search,
  Plus,
  Minus,
  Trash2,
  Headphones,
  Download,
  LockKeyhole,
  Play,
  Clock,
  BookOpen,
  CalendarDays,
  Check,
  Upload,
  Package,
  LogOut,
  Leaf,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  categories,
  images,
  meditations,
  topics,
  money,
  Product,
} from "@/lib/catalog";
import { useShop, api } from "./shop-context";
import { parseInventoryCSV } from "@/lib/inventory";

function Heading({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-heading">
      <div className="eyebrow">{label}</div>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}
function Notice() {
  const { configured, error } = useShop();
  return error ? (
    <div role="alert" className="notice error">
      {error} <button onClick={() => location.reload()}>Reintentar</button>
    </div>
  ) : !configured ? (
    <div className="notice">
      Estás explorando una colección de muestra. Las compras y las cuentas
      estarán disponibles próximamente.
    </div>
  ) : null;
}
function ProductCard({ p }: { p: Product }) {
  const { add } = useShop();
  return (
    <article className="product-card">
      <a href={"/producto/" + p.id} className="product-image">
        <img src={p.image} alt={p.name} loading="lazy" />
        {p.tag && <span className="pill">{p.tag}</span>}
      </a>
      <div className="product-meta">{p.category}</div>
      <a href={"/producto/" + p.id}>
        <h3>{p.name}</h3>
      </a>
      <div className="product-bottom">
        <span>
          {money(p.price)} <small>MXN</small>
        </span>
        <button
          className="icon-button"
          onClick={() => add(p.id)}
          aria-label={"Agregar " + p.name}
          disabled={p.stock < 1}
        >
          <Plus size={18} />
        </button>
      </div>
    </article>
  );
}
function Catalog() {
  const { products } = useShop();
  const [category, setCategory] = useState("Todos"),
    [query, setQuery] = useState(""),
    [sort, setSort] = useState("featured");
  useEffect(() => {
    setCategory(
      new URLSearchParams(location.search).get("categoria") || "Todos",
    );
  }, []);
  const list = products
    .filter(
      (p) =>
        p.kind === "physical" &&
        (category === "Todos" || p.category === category) &&
        (p.name + " " + p.description)
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "low"
        ? a.price - b.price
        : sort === "high"
          ? b.price - a.price
          : 0,
    );
  return (
    <section className="section page-section">
      <Heading
        label="OBJETOS CON INTENCIÓN"
        title="Tu próximo pequeño ritual"
        description="Piezas para acompañarte, conectar y hacer espacio para ti."
      />
      <Notice />
      <div className="filter-pills" aria-label="Categorías">
        {categories.map((c) => (
          <button
            aria-pressed={category === c}
            className={category === c ? "selected" : ""}
            key={c}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="toolbar">
        <label className="search">
          <Search size={18} />
          <input
            aria-label="Buscar productos"
            placeholder="Encuentra algo especial…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <span className="muted">{list.length} piezas</span>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="sort-select" aria-label="Ordenar productos">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="featured">Destacados</SelectItem>
            <SelectItem value="low">Precio: menor a mayor</SelectItem>
            <SelectItem value="high">Precio: mayor a menor</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {list.length ? (
        <div className="product-grid">
          {list.map((p) => (
            <ProductCard p={p} key={p.id} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <Leaf size={34} />
          <h2>Pronto habrá más por descubrir</h2>
          <p>No hay piezas disponibles con estos filtros.</p>
          <button
            className="button secondary"
            onClick={() => {
              setCategory("Todos");
              setQuery("");
            }}
          >
            Ver todas las piezas
          </button>
        </div>
      )}
    </section>
  );
}
function ProductDetail({ id }: { id?: string }) {
  const { products, add, ready } = useShop();
  const p = products.find((p) => p.id === id);
  const [photo, setPhoto] = useState(0);
  if (!p)
    return (
      <div className="section empty">
        <h1>{ready ? "Pieza no disponible" : "Cargando…"}</h1>
        <a href="/tienda">Volver a la tienda</a>
      </div>
    );
  return (
    <section className="section">
      <a className="text-link breadcrumb" href="/tienda">
        <ArrowLeft size={16} /> Volver a la tienda
      </a>
      <div className="product-detail">
        <div>
          <div className="detail-image">
            <img
              src={(p.gallery || [p.image])[photo] || p.image}
              alt={p.name}
            />
          </div>
          {(p.gallery?.length || 0) > 1 && (
            <div className="thumbnails">
              {p.gallery!.map((src, i) => (
                <button
                  key={src}
                  aria-label={"Ver imagen " + (i + 1)}
                  aria-pressed={photo === i}
                  onClick={() => setPhoto(i)}
                >
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="detail-copy">
          <div className="eyebrow">{p.category}</div>
          <h1>{p.name}</h1>
          <p className="detail-price">
            {money(p.price)} <small>MXN</small>
          </p>
          <p>{p.description}</p>
          <span className="availability">
            {p.kind === "physical"
              ? `${p.stock} piezas disponibles`
              : "Acceso digital después de la compra"}
          </span>
          <button
            className="button"
            disabled={!p.stock}
            onClick={() => add(p.id)}
          >
            <ShoppingBag size={18} /> Agregar a mi carrito
          </button>
          <Notice />
          <div className="detail-notes">
            <p>
              <Check size={16} />{" "}
              {p.kind === "physical"
                ? "Envíos dentro de México"
                : "Reproducción o descarga desde tu biblioteca"}
            </p>
            <p>
              <LockKeyhole size={16} /> Compra procesada de forma segura con
              PayPal
            </p>
          </div>
          {p.category.includes("Cuencos") && (
            <div className="sound-box">
              <Headphones size={24} />
              <div>
                <h3>Escucha su sonido</h3>
                {p.video ? (
                  <video
                    controls
                    preload="metadata"
                    src={p.video}
                    aria-label={"Demostración de " + p.name}
                  />
                ) : (
                  <p>
                    La demostración de esta pieza estará disponible al cargar su
                    video.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
function AudioPlayer({ name, src }: { name: string; src: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [speed, setSpeed] = useState("1"),
    [failed, setFailed] = useState(false);
  return (
    <div className="audio-player">
      <div className="eyebrow">ESTE MOMENTO ES TUYO</div>
      <h3>{name}</h3>
      <audio
        ref={ref}
        controls
        preload="metadata"
        src={src}
        onError={() => setFailed(true)}
        onPlay={() => {
          document.querySelectorAll("audio").forEach((a) => {
            if (a !== ref.current) a.pause();
          });
        }}
        aria-label={"Reproducir " + name}
      />
      {failed && (
        <p role="alert">
          No se pudo cargar el audio. Comprueba tu conexión e inténtalo de
          nuevo.
        </p>
      )}
      <div className="player-tools">
        <label>
          Velocidad{" "}
          <select
            value={speed}
            onChange={(e) => {
              setSpeed(e.target.value);
              if (ref.current)
                ref.current.playbackRate = Number(e.target.value);
            }}
          >
            {["0.75", "1", "1.25", "1.5"].map((s) => (
              <option key={s} value={s}>
                {s}×
              </option>
            ))}
          </select>
        </label>
        <a href={src} download>
          <Download size={16} /> Descargar audio
        </a>
      </div>
    </div>
  );
}
function Meditations() {
  const { products } = useShop();
  const [topic, setTopic] = useState("Todos"),
    [active, setActive] = useState<(typeof meditations)[number] | null>(null);
  return (
    <section className="section page-section">
      <Heading
        label="RESPIRA. ESTÁS AQUÍ."
        title="Un espacio para escucharte"
        description="Encuentra una pausa que acompañe tu momento, a tu ritmo."
      />
      <Tabs defaultValue="free">
        <TabsList className="section-tabs">
          <TabsTrigger value="free">Gratuitas · 20</TabsTrigger>
          <TabsTrigger value="paid">Meditaciones exclusivas</TabsTrigger>
        </TabsList>
        <TabsContent value="free">
          <div className="notice">
            20 prácticas breves de muestra con voz sintética en español.
            Sustituibles por las grabaciones originales.
          </div>
          <div className="filter-pills">
            {topics.map((t) => (
              <button
                key={t}
                aria-pressed={topic === t}
                onClick={() => setTopic(t)}
                className={topic === t ? "selected" : ""}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="meditation-grid">
            {meditations
              .filter((m) => topic === "Todos" || m.topic === topic)
              .map((m, i) => (
                <article
                  className={"meditation-card tone-" + (i % 4)}
                  key={m.id}
                >
                  <div className="audio-art">
                    <Headphones size={35} strokeWidth={1} />
                    <span className="pill">Gratis</span>
                    <button
                      className="round-play"
                      aria-label={"Escuchar " + m.name}
                      onClick={() => setActive(m)}
                    >
                      <Play size={21} fill="currentColor" />
                    </button>
                  </div>
                  <div className="audio-info">
                    <span className="eyebrow">{m.topic}</span>
                    <h3>{m.name}</h3>
                    <p>{m.prompt}</p>
                    <button className="text-link" onClick={() => setActive(m)}>
                      Escuchar y descargar <ArrowRight size={16} />
                    </button>
                  </div>
                </article>
              ))}
          </div>
        </TabsContent>
        <TabsContent value="paid">
          <Notice />
          <div className="product-grid">
            {products
              .filter((p) => p.kind === "audio")
              .map((p) => (
                <ProductCard p={p} key={p.id} />
              ))}
          </div>
        </TabsContent>
      </Tabs>
      <Dialog
        open={!!active}
        onOpenChange={(o) => {
          if (!o) setActive(null);
        }}
      >
        <DialogContent className="audio-dialog">
          <DialogTitle>{active?.name}</DialogTitle>
          <DialogDescription>
            Práctica de muestra · voz sintética · audio WAV
          </DialogDescription>
          {active && (
            <>
              <AudioPlayer
                key={active.id}
                name={active.name}
                src={active.src}
              />
              <details>
                <summary>Leer la práctica</summary>
                <p>
                  Encuentra una postura cómoda. {active.prompt} Si tu atención
                  se aleja, regresa con amabilidad. Toma el tiempo que
                  necesites. Para terminar, nota el contacto de tu cuerpo con el
                  lugar donde estás.
                </p>
              </details>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
function Resources() {
  const { products } = useShop();
  const [article, setArticle] = useState(false);
  return (
    <section className="section page-section">
      <Heading
        label="PALABRAS QUE ACOMPAÑAN"
        title="Pequeñas lecturas, nuevas perspectivas"
        description="Guías, libros y artículos para cultivar una práctica personal."
      />
      <div className="resource-feature">
        <div className="book-cover">
          <span>ALMA & TIERRA</span>
          <BookOpen size={64} strokeWidth={1} />
          <h2>
            Una pausa
            <br />
            con intención
          </h2>
          <small>GUÍA PARA COMENZAR</small>
        </div>
        <div>
          <span className="pill">Descarga gratuita · PDF</span>
          <h2>Tu primera pausa consciente</h2>
          <p>
            Una guía breve y original con tres ejercicios sencillos y espacio
            para reflexionar. No necesitas experiencia, solo unos minutos para
            ti.
          </p>
          <a
            className="button"
            href="/downloads/una-pausa-con-intencion.pdf"
            download
          >
            <Download size={18} /> Descargar guía
          </a>
        </div>
      </div>
      <div className="section-heading">
        <h2>Para seguir explorando</h2>
      </div>
      <div className="resource-grid">
        <article className="article-card">
          <div className="eyebrow">ARTÍCULO · LECTURA GRATUITA</div>
          <h3>Cómo crear tu rincón de calma</h3>
          <p>
            Un lugar sencillo que te invite a detenerte y volver al presente.
          </p>
          <button className="text-link" onClick={() => setArticle(true)}>
            Leer artículo <ArrowRight size={16} />
          </button>
        </article>
        {products
          .filter((p) => p.kind === "ebook")
          .map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
      </div>
      <Dialog open={article} onOpenChange={setArticle}>
        <DialogContent className="article-dialog">
          <DialogTitle>Cómo crear tu rincón de calma</DialogTitle>
          <DialogDescription>
            Alma & Tierra · Artículo original de muestra
          </DialogDescription>
          <p>
            No hace falta una habitación entera. Busca una esquina donde puedas
            sentarte con comodidad y donde la luz te resulte agradable.
          </p>
          <h3>Empieza con lo esencial</h3>
          <p>
            Una silla o un cojín, un vaso de agua y unos minutos sin
            interrupciones son suficientes. Si añades objetos, elige aquellos
            que disfrutas mirar.
          </p>
          <h3>Hazlo tuyo</h3>
          <p>
            Puedes colocar una planta, una fotografía o un cuenco. Los objetos
            acompañan la práctica; no necesitas comprar nada para comenzar.
          </p>
          <h3>Vuelve cuando lo necesites</h3>
          <p>
            Siéntate, nota el apoyo de tus pies y observa tres respiraciones.
            Repite cuando quieras. Tu espacio puede cambiar contigo.
          </p>
        </DialogContent>
      </Dialog>
    </section>
  );
}
function Courses() {
  const { products, add } = useShop();
  const [open, setOpen] = useState(false);
  return (
    <section className="section page-section">
      <Heading
        label="APRENDEMOS EN COMUNIDAD"
        title="Un camino que podemos compartir"
        description="Clases y cursos para acercarte a la meditación, paso a paso."
      />
      <div className="course-feature">
        <img
          src={images.ritual}
          alt="Cuenco y elementos de un espacio de meditación"
        />
        <div>
          <span className="eyebrow">EN LÍNEA · NIVEL INICIAL</span>
          <h2>Meditación desde cero</h2>
          <p>
            Construye una práctica que se adapte a tu vida. Cuatro encuentros
            para explorar la atención, la respiración y la escucha.
          </p>
          <ul className="course-facts">
            <li>
              <CalendarDays size={18} /> Próximas fechas por confirmar
            </li>
            <li>
              <Clock size={18} /> 4 encuentros · 60 minutos
            </li>
            <li>
              <Headphones size={18} /> En vivo, desde tu espacio
            </li>
          </ul>
          <button className="button" onClick={() => setOpen(true)}>
            Conocer el programa <ArrowRight size={17} />
          </button>
        </div>
      </div>
      <div className="notice">
        Programa de muestra. Las inscripciones y la agenda se abrirán cuando se
        confirmen fechas e instructor.
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Meditación desde cero</DialogTitle>
          <DialogDescription>
            Programa propuesto · 4 encuentros
          </DialogDescription>
          <ol className="syllabus">
            <li>
              <strong>1. Llegar al presente</strong>
              <p>Postura, atención y una primera práctica.</p>
            </li>
            <li>
              <strong>2. Conocer tu respiración</strong>
              <p>Observar el ritmo natural del cuerpo.</p>
            </li>
            <li>
              <strong>3. Escuchar sin juzgar</strong>
              <p>Acompañar pensamientos y sensaciones.</p>
            </li>
            <li>
              <strong>4. Crear tu propio ritual</strong>
              <p>Integrar una pausa en la vida cotidiana.</p>
            </li>
          </ol>
          <p>Fechas e instructor pendientes de confirmación.</p>
          <button className="button" disabled>
            Inscripciones próximamente
          </button>
        </DialogContent>
      </Dialog>
    </section>
  );
}
function Account() {
  const { configured, user, refresh } = useShop();
  const [mode, setMode] = useState("login"),
    [busy, setBusy] = useState(false),
    [library, setLibrary] = useState<any[]>([]),
    [orders, setOrders] = useState<any[]>([]),
    [error, setError] = useState(""),
    [asset, setAsset] = useState<{ name: string; src: string } | null>(null);
  useEffect(() => {
    if (user)
      api("/api/me/library")
        .then((d) => {
          setLibrary(d.library);
          setOrders(d.orders);
        })
        .catch((e) => setError(e.message));
  }, [user]);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const result = await api("/api/auth/" + mode, data);
      if (result.message) toast.success(result.message);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function access(id: string, name: string, kind: string) {
    try {
      const d = await api("/api/assets/" + id + "/access", {});
      if (kind === "audio") setAsset({ name, src: d.url });
      else window.open(d.url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  return (
    <section className="section page-section">
      <Heading
        label="TU ESPACIO PERSONAL"
        title={
          user ? "Qué bueno tenerte aquí" : "Tu biblioteca, siempre contigo"
        }
        description="Accede a tus compras, meditaciones y recursos digitales."
      />
      {!user ? (
        <div className="account-layout">
          <div className="account-intro">
            <BookOpen size={44} strokeWidth={1} />
            <h2>
              Todo lo que te acompaña,
              <br />
              en un mismo lugar.
            </h2>
            <p>
              Al comprar contenido digital, podrás volver a escucharlo o
              descargarlo desde tu cuenta.
            </p>
            <Notice />
          </div>
          <form className="form-card" onSubmit={submit}>
            <h2>
              {mode === "login"
                ? "Bienvenido de nuevo"
                : mode === "signup"
                  ? "Crea tu cuenta"
                  : "Recupera tu acceso"}
            </h2>
            <label>
              Correo electrónico
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="tu@correo.com"
              />
            </label>
            {mode !== "recover" && (
              <label>
                Contraseña
                <input
                  type="password"
                  name="password"
                  required
                  minLength={8}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                />
              </label>
            )}
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <button className="button" disabled={!configured || busy}>
              {busy
                ? "Un momento…"
                : mode === "login"
                  ? "Entrar"
                  : mode === "signup"
                    ? "Crear cuenta"
                    : "Enviar enlace"}
            </button>
            {!configured && (
              <p className="muted">
                Las cuentas se habilitarán al conectar la tienda.
              </p>
            )}
            <div className="form-links">
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
              >
                {mode === "login" ? "Crear una cuenta" : "Ya tengo cuenta"}
              </button>
              <button type="button" onClick={() => setMode("recover")}>
                Olvidé mi contraseña
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div className="account-top">
            <p>{user.email}</p>
            <button
              className="text-link"
              onClick={async () => {
                await api("/api/auth/logout", {});
                await refresh();
              }}
            >
              <LogOut size={16} /> Cerrar sesión
            </button>
          </div>
          {error && <p role="alert">{error}</p>}
          <Tabs defaultValue="library">
            <TabsList>
              <TabsTrigger value="library">Mi biblioteca</TabsTrigger>
              <TabsTrigger value="orders">Mis pedidos</TabsTrigger>
            </TabsList>
            <TabsContent value="library">
              {library.length ? (
                library.map((item) => (
                  <div className="library-item" key={item.id}>
                    <BookOpen />
                    <div>
                      <h3>{item.name}</h3>
                      <p>
                        {item.kind === "audio"
                          ? "Meditación"
                          : "Recurso digital"}
                      </p>
                    </div>
                    <button
                      className="button"
                      onClick={() => access(item.id, item.name, item.kind)}
                    >
                      Abrir contenido
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty">
                  <BookOpen size={36} />
                  <h2>Tu biblioteca está por comenzar</h2>
                  <p>
                    Aquí aparecerán tus contenidos cuando completes una compra.
                  </p>
                  <a className="button" href="/meditaciones">
                    Explorar meditaciones
                  </a>
                </div>
              )}
            </TabsContent>
            <TabsContent value="orders">
              {orders.length ? (
                orders.map((o) => (
                  <div className="library-item" key={o.id}>
                    <Package />
                    <div>
                      <strong>Pedido {o.id.slice(0, 8)}</strong>
                      <p>
                        {new Date(o.created_at).toLocaleDateString("es-MX")} ·{" "}
                        {o.status}
                      </p>
                    </div>
                    <span>{money(o.total)}</span>
                  </div>
                ))
              ) : (
                <div className="empty">
                  <h2>Aún no tienes pedidos</h2>
                  <a href="/tienda">Descubrir la tienda</a>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
      <Dialog
        open={!!asset}
        onOpenChange={(v) => {
          if (!v) setAsset(null);
        }}
      >
        <DialogContent>
          <DialogTitle>{asset?.name}</DialogTitle>
          <DialogDescription>Contenido de tu biblioteca</DialogDescription>
          {asset && <AudioPlayer name={asset.name} src={asset.src} />}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function PayPalButton() {
  const { cart, clientId, clear } = useShop();
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let buttons: any;
    let alive = true;
    let order = "";
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=MXN&intent=capture`;
    script.onload = () => {
      if (!alive || !ref.current) return;
      buttons = (window as any).paypal.Buttons({
        style: { layout: "vertical", label: "pay" },
        createOrder: async () => {
          try {
            const d = await api("/api/checkout/orders", { items: cart });
            order = d.orderId;
            return d.paypalId;
          } catch (e) {
            setError((e as Error).message);
            throw e;
          }
        },
        onApprove: async (data: any) => {
          try {
            await api("/api/checkout/capture", {
              orderId: order,
              paypalId: data.orderID,
            });
            clear();
            location.assign("/mi-cuenta");
          } catch (e) {
            setError((e as Error).message);
          }
        },
        onCancel: () =>
          setError("Pago cancelado. Tu carrito sigue disponible."),
        onError: () =>
          setError(
            "No fue posible completar el pago. Revisa tus pedidos antes de reintentar.",
          ),
      });
      void buttons.render(ref.current);
    };
    script.onerror = () =>
      setError("No se pudo cargar PayPal. Intenta de nuevo.");
    document.body.appendChild(script);
    return () => {
      alive = false;
      buttons?.close();
      script.remove();
    };
  }, [clientId, JSON.stringify(cart)]);
  return (
    <>
      <div ref={ref} />
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </>
  );
}
function Cart() {
  const { cart, products, update, configured, checkout, user } = useShop();
  const items = cart.map((i) => ({
    ...i,
    p: products.find((p) => p.id === i.id),
  }));
  const subtotal = items.reduce(
    (s, i) => s + (i.p?.price || 0) * i.quantity,
    0,
  );
  const physical = items.some((i) => i.p?.kind === "physical");
  return (
    <section className="section page-section">
      <Heading
        label="ELEGIDO POR TI"
        title="Tu carrito"
        description="Un paso más cerca de tu próximo ritual."
      />
      {!cart.length ? (
        <div className="empty">
          <ShoppingBag size={44} strokeWidth={1} />
          <h2>Hay espacio para algo especial</h2>
          <p>Aún no has agregado productos a tu carrito.</p>
          <a className="button" href="/tienda">
            Explorar la tienda <ArrowRight size={16} />
          </a>
        </div>
      ) : (
        <div className="cart-layout">
          <div>
            {items.map(({ id, quantity, p }) => (
              <div className="cart-row" key={id}>
                {p && <img src={p.image} alt={p.name} />}
                <div className="cart-info">
                  <a href={"/producto/" + id}>
                    <h3>{p?.name || "Producto no disponible"}</h3>
                  </a>
                  <p>
                    {p?.kind === "physical"
                      ? "Producto físico"
                      : "Contenido digital"}
                  </p>
                  <span>{money(p?.price || 0)}</span>
                </div>
                <div className="quantity">
                  <button
                    aria-label={"Quitar una unidad de " + p?.name}
                    onClick={() => update(id, quantity - 1)}
                  >
                    <Minus size={14} />
                  </button>
                  <span>{quantity}</span>
                  <button
                    aria-label={"Añadir una unidad de " + p?.name}
                    onClick={() => update(id, quantity + 1)}
                    disabled={
                      quantity >=
                      (p?.kind === "physical" ? Math.min(p.stock, 20) : 1)
                    }
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button
                  className="icon-button"
                  aria-label={"Eliminar " + p?.name}
                  onClick={() => update(id, 0)}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
            <a className="text-link breadcrumb" href="/tienda">
              <ArrowLeft size={16} /> Seguir explorando
            </a>
          </div>
          <aside className="order-summary">
            <h2>Resumen de tu pedido</h2>
            <div>
              <span>Subtotal</span>
              <strong>{money(subtotal)}</strong>
            </div>
            <div>
              <span>Envío</span>
              <span>{physical ? "Se confirma al pagar" : "No aplica"}</span>
            </div>
            <p className="muted">
              Precios en MXN. El total definitivo se valida antes de aprobar el
              pago.
            </p>
            <Notice />
            {checkout && user ? (
              <PayPalButton />
            ) : (
              <>
                <button className="button" disabled>
                  <LockKeyhole size={16} />{" "}
                  {checkout ? "Inicia sesión para pagar" : "Pagos próximamente"}
                </button>
                {checkout && !user && (
                  <a className="text-link" href="/mi-cuenta">
                    Iniciar sesión
                  </a>
                )}
              </>
            )}
            <p className="payment-mark">
              Pay<span>Pal</span>
            </p>
            <p className="muted">
              Tu selección se guarda solo en este navegador. No se reserva
              inventario hasta iniciar el pago.
            </p>
          </aside>
        </div>
      )}
    </section>
  );
}

function Admin() {
  const { products, configured, user, refresh } = useShop();
  const [rows, setRows] = useState<
      { sku: string; stock: number; price?: number }[]
    >([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const canEdit = configured && user?.admin;
  async function importFile(file: File) {
    try {
      if (file.size > 1000000)
        throw new Error("El CSV debe pesar menos de 1 MB.");
      setRows(parseInventoryCSV(await file.text()));
      setError("");
    } catch (e) {
      setError((e as Error).message);
      setRows([]);
    }
  }
  async function apply() {
    setBusy(true);
    try {
      await api("/api/admin/inventory", { rows });
      toast.success("Inventario actualizado");
      setRows([]);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="section page-section">
      <Heading
        label="ADMINISTRACIÓN"
        title="Cuida cada detalle"
        description="Gestiona tu catálogo y revisa el inventario de tus piezas."
      />
      {!canEdit && (
        <div className="notice">
          Vista de muestra. Para guardar cambios necesitas conectar Supabase e
          iniciar sesión con un rol administrador.
        </div>
      )}
      <div className="admin-stats">
        <div>
          <Package />
          <strong>
            {products.filter((p) => p.kind === "physical").length}
          </strong>
          <span>Productos físicos</span>
        </div>
        <div>
          <Headphones />
          <strong>20</strong>
          <span>Audios gratuitos de muestra</span>
        </div>
        <div>
          <ShoppingBag />
          <strong>
            {products
              .filter((p) => p.kind === "physical")
              .reduce((n, p) => n + p.stock, 0)}
          </strong>
          <span>Unidades disponibles</span>
        </div>
      </div>
      <Tabs defaultValue="inventory">
        <TabsList>
          <TabsTrigger value="inventory">Inventario</TabsTrigger>
          <TabsTrigger value="import">Importar CSV</TabsTrigger>
          <TabsTrigger value="media">Archivos</TabsTrigger>
        </TabsList>
        <TabsContent value="inventory">
          <div className="table-wrap">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Disponible</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.sku}</TableCell>
                    <TableCell>{money(p.price)}</TableCell>
                    <TableCell>
                      {p.kind === "physical" ? p.stock : "Digital"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="import">
          <div className="import-panel">
            <Upload size={30} />
            <h2>Actualiza desde tu hoja de cálculo</h2>
            <p>
              Exporta tu Excel a CSV. Columnas: sku, stock y price (precio
              opcional en centavos). Las cantidades se suman al inventario como
              ajustes; usa negativos para retirar unidades.
            </p>
            <a href="/inventory-template.csv" download className="text-link">
              Descargar plantilla <Download size={16} />
            </a>
            <label className="file-input">
              Seleccionar CSV
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  if (e.target.files?.[0]) void importFile(e.target.files[0]);
                }}
              />
            </label>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            {rows.length > 0 && (
              <>
                <h3>Vista previa · {rows.length} ajustes</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Ajuste</TableHead>
                      <TableHead>Precio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.sku}>
                        <TableCell>{r.sku}</TableCell>
                        <TableCell>
                          {r.stock > 0 ? "+" : ""}
                          {r.stock}
                        </TableCell>
                        <TableCell>
                          {r.price === undefined
                            ? "Sin cambios"
                            : money(r.price)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <button
                  className="button"
                  disabled={!canEdit || busy}
                  onClick={apply}
                >
                  {busy ? "Aplicando…" : "Confirmar ajustes"}
                </button>
              </>
            )}
          </div>
        </TabsContent>
        <TabsContent value="media">
          <MediaUpload enabled={!!canEdit} />
        </TabsContent>
      </Tabs>
    </section>
  );
}
function MediaUpload({ enabled }: { enabled: boolean }) {
  const { products } = useShop();
  const [id, setId] = useState(products[0]?.id || ""),
    [kind, setKind] = useState("image"),
    [busy, setBusy] = useState(false),
    [file, setFile] = useState<File | null>(null);
  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    try {
      const d = await api("/api/admin/upload", {
        productId: id,
        kind,
        filename: file.name,
        contentType: file.type,
        size: file.size,
      });
      const res = await fetch(d.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error("No se pudo subir el archivo.");
      await api("/api/admin/upload/complete", {
        productId: id,
        kind,
        path: d.path,
      });
      toast.success("Archivo vinculado al producto");
      setFile(null);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="form-card media-form" onSubmit={upload}>
      <h2>Imágenes, videos y contenido privado</h2>
      <p>
        Las imágenes y demostraciones son públicas. Los audios y PDFs de pago se
        guardan en un espacio privado.
      </p>
      <label>
        Producto
        <select value={id} onChange={(e) => setId(e.target.value)}>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Tipo de archivo
        <select value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="image">Imagen de producto</option>
          <option value="video">Video de demostración</option>
          <option value="audio">Audio privado</option>
          <option value="ebook">PDF privado</option>
        </select>
      </label>
      <input
        aria-label="Archivo a subir"
        type="file"
        accept={
          kind === "image"
            ? "image/jpeg,image/png,image/webp"
            : kind === "video"
              ? "video/mp4"
              : kind === "audio"
                ? "audio/mpeg,audio/wav"
                : "application/pdf"
        }
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button className="button" disabled={!enabled || !file || busy}>
        {busy ? "Subiendo…" : "Subir archivo"}
      </button>
    </form>
  );
}
export function ShopViews({
  view,
  productId,
}: {
  view: string;
  productId?: string;
}) {
  switch (view) {
    case "tienda":
      return <Catalog />;
    case "producto":
      return <ProductDetail id={productId} />;
    case "meditaciones":
      return <Meditations />;
    case "recursos":
      return <Resources />;
    case "cursos":
      return <Courses />;
    case "mi-cuenta":
      return <Account />;
    case "carrito":
      return <Cart />;
    case "admin":
      return <Admin />;
    default:
      return null;
  }
}
