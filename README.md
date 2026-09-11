# Alma & Tierra

Plataforma de tienda y contenidos holísticos en español. React 19, TypeScript y rutas de Next.js ejecutadas mediante Vinext/Vite; despliegue compatible con Cloudflare Workers y Sites. Backend preparado para Supabase PostgreSQL/Auth/Storage y PayPal Orders v2 por HTTPS.

## Estado entregado

- Web adaptable: inicio, catálogo de 6 categorías, filtros/búsqueda/ordenamiento, ficha con galería y soporte de video, carrito local, biblioteca de 20 audios gratuitos, PDF, artículo, cursos, cuenta y administración.
- Cuatro productos físicos y cuatro digitales/cursos de muestra. Fotografías ilustrativas, precios no comerciales. Las categorías sin muestras muestran un estado vacío.
- 20 WAV originales breves con voz sintética Microsoft Sabina (no grabaciones del cliente); un PDF original de muestra. No se simulan compras exitosas ni cuentas.
- Carrito como borrador local; pedidos, inventario, permisos y archivos premium son del servidor.
- API de autenticación, recuperación, biblioteca, enlaces firmados, importación y subida, creación/captura PayPal, verificación de webhooks y conciliación. Desactivada sin credenciales.
- Migración PostgreSQL con RLS y funciones transaccionales. NO aplicada ni probada contra un Supabase real porque el proyecto aún no existe.

## Ejecutar localmente

Node 22.13 o superior. Instalar con `npm ci`; iniciar con `npm run dev` en http://localhost:5173. Compilar con `npm run build`.
En este equipo el envoltorio npm del sistema presentó un error; alternativa: `node "C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js" ci`.

## Conectar Supabase y PayPal

1. Crear proyecto Supabase. Ejecutar `supabase/migrations/001_commerce.sql` y después `supabase/seed.sql` desde el editor SQL. Las muestras se crean con `purchasable=false`.
2. Copiar `.env.example` a `.env` (ignorada por Git); en Sites usar variables de entorno del sitio. Configurar URL, clave anónima y service role. Todas se leen solo en servidor; la service role nunca se devuelve al navegador.
3. Configurar Supabase Auth: Site URL al origen definitivo, permitir `/recuperar`, confirmar email y configurar SMTP. El flujo de recuperación implementado usa el token de recuperación en el fragmento URL; no habilitar PKCE sin adaptar el callback. Las sesiones son cookies HttpOnly de una hora; al expirar se vuelve a iniciar sesión.
4. Registrar un usuario y asignar administrador mediante SQL: `insert into public.user_roles(user_id,role) values ('UUID_DEL_USUARIO','admin');`. No existe un endpoint de autoasignación.
5. Iniciar sesión en `/mi-cuenta`. Usar `/admin` para importar ajustes de stock y subir imágenes/videos/archivos privados. Gestionar altas y textos del catálogo desde la tabla products en Supabase. Archivos: máximo 50 MB por subida.
6. Crear app PayPal Sandbox. Configurar client ID, secret, merchant ID y webhook ID. Suscribir `/api/webhooks/paypal` a PAYMENT.CAPTURE.COMPLETED, PAYMENT.CAPTURE.REFUNDED y PAYMENT.CAPTURE.REVERSED.
7. Configurar APP_ORIGIN exacto (sin barra final), tarifa fija de envío en centavos MXN y COMMERCE_ENABLED=true únicamente tras cargar productos reales y marcar sus filas `purchasable=true`. Moneda MXN; los envíos se restringen a MX antes de capturar. Los productos digitales requieren archivo privado.
8. Ejecutar pruebas Sandbox completas antes de usar PAYPAL_ENV=live. Nunca habilitar producción solo por haber compilado la interfaz.

## Operación y límites explícitos

- El servidor recalcula precios y reserva stock con bloqueos de fila. La captura se valida por orden, importe, moneda y destinatario; la concesión de acceso y pago se guardan en una misma transacción.
- Programar POST `/api/jobs/reconcile` con `Authorization: Bearer CRON_SECRET`. Concilia hasta 50 pedidos pendientes y conserva reservas cuando el estado de PayPal es incierto. No hay programador configurado automáticamente.
- Las órdenes sin ID de PayPal y las reservas abandonadas requieren revisión manual antes de liberarlas con `release_order`. Esto evita reponer inventario de una captura incierta. No hay expiración automática de reservas en esta versión.
- Reembolsos: suspenden los permisos del pedido y pasan a `refund_review`. Los parciales requieren restituir los permisos de las partidas no reembolsadas; no se devuelve stock físico automáticamente.
- La entrega digital está disponible desde la biblioteca. La tabla outbox_jobs deja pendientes las notificaciones; no se implementó ni conectó un proveedor de correos de pedidos. Supabase maneja sus propios correos de autenticación.
- Importación CSV de hasta 500 filas: `sku,stock,price`, donde stock es un ajuste relativo y price son centavos opcionales. No hay sincronización automática con Excel ni lectura directa de XLSX. Importar una segunda vez aplica un segundo ajuste; revisar antes de confirmar.
- La landing de cursos muestra un programa propuesto. No se habilitan inscripciones hasta configurar agenda/instructor y desarrollar el flujo de inscripción específico. No se inventaron fechas, profesores ni links de reuniones.
- Tarifas avanzadas, impuestos fiscales específicos, logística, cupones, seguimiento de envíos y un LMS completo quedan fuera de esta versión.
- Una URL firmada vence a la hora; un archivo ya descargado no se puede revocar. La biblioteca puede generar otro enlace tras validar de nuevo el permiso.
- Antes de producción: revisar RLS y accesos con dos usuarios, poner límites de solicitudes y CAPTCHA en Supabase Auth/WAF, configurar copias de seguridad, monitoreo y procesos de restauración.

## Validación

`node node_modules/typescript/bin/tsc --noEmit`

`node --experimental-strip-types --test tests/inventory.test.mjs`

Con el servidor de demostración activo: `node tests/smoke.mjs`.

Estas pruebas no sustituyen pruebas integradas de Supabase/PayPal. Probar allí concurrencia por última unidad, captura repetida, webhooks desordenados y duplicados, reembolsos y accesos entre cuentas.

## Fotografías

Amatista: Sergio Li / Unsplash (https://unsplash.com/photos/a-pile-of-purple-crystals-jgkkNYJVlbU). Cuenco: Content Pixie / Unsplash (https://unsplash.com/photos/singing-bowl-and-mallet-rest-on-books-GJx_vOcR1cI). Ritual: Cup of Couple / Pexels (https://www.pexels.com/photo/singing-bowl-on-the-table-6634253/). Cuenco: Clayton Leite / Pexels (https://www.pexels.com/photo/singing-bowl-for-meditation-10574239/). Se muestran desde sus URLs y bajo sus licencias respectivas; sustituir por imágenes del inventario real.
