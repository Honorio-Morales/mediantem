# MEDIANTEM — Especificación Técnica Completa

> Documento de referencia para el equipo de desarrollo · Versión 1.0 · 2026  
> **Integrantes:** Honorio · Marcir · Jose

---

## Índice

1. [Visión general del sistema](#1-visión-general-del-sistema)
2. [Tecnologías y versiones](#2-tecnologías-y-versiones)
3. [Arquitectura del sistema](#3-arquitectura-del-sistema)
4. [Estructura de carpetas](#4-estructura-de-carpetas)
5. [Gestión del repositorio y ramas](#5-gestión-del-repositorio-y-ramas)
6. [Base de datos — Schema completo](#6-base-de-datos--schema-completo)
7. [API REST — Especificación de endpoints](#7-api-rest--especificación-de-endpoints)
8. [Autenticación JWT — Flujo completo](#8-autenticación-jwt--flujo-completo)
9. [Frontend — Páginas y componentes](#9-frontend--páginas-y-componentes)
10. [Backend — Módulos y responsabilidades](#10-backend--módulos-y-responsabilidades)
11. [Variables de entorno](#11-variables-de-entorno)
12. [Reglas de código y convenciones](#12-reglas-de-código-y-convenciones)
13. [Orden de desarrollo sugerido](#13-orden-de-desarrollo-sugerido)

---

## 1. Visión general del sistema

Mediantem es una aplicación web **full stack** de comercio electrónico B2C (Direct to Consumer) para la venta de calcetines de diseño original. El sistema se compone de tres módulos principales:

| Módulo | Descripción |
|--------|-------------|
| **E-commerce** | Catálogo, detalle de producto, carrito, checkout y confirmación de compra |
| **Foro de comunidad** | Espacio donde usuarios registrados crean hilos y responden mensajes |
| **Panel de administración** | Dashboard con estadísticas, gestión de productos, pedidos e inventario |

El sistema opera con una separación clara entre frontend y backend. El frontend consume el backend exclusivamente a través de una API REST. No hay lógica de negocio en el frontend: toda regla de validación, cálculo de precio, verificación de stock y autenticación ocurre en el servidor.

---

## 2. Tecnologías y versiones

### Frontend

| Tecnología | Versión | Rol |
|-----------|---------|-----|
| Astro | 4.x | Framework principal de renderizado de páginas |
| React | 18.x | Componentes interactivos (islas de hidratación) |
| Tailwind CSS | 3.x | Sistema de estilos utility-first |
| Zustand | 4.x | Estado global del cliente (carrito, auth, wishlist) |
| TypeScript | 5.x | Tipado estático en todo el frontend |

### Backend

| Tecnología | Versión | Rol |
|-----------|---------|-----|
| Node.js | 20.x LTS | Entorno de ejecución del servidor |
| Express | 4.x | Framework HTTP y enrutamiento de la API |
| SQLite (better-sqlite3) | 9.x | Base de datos relacional embebida |
| bcrypt | 5.x | Hash seguro de contraseñas |
| jsonwebtoken | 9.x | Generación y verificación de tokens JWT |
| Zod | 3.x | Validación de esquemas en cuerpos de petición |
| cors | 2.x | Control de acceso cross-origin |
| helmet | 7.x | Headers de seguridad HTTP |
| morgan | 1.x | Logging de peticiones HTTP en desarrollo |

### Servicios externos

| Servicio | Uso |
|---------|-----|
| Cloudinary | Almacenamiento y CDN de imágenes de producto |
| Resend | Envío de emails transaccionales (confirmación de pedido, recuperación de contraseña) |
| Culqi o Niubiz | Pasarela de pago con soporte para tarjetas, Yape y Plin en Perú |

### Infraestructura de despliegue

| Componente | Plataforma |
|-----------|-----------|
| Frontend | Vercel — deploy automático desde rama `main` de GitHub |
| Backend | Railway o Render — Node.js con SQLite persistente |
| Dominio | `mediantem.com` o `mediantem.pe` |

---

## 3. Arquitectura del sistema

### Diagrama general

```
┌─────────────────────────────────────────────────────────────┐
│                        NAVEGADOR                             │
│                                                             │
│   Astro Pages (SSR / SSG)                                   │
│       └── React Islands (hidratación selectiva en cliente)  │
│                └── Zustand Store (estado en memoria)        │
│                        └── lib/api.ts                       │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS · JSON · REST
                           │ Header: Authorization: Bearer <JWT>
┌──────────────────────────▼──────────────────────────────────┐
│                 BACKEND  Express  (puerto 3001)              │
│                                                             │
│   server.js                                                 │
│       └── middlewares globales                              │
│               helmet · cors · morgan · express.json         │
│       └── Router                                            │
│               /api/auth                                     │
│               /api/products                                 │
│               /api/orders                                   │
│               /api/reviews                                  │
│               /api/forum                                    │
│               /api/stats                                    │
│       └── Middlewares de ruta                               │
│               auth.js (verifica JWT)                        │
│               isAdmin.js (verifica rol)                     │
│               validate.js (valida body con Zod)             │
│       └── Controllers (lógica de negocio)                   │
│       └── Models (acceso a SQLite)                          │
│       └── Services (Cloudinary · Resend · Culqi)            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │   SQLite    │
                    │ mediantem.db│
                    └─────────────┘
```

### Patrón de arquitectura frontend — Streaming Architecture

El frontend divide la interfaz en tres niveles que determinan si un componente se renderiza en servidor o en cliente:

```
Nivel 1 — PAGE  (Astro · renderizado en servidor)
│   Define la ruta, hace fetch de datos, genera HTML estático
│   Ejemplo: src/pages/shop/index.astro
│
└── Nivel 2 — SECTION  (Astro · bloque de contenido)
    │   Bloque semántico dentro de la página. Sin estado propio.
    │   Ejemplo: HeroSection.astro, BenefitsBar.astro
    │
    └── Nivel 3 — COMPONENT  (React · isla interactiva)
            Tiene estado local o accede a Zustand.
            Se hidrata en el cliente SOLO cuando entra en viewport.
            Ejemplo: ProductCarousel.tsx, CartDrawer.tsx, CountdownTimer.tsx
```

**Regla:** si un componente NO necesita interactividad (clicks, estado, efectos), debe ser `.astro`. Si necesita estado o eventos del usuario, debe ser `.tsx` con `client:visible` o `client:load`.

### Patrón de arquitectura backend — MVC

```
Route
  └── Middleware (auth · isAdmin · validate)
        └── Controller  ←→  Service (Cloudinary / Resend / Culqi)
                └── Model
                      └── SQLite (better-sqlite3)
```

- **Route:** solo define el path HTTP y los middlewares aplicables.
- **Middleware:** intercepta la petición antes del controller para verificar auth, rol o validar el body.
- **Controller:** contiene la lógica de negocio. Llama a uno o varios modelos y/o servicios, construye la respuesta.
- **Model:** contiene todas las queries SQL. El controller nunca escribe SQL directamente.
- **Service:** encapsula la comunicación con servicios externos (Cloudinary, Resend, Culqi).

---

## 4. Estructura de carpetas

La siguiente estructura es la que debe existir en el repositorio. Cada archivo es descrito con su responsabilidad exacta.

```
mediantem/
│
├── README.md                        ← Instrucciones de instalación y arranque
├── SPEC.md                          ← Este documento
├── .gitignore                       ← node_modules, .env, *.db, dist/
│
├── frontend/
│   ├── astro.config.mjs             ← Configuración de Astro: integración React + Tailwind,
│   │                                   output hybrid (SSR para páginas dinámicas)
│   ├── tailwind.config.mjs          ← Paleta de colores brand.negro/rojo/azul/gris,
│   │                                   fuentes Montserrat (display) e Inter (body)
│   ├── tsconfig.json                ← TypeScript strict mode, paths alias @/* → src/*
│   ├── package.json
│   ├── .env                         ← NO subir a Git (ver sección 11)
│   │
│   ├── public/
│   │   ├── favicon.svg
│   │   └── fonts/                   ← Montserrat e Inter en self-hosted (woff2)
│   │
│   └── src/
│       │
│       ├── pages/                   ── NIVEL 1: Rutas del sitio ──────────────────
│       │   ├── index.astro          ← Ruta / → Landing Page
│       │   ├── about.astro          ← Ruta /about → About / Exclusive Offer
│       │   ├── cart.astro           ← Ruta /cart → Carrito de compras
│       │   ├── checkout.astro       ← Ruta /checkout → Formulario de compra
│       │   ├── success.astro        ← Ruta /order/success → Confirmación de compra
│       │   │
│       │   ├── shop/
│       │   │   └── index.astro      ← Ruta /shop → Catálogo (Discover)
│       │   │
│       │   ├── product/
│       │   │   └── [id].astro       ← Ruta /product/:id → Detalle de producto
│       │   │                           Recibe id como parámetro dinámico
│       │   │                           Hace fetch a GET /api/products/:id en servidor
│       │   │
│       │   ├── forum/
│       │   │   ├── index.astro      ← Ruta /forum → Lista de hilos del foro
│       │   │   └── [id].astro       ← Ruta /forum/:id → Hilo individual con respuestas
│       │   │
│       │   └── account/
│       │       ├── index.astro      ← Ruta /account → Perfil del usuario
│       │       │                       Protegida: redirige a / si no hay sesión
│       │       ├── orders.astro     ← Ruta /account/orders → Historial de pedidos
│       │       └── wishlist.astro   ← Ruta /account/wishlist → Lista de deseos
│       │
│       ├── admin/                   ── Rutas del panel admin ─────────────────────
│       │   ├── index.astro          ← Ruta /admin → Dashboard principal
│       │   │                           Protegida: redirige a / si role !== 'admin'
│       │   ├── products.astro       ← Ruta /admin/products → Gestión de catálogo
│       │   ├── orders.astro         ← Ruta /admin/orders → Gestión de pedidos
│       │   └── stats.astro          ← Ruta /admin/stats → Estadísticas avanzadas
│       │
│       ├── layouts/                 ── Plantillas HTML base ──────────────────────
│       │   ├── BaseLayout.astro     ← HTML base: <head>, meta SEO, carga de fuentes,
│       │   │                           variables CSS globales. Todos los layouts lo extienden.
│       │   ├── ShopLayout.astro     ← Extiende BaseLayout. Incluye Navbar + Footer.
│       │   │                           Usado por todas las páginas de la tienda.
│       │   └── AdminLayout.astro    ← Extiende BaseLayout. Incluye sidebar de navegación
│       │                               admin y verifica rol antes de renderizar.
│       │
│       ├── components/
│       │   │
│       │   ├── ui/                  ── Átomos de interfaz reutilizables ──────────
│       │   │   ├── Button.astro     ← Variantes: primary (rojo), secondary (negro),
│       │   │   │                       ghost (borde). Props: label, href, onClick, disabled.
│       │   │   ├── Badge.astro      ← Etiquetas pequeñas: "Limited", "Sale", "New".
│       │   │   │                       Props: text, variant (red/black/gray).
│       │   │   ├── Input.astro      ← Input estilizado con label y mensaje de error.
│       │   │   │                       Props: name, label, type, placeholder, error.
│       │   │   ├── Modal.tsx        ← Modal genérico con overlay. React: maneja
│       │   │   │                       isOpen/onClose como props. Usado por AuthModal.
│       │   │   └── Toast.tsx        ← Notificaciones temporales (éxito/error).
│       │   │                           Se activa desde cualquier componente vía Zustand.
│       │   │
│       │   ├── shared/              ── Componentes presentes en todas las páginas ─
│       │   │   ├── Navbar.astro     ← Logo Mediantem a la izquierda.
│       │   │   │                       Links de navegación en el centro.
│       │   │   │                       CartButton + AuthButton a la derecha.
│       │   │   │                       En mobile: menú hamburguesa.
│       │   │   │                       Lee authStore para mostrar "Mi cuenta" o "Login".
│       │   │   ├── Footer.astro     ← Logo, links a redes sociales (Facebook, Pinterest,
│       │   │   │                       Snapchat, Instagram, TikTok) y copyright.
│       │   │   └── BenefitsBar.astro← Franja horizontal de beneficios rápidos:
│       │   │                           "Limited-time offer · Soft and · Durable Materials ·
│       │   │                            Stylish · Perfect Fit · Great for gifting"
│       │   │                           + botón Buy Now a la derecha.
│       │   │
│       │   ├── shop/                ── Componentes del catálogo ──────────────────
│       │   │   ├── ProductCard.tsx  ← Tarjeta individual de producto.
│       │   │   │                       Muestra: imagen, nombre, precio, rating, stock limitado.
│       │   │   │                       Botón wishlist (corazón) que actualiza wishlistStore.
│       │   │   │                       Link a /product/:id al hacer click en la imagen.
│       │   │   ├── ProductCarousel.tsx ← Carrusel horizontal con flechas de navegación.
│       │   │   │                       Props: title, products[]. Reutilizable para
│       │   │   │                       "See what others say" y "Customer Favorites".
│       │   │   ├── BenefitsCarousel.tsx ← Carrusel de 6 tarjetas de beneficios:
│       │   │   │                       Customer, Quality, Style, Special, User, Limited Time.
│       │   │   │                       Cada tarjeta tiene icono + texto descriptivo.
│       │   │   └── InfluencerCards.astro ← 4 tarjetas de influencer con: handle, foto,
│       │   │                       seguidores, rating, miniaturas de posts y CTA individual.
│       │   │                       Los datos de influencers son estáticos (no vienen de la API).
│       │   │
│       │   ├── product/             ── Componentes de detalle de producto ─────────
│       │   │   ├── ProductGallery.tsx  ← Imagen principal grande + miniaturas clicables
│       │   │   │                       a la izquierda (mínimo 3). Al hacer click en
│       │   │   │                       miniatura, cambia la imagen principal.
│       │   │   ├── ProductInfo.tsx  ← Nombre, precio (con tachado si hay descuento),
│       │   │   │                       rating con estrellas y total de reseñas (link a reviews).
│       │   │   ├── VariantSelector.tsx ← Selector de color: botones cuadrados con color real.
│       │   │   │                       Selector de talla: botones S/M/L/XL, deshabilitados si
│       │   │   │                       no hay stock en esa combinación color+talla.
│       │   │   │                       Al cambiar variante actualiza el precio y stock mostrado.
│       │   │   ├── QuantityInput.tsx   ← Campo numérico con botones + y −.
│       │   │   │                       Mínimo 1, máximo = stock disponible de la variante.
│       │   │   ├── BuyNowButton.tsx    ← Al hacer click: agrega al cartStore y redirige a /checkout.
│       │   │   ├── AddToCartButton.tsx ← Al hacer click: agrega al cartStore y muestra Toast.
│       │   │   ├── WishlistButton.tsx  ← Corazón toggle. Si usuario no está autenticado
│       │   │   │                       abre AuthModal. Si está autenticado llama
│       │   │   │                       POST /api/wishlist y actualiza wishlistStore.
│       │   │   ├── RatingBar.tsx    ← Puntuación agregada (4.9/5) + total de valoraciones.
│       │   │   │                       Barras de progreso por nivel de estrella (1 a 5).
│       │   │   │                       Filtros: por tipo (imagen/texto) y por puntuación.
│       │   │   ├── ReviewCard.astro ← Tarjeta individual de reseña: avatar circular,
│       │   │   │                       nombre, título, texto, rating y fecha.
│       │   │   └── RelatedProducts.tsx ← Carrusel de 4 productos de la misma categoría.
│       │   │                       Excluye el producto actual. Props: categoryId, currentId.
│       │   │
│       │   ├── cart/                ── Carrito de compras ────────────────────────
│       │   │   ├── CartButton.tsx   ← Icono de carrito en el Navbar con badge numérico
│       │   │   │                       que muestra la cantidad total de items en cartStore.
│       │   │   │                       Al hacer click abre CartDrawer.
│       │   │   ├── CartDrawer.tsx   ← Panel lateral deslizante desde la derecha.
│       │   │   │                       Lista todos los items del cartStore con imagen,
│       │   │   │                       nombre, variante seleccionada, precio y controles
│       │   │   │                       de cantidad. Botón "Ir al checkout" al pie.
│       │   │   └── CartSummary.tsx  ← Resumen del pedido en la página /checkout:
│       │   │                           lista de items, subtotal, envío y total.
│       │   │
│       │   ├── auth/                ── Autenticación ────────────────────────────
│       │   │   ├── AuthModal.tsx    ← Modal que contiene LoginForm y RegisterForm
│       │   │   │                       con tabs para alternar entre ambos.
│       │   │   ├── LoginForm.tsx    ← Campos: email, password. Validación en cliente
│       │   │   │                       antes de enviar. Al éxito guarda tokens en authStore.
│       │   │   └── RegisterForm.tsx ← Campos: name, email, password, confirmPassword.
│       │   │                           Validación en cliente. Al éxito hace login automático.
│       │   │
│       │   ├── forum/               ── Foro de comunidad ─────────────────────────
│       │   │   ├── ThreadList.tsx   ← Lista de hilos ordenados por fecha.
│       │   │   │                       Cada hilo muestra: título, autor, fecha, contador
│       │   │   │                       de respuestas. Paginación o scroll infinito.
│       │   │   ├── ThreadCard.astro ← Tarjeta de preview de un hilo (versión estática).
│       │   │   ├── NewThreadForm.tsx← Formulario: título + cuerpo del mensaje.
│       │   │   │                       Solo visible si usuario está autenticado.
│       │   │   ├── MessageList.tsx  ← Lista de mensajes dentro de un hilo, con anidado
│       │   │   │                       de respuestas (máximo 2 niveles de profundidad).
│       │   │   └── NewMessageForm.tsx ← Caja de texto para responder.
│       │   │                           Solo visible si usuario está autenticado.
│       │   │
│       │   └── admin/               ── Panel de administración ───────────────────
│       │       ├── StatsCards.tsx   ← 4 tarjetas KPI: ventas del mes, pedidos pendientes,
│       │       │                       productos con poco stock, nuevos usuarios.
│       │       ├── SalesChart.tsx   ← Gráfico de línea de ventas por día/semana/mes.
│       │       │                       Datos de GET /api/stats/sales. Usar recharts o Chart.js.
│       │       ├── TopProductsChart.tsx ← Gráfico de barras con los 5 productos más vendidos.
│       │       ├── ProductTable.tsx ← Tabla con todos los productos: imagen miniatura, nombre,
│       │       │                       categoría, precio, stock, acciones (editar/eliminar).
│       │       │                       Paginación + buscador por nombre.
│       │       ├── ProductFormModal.tsx ← Modal con formulario para crear o editar producto:
│       │       │                       nombre, descripción, precio, categoría, imágenes
│       │       │                       (upload a Cloudinary), variantes de color y talla.
│       │       └── OrderTable.tsx   ← Tabla de pedidos con: id, cliente, total, estado,
│       │                               fecha. Dropdown para cambiar el estado del pedido.
│       │
│       ├── stores/                  ── Estado global Zustand ────────────────────
│       │   ├── cartStore.ts         ← Estado: items[] (CartItem), total calculado.
│       │   │                           Acciones: addItem, removeItem, updateQuantity,
│       │   │                           clearCart. Persiste en sessionStorage.
│       │   ├── authStore.ts         ← Estado: user (User|null), accessToken (string|null).
│       │   │                           Acciones: login, logout, setToken.
│       │   │                           El accessToken NUNCA se guarda en localStorage.
│       │   │                           Solo en memoria (Zustand) + refreshToken en cookie HttpOnly.
│       │   └── wishlistStore.ts     ← Estado: productIds[].
│       │                               Acciones: addToWishlist, removeFromWishlist, sync.
│       │                               Al iniciar sesión, sincroniza con GET /api/wishlist.
│       │
│       ├── lib/                     ── Utilidades del cliente ───────────────────
│       │   ├── api.ts               ← Wrapper de fetch para todas las llamadas a la API.
│       │   │                           Agrega automáticamente el header Authorization: Bearer.
│       │   │                           Si recibe 401, intenta refrescar el token y reintenta.
│       │   │                           Si el refresh falla, llama logout() en authStore.
│       │   ├── auth.ts              ← Función getAuthUser(request) para leer la sesión
│       │   │                           en el servidor de Astro (desde cookie de sesión).
│       │   │                           Usada en páginas protegidas para redirigir si no hay sesión.
│       │   └── formatters.ts        ← formatPrice(number): "S/. 19.99"
│       │                               formatDate(string): "20 de noviembre de 2025"
│       │                               formatRating(number): "4.9"
│       │
│       ├── types/
│       │   └── index.ts             ← Todas las interfaces TypeScript del proyecto:
│       │                               Product, ProductVariant, User, Order, OrderItem,
│       │                               CartItem, Review, ForumPost, AuthState.
│       │                               Se importan en frontend Y se replican en backend/src/types/
│       │                               para validar contra los mismos contratos.
│       │
│       └── styles/
│           └── global.css           ← Variables CSS custom (--color-brand-negro etc.),
│                                       estilos base de reset, tipografía por defecto,
│                                       clases utilitarias no cubiertas por Tailwind.
│
└── backend/
    ├── server.js                    ← Entry point. Crea la app Express, aplica middlewares
    │                                   globales (helmet, cors, morgan, express.json),
    │                                   monta todos los routers bajo /api, inicia el servidor.
    ├── package.json
    ├── .env                         ← NO subir a Git (ver sección 11)
    │
    └── src/
        ├── config/
        │   ├── database.js          ← Crea la conexión a SQLite con better-sqlite3.
        │   │                           Exporta el objeto db. Si el archivo .db no existe,
        │   │                           lo crea automáticamente en la ruta DB_PATH del .env.
        │   └── env.js               ← Lee process.env, valida que todas las variables
        │                               requeridas existan al arrancar (si falta alguna,
        │                               lanza error descriptivo y termina el proceso).
        │
        ├── models/                  ── Capa de acceso a datos ────────────────────
        │   │   (NINGÚN controlador escribe SQL directamente)
        │   ├── User.js              ← findById(id), findByEmail(email),
        │   │                           create({name,email,passwordHash,role}),
        │   │                           updatePassword(id, newHash)
        │   ├── Product.js           ← findAll({categoryId, limit, offset}),
        │   │                           findById(id), findWithVariants(id),
        │   │                           create(data), update(id, data), delete(id),
        │   │                           findByCategory(categoryId, excludeId)
        │   ├── ProductVariant.js    ← findByProduct(productId),
        │   │                           updateStock(variantId, newStock),
        │   │                           decrementStock(variantId, quantity)
        │   ├── Order.js             ← create({userId,items,total}),
        │   │                           findById(id), findByUser(userId),
        │   │                           findAll({status,limit,offset}),
        │   │                           updateStatus(id, status)
        │   ├── Review.js            ← findByProduct(productId, {rating,type,limit,offset}),
        │   │                           create({userId,productId,rating,title,body}),
        │   │                           getAggregated(productId)
        │   ├── ForumPost.js         ← findAll({limit,offset}), findById(id),
        │   │                           findReplies(parentId),
        │   │                           create({userId,title,body,parentId}),
        │   │                           delete(id)
        │   └── Wishlist.js          ← findByUser(userId), add(userId,productId),
        │                               remove(userId,productId)
        │
        ├── controllers/             ── Lógica de negocio ─────────────────────────
        │   ├── authController.js    ← register, login, logout, refreshToken,
        │   │                           forgotPassword, resetPassword
        │   ├── productController.js ← getAll, getById, create, update, delete
        │   ├── orderController.js   ← create, getById, getMyOrders, getAll, updateStatus
        │   ├── reviewController.js  ← getByProduct, create
        │   ├── forumController.js   ← getAll, getById, create, reply, delete
        │   ├── wishlistController.js← get, add, remove
        │   └── statsController.js   ← getSales, getTopProducts, getConversion, getOverview
        │
        ├── routes/                  ── Definición de endpoints HTTP ──────────────
        │   ├── auth.js              ← (ver sección 7 para detalle de cada endpoint)
        │   ├── products.js
        │   ├── orders.js
        │   ├── reviews.js
        │   ├── forum.js
        │   ├── wishlist.js
        │   └── stats.js
        │
        ├── middlewares/
        │   ├── auth.js              ← Lee header Authorization: Bearer <token>.
        │   │                           Verifica con jwt.verify(). Si es válido, agrega
        │   │                           req.user = { id, email, role } y llama next().
        │   │                           Si es inválido o expirado, responde 401.
        │   ├── isAdmin.js           ← Verifica req.user.role === 'admin'.
        │   │                           Si no, responde 403. Debe usarse DESPUÉS de auth.js.
        │   ├── validate.js          ← Recibe un schema de Zod como parámetro.
        │   │                           Valida req.body contra el schema.
        │   │                           Si falla, responde 400 con los errores detallados.
        │   └── errorHandler.js      ← Middleware de 4 argumentos (err,req,res,next).
        │                               Captura errores no manejados, los loguea y responde
        │                               con código apropiado (400, 404, 500).
        │
        ├── services/
        │   ├── emailService.js      ← sendOrderConfirmation(to, order): envía email HTML
        │   │                           al comprador con resumen del pedido usando Resend.
        │   │                           sendPasswordReset(to, token): email con link de reset.
        │   └── imageService.js      ← uploadImage(file): sube un archivo a Cloudinary
        │                               y devuelve la URL pública optimizada.
        │                               deleteImage(publicId): elimina imagen de Cloudinary.
        │
        └── utils/
            ├── jwt.js               ← generateAccessToken(payload): firma con JWT_SECRET,
            │                           expira en JWT_EXPIRES_IN.
            │                           generateRefreshToken(payload): firma con JWT_REFRESH_SECRET.
            │                           verifyAccessToken(token): verifica y devuelve payload.
            │                           verifyRefreshToken(token): ídem con refresh secret.
            └── response.js          ← success(res, data, code=200): { ok: true, data }
                                        error(res, message, code=400): { ok: false, message }
                                        paginated(res, data, total, page, limit): incluye meta de paginación
```

---

## 5. Gestión del repositorio y ramas

El proyecto usa **3 ramas principales** en GitHub, una por integrante, más `main` como rama de integración.

### Estructura de ramas

```
main                ← Rama de producción. Solo recibe merges desde las ramas de integrante.
                       Nadie hace commits directos aquí.
│
├── feature/honorio ← Rama de Honorio
├── feature/marcir  ← Rama de Marcir
└── feature/jose    ← Rama de Jose
```

### Reglas de trabajo

1. **Cada integrante trabaja únicamente en su rama.** No se hace push a `main` directamente.
2. Para integrar trabajo terminado a `main` se abre un **Pull Request** desde la rama personal.
3. El Pull Request debe ser revisado y aprobado por al menos otro integrante antes del merge.
4. Antes de abrir un PR, hacer `git pull origin main` desde la rama personal para resolver conflictos localmente.

### Asignación de módulos por rama

| Rama | Integrante | Módulo principal | Módulos de soporte |
|------|-----------|-----------------|-------------------|
| `feature/honorio` | Honorio | Backend completo (API + BD + Auth + Middlewares) | Stores Zustand, lib/api.ts |
| `feature/marcir` | Marcir | Frontend tienda (Landing, Shop, Product Details, Cart, Checkout, Success) | Componentes UI, layouts |
| `feature/jose` | Jose | Frontend foro + panel admin + páginas de cuenta | AdminLayout, componentes admin |

> Esta asignación es una sugerencia base. El equipo puede redistribuir según avance.

### Convención de commits

Usar el formato **Conventional Commits**:

```
tipo(ámbito): descripción corta en presente

Tipos:
  feat     → nueva funcionalidad
  fix      → corrección de bug
  style    → cambios de estilos/CSS sin lógica
  refactor → refactorización sin cambio de comportamiento
  docs     → cambios en documentación
  chore    → configuración, dependencias, scripts

Ejemplos:
  feat(auth): agregar endpoint de refresh token
  fix(cart): corregir cálculo de total con descuento
  style(landing): ajustar espaciado del hero section
  feat(admin): implementar tabla de productos con paginación
```

---

## 6. Base de datos — Schema completo

Motor: **SQLite** con `better-sqlite3`. El archivo de base de datos se crea automáticamente en la ruta definida en `DB_PATH` del `.env`.

### Tablas

#### `users`
```sql
CREATE TABLE users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL DEFAULT 'customer',  -- 'customer' | 'admin'
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

#### `categories`
```sql
CREATE TABLE categories (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT NOT NULL,        -- 'Casual', 'Dress', 'Athletic', 'Kids'
  slug  TEXT NOT NULL UNIQUE  -- 'casual', 'dress', 'athletic', 'kids'
);
```

#### `products`
```sql
CREATE TABLE products (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT    NOT NULL,
  description  TEXT    NOT NULL,
  price        REAL    NOT NULL,
  original_price REAL,          -- precio antes del descuento (puede ser NULL)
  category_id  INTEGER NOT NULL REFERENCES categories(id),
  is_limited   INTEGER NOT NULL DEFAULT 0,  -- 0 = false, 1 = true
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

#### `product_images`
```sql
CREATE TABLE product_images (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url         TEXT    NOT NULL,   -- URL de Cloudinary
  position    INTEGER NOT NULL DEFAULT 0  -- orden de aparición (0 = imagen principal)
);
```

#### `product_variants`
```sql
CREATE TABLE product_variants (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color      TEXT    NOT NULL,         -- nombre del color: 'Deep Black', 'Navy', 'Red'
  color_hex  TEXT    NOT NULL,         -- código hex: '#1A1A2E'
  size       TEXT    NOT NULL,         -- 'S' | 'M' | 'L' | 'XL'
  stock      INTEGER NOT NULL DEFAULT 0,
  UNIQUE(product_id, color, size)      -- no puede haber dos variantes iguales del mismo producto
);
```

#### `orders`
```sql
CREATE TABLE orders (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL REFERENCES users(id),
  status          TEXT    NOT NULL DEFAULT 'pending',
  -- 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  subtotal        REAL    NOT NULL,
  shipping_cost   REAL    NOT NULL DEFAULT 0,
  total           REAL    NOT NULL,
  shipping_name   TEXT    NOT NULL,
  shipping_address TEXT   NOT NULL,
  shipping_city   TEXT    NOT NULL,
  shipping_phone  TEXT    NOT NULL,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

#### `order_items`
```sql
CREATE TABLE order_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  INTEGER NOT NULL REFERENCES products(id),
  variant_id  INTEGER NOT NULL REFERENCES product_variants(id),
  product_name TEXT   NOT NULL,  -- snapshot del nombre al momento de compra
  price       REAL    NOT NULL,  -- snapshot del precio al momento de compra
  quantity    INTEGER NOT NULL
);
```

> Los campos `product_name` y `price` son snapshots: guardan el valor al momento de la compra para que cambios futuros en el producto no alteren el historial de pedidos.

#### `reviews`
```sql
CREATE TABLE reviews (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  rating     INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  title      TEXT    NOT NULL,
  body       TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, product_id)  -- un usuario solo puede dejar una reseña por producto
);
```

#### `forum_posts`
```sql
CREATE TABLE forum_posts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  title      TEXT,              -- solo en posts raíz (parent_id IS NULL)
  body       TEXT    NOT NULL,
  parent_id  INTEGER REFERENCES forum_posts(id) ON DELETE CASCADE,
  -- si parent_id IS NULL → es un hilo raíz
  -- si parent_id tiene valor → es una respuesta a ese hilo
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

#### `wishlist`
```sql
CREATE TABLE wishlist (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, product_id)
);
```

#### `refresh_tokens`
```sql
CREATE TABLE refresh_tokens (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  token      TEXT    NOT NULL UNIQUE,
  expires_at TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
-- Al hacer logout se borra el registro.
-- Al hacer refresh se reemplaza por uno nuevo (rotación de tokens).
```

### Diagrama de relaciones

```
users ──────────────── orders ────── order_items ──── products
  │                                                       │
  ├── reviews ──────────────────────────────────── products
  │                                                       │
  ├── wishlist ─────────────────────────────────── products
  │                                                       │
  ├── forum_posts (self-referencia parent_id)      product_images
  │                                                       │
  └── refresh_tokens                               product_variants
                                                          │
                                              categories ─┘
```

---

## 7. API REST — Especificación de endpoints

**Base URL:** `/api`  
**Formato de respuesta siempre:**
```json
{ "ok": true,  "data": { ... } }          // éxito
{ "ok": false, "message": "descripción" } // error
```

**Autenticación:** los endpoints marcados con 🔒 requieren el header:
```
Authorization: Bearer <accessToken>
```
Los marcados con 👑 requieren además `role === 'admin'`.

---

### Auth — `/api/auth`

| Método | Endpoint | Auth | Body | Respuesta exitosa |
|--------|----------|------|------|-------------------|
| POST | `/register` | — | `{name, email, password}` | `{user, accessToken}` + cookie refreshToken |
| POST | `/login` | — | `{email, password}` | `{user, accessToken}` + cookie refreshToken |
| POST | `/logout` | 🔒 | — | `{message: "ok"}` + borra cookie |
| POST | `/refresh` | — | cookie refreshToken | `{accessToken}` |
| POST | `/forgot-password` | — | `{email}` | `{message: "email enviado"}` |
| POST | `/reset-password` | — | `{token, newPassword}` | `{message: "ok"}` |

**Validaciones en register:**
- `name`: requerido, mínimo 2 caracteres
- `email`: requerido, formato email válido, único en BD
- `password`: requerido, mínimo 8 caracteres

**Comportamiento del refresh:**
- Lee el refreshToken de la cookie HttpOnly
- Verifica en la tabla `refresh_tokens` que exista y no haya expirado
- Genera un nuevo accessToken
- Rota el refreshToken (borra el viejo, guarda el nuevo)

---

### Products — `/api/products`

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/` | — | Lista todos los productos. Query params: `?category=slug&limit=10&page=1` |
| GET | `/:id` | — | Detalle de producto con variantes e imágenes |
| GET | `/:id/related` | — | 4 productos de la misma categoría (excluye el actual) |
| POST | `/` | 👑 | Crear producto con imágenes (multipart/form-data) |
| PUT | `/:id` | 👑 | Actualizar producto |
| DELETE | `/:id` | 👑 | Eliminar producto (borra imágenes de Cloudinary también) |

**Respuesta de GET `/:id`:**
```json
{
  "ok": true,
  "data": {
    "id": 1,
    "name": "Premium Soft Socks",
    "description": "...",
    "price": 19.99,
    "originalPrice": 24.99,
    "categoryId": 1,
    "isLimited": false,
    "images": ["https://res.cloudinary.com/..."],
    "variants": [
      { "id": 1, "color": "Deep Black", "colorHex": "#1A1A2E", "size": "M", "stock": 15 }
    ],
    "rating": 4.9,
    "reviewCount": 450
  }
}
```

---

### Orders — `/api/orders`

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/` | 🔒 | Crear pedido. Verifica stock de cada variante, descuenta stock, guarda pedido, envía email de confirmación |
| GET | `/mine` | 🔒 | Pedidos del usuario autenticado |
| GET | `/:id` | 🔒 | Detalle de un pedido (el usuario solo puede ver los suyos; admin puede ver cualquiera) |
| GET | `/` | 👑 | Todos los pedidos con filtro por status |
| PATCH | `/:id/status` | 👑 | Cambiar estado del pedido. Body: `{status}` |

**Body de POST `/`:**
```json
{
  "items": [
    { "variantId": 1, "quantity": 2 }
  ],
  "shipping": {
    "name": "Juan Pérez",
    "address": "Av. Sol 123",
    "city": "Cusco",
    "phone": "987654321"
  }
}
```

**Lógica de creación de pedido:**
1. Para cada item, verificar que la variante exista y tenga stock suficiente. Si alguna falla, responder 400 con qué variante tiene problema.
2. Calcular subtotal sumando `price × quantity` de cada producto.
3. Calcular total = subtotal + shipping_cost.
4. Iniciar transacción SQLite.
5. Insertar en `orders`.
6. Insertar en `order_items` con snapshots de nombre y precio.
7. Decrementar stock de cada `product_variants`.
8. Commit de la transacción.
9. Enviar email de confirmación vía `emailService`.

---

### Reviews — `/api/reviews`

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/:productId` | — | Reseñas de un producto. Query: `?rating=5&type=text&limit=10&page=1` |
| GET | `/:productId/summary` | — | Puntuación agregada: promedio, total y distribución por estrella |
| POST | `/` | 🔒 | Crear reseña. Un usuario solo puede tener una reseña por producto |

---

### Forum — `/api/forum`

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/` | — | Lista de hilos raíz (sin respuestas). Query: `?limit=10&page=1` |
| GET | `/:id` | — | Hilo completo con todas sus respuestas anidadas |
| POST | `/` | 🔒 | Crear nuevo hilo. Body: `{title, body}` |
| POST | `/:id/reply` | 🔒 | Responder a un hilo. Body: `{body}` |
| DELETE | `/:id` | 🔒 | Eliminar mensaje (solo el autor o un admin puede hacerlo) |

---

### Wishlist — `/api/wishlist`

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/` | 🔒 | Lista de productos en wishlist del usuario autenticado |
| POST | `/` | 🔒 | Agregar producto. Body: `{productId}` |
| DELETE | `/:productId` | 🔒 | Quitar producto de la wishlist |

---

### Stats — `/api/stats`

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/overview` | 👑 | KPIs: total ventas del mes, pedidos pendientes, productos con stock < 5, nuevos usuarios |
| GET | `/sales` | 👑 | Ventas agrupadas por día. Query: `?period=week|month|year` |
| GET | `/top-products` | 👑 | Top 5 productos por unidades vendidas |

---

## 8. Autenticación JWT — Flujo completo

### Tokens

| Token | Secret | Expiración | Almacenamiento |
|-------|--------|-----------|----------------|
| Access Token | `JWT_SECRET` | 15 minutos (producción) / 7 días (desarrollo) | Memoria — Zustand `authStore` |
| Refresh Token | `JWT_REFRESH_SECRET` | 30 días | Cookie HttpOnly, Secure, SameSite=Strict |

> El Access Token NUNCA se guarda en `localStorage` ni `sessionStorage`. Solo existe en memoria (Zustand). Al refrescar la página se pierde y se obtiene uno nuevo via el Refresh Token de la cookie.

### Flujo de registro

```
1. Usuario completa RegisterForm.tsx con name, email, password
2. Validación en cliente (Zod): si falla, muestra errores sin hacer fetch
3. POST /api/auth/register  { name, email, password }
4. Backend:
   a. Valida con middleware validate.js (Zod schema)
   b. Verifica que el email no exista en BD
   c. Hashea password con bcrypt (cost factor 12)
   d. Inserta usuario en tabla users
   e. Genera accessToken (JWT firmado con payload: {id, email, role})
   f. Genera refreshToken (JWT firmado con secret diferente)
   g. Guarda refreshToken en tabla refresh_tokens con expires_at
   h. Setea cookie HttpOnly: refreshToken=<valor>; HttpOnly; Secure; SameSite=Strict; Path=/api/auth
5. Respuesta: { ok: true, data: { user: {...}, accessToken: "..." } }
6. Frontend:
   a. authStore.login(user, accessToken)
   b. Cierra AuthModal
   c. Toast de bienvenida
```

### Flujo de login

```
1. Usuario completa LoginForm.tsx con email, password
2. POST /api/auth/login  { email, password }
3. Backend:
   a. Busca usuario por email en BD
   b. Si no existe → 401 "Credenciales incorrectas"
   c. bcrypt.compare(password, user.password_hash)
   d. Si no coincide → 401 "Credenciales incorrectas"
      (mismo mensaje que "no existe" para no revelar si el email está registrado)
   e. Genera accessToken y refreshToken
   f. Guarda refreshToken en refresh_tokens (borra el anterior si existía)
   g. Setea cookie HttpOnly
4. Respuesta: { ok: true, data: { user: {...}, accessToken: "..." } }
5. Frontend: igual que registro paso 6
```

### Flujo de petición autenticada

```
lib/api.ts hace fetch a cualquier endpoint protegido:
  → Agrega header: Authorization: Bearer <accessToken de authStore>
  → Si respuesta es 401:
      Intenta POST /api/auth/refresh (envía cookie automáticamente)
      Si refresh OK: guarda nuevo accessToken en authStore, reintenta petición original
      Si refresh falla (401): authStore.logout(), redirige a /
  → Si respuesta no es 401: devuelve la respuesta normal
```

### Flujo de logout

```
1. Usuario hace click en "Cerrar sesión"
2. POST /api/auth/logout  (con header Authorization)
3. Backend:
   a. Lee refreshToken de la cookie
   b. Borra registro de refresh_tokens en BD
   c. Responde con Set-Cookie que expire inmediatamente (borra la cookie)
4. Frontend:
   a. authStore.logout() → user = null, accessToken = null
   b. wishlistStore vacía su estado
   c. Redirige a /
```

### Protección de páginas Astro (servidor)

Las páginas que requieren autenticación deben verificar la sesión en el frontmatter de Astro:

```
En src/lib/auth.ts:
  getAuthUser(request):
    Lee la cookie refreshToken de la request
    Si existe, verifica con JWT
    Si es válido, busca el usuario en BD y lo devuelve
    Si no, devuelve null

En cualquier página protegida (ej. /account, /admin/*):
  const user = await getAuthUser(Astro.request)
  if (!user) return Astro.redirect('/')
  if (paginaAdmin && user.role !== 'admin') return Astro.redirect('/')
```

---

## 9. Frontend — Páginas y componentes

### Tabla completa de componentes

| Componente | Tipo | Hidratación | Store que usa |
|-----------|------|-------------|---------------|
| `Navbar.astro` | Astro | — | Lee authStore via script |
| `CartButton.tsx` | React | `client:load` | cartStore |
| `AuthModal.tsx` | React | `client:load` | authStore |
| `CartDrawer.tsx` | React | `client:load` | cartStore |
| `CountdownTimer.tsx` | React | `client:visible` | — |
| `ProductCarousel.tsx` | React | `client:visible` | wishlistStore |
| `BenefitsCarousel.tsx` | React | `client:visible` | — |
| `ProductGallery.tsx` | React | `client:load` | — |
| `ProductInfo.tsx` | Astro | — | — |
| `VariantSelector.tsx` | React | `client:load` | — |
| `QuantityInput.tsx` | React | `client:load` | — |
| `BuyNowButton.tsx` | React | `client:load` | cartStore |
| `AddToCartButton.tsx` | React | `client:load` | cartStore |
| `WishlistButton.tsx` | React | `client:load` | authStore, wishlistStore |
| `RatingBar.tsx` | React | `client:visible` | — |
| `ThreadList.tsx` | React | `client:load` | authStore |
| `NewThreadForm.tsx` | React | `client:load` | authStore |
| `MessageList.tsx` | React | `client:load` | authStore |
| `StatsCards.tsx` | React | `client:load` | — |
| `SalesChart.tsx` | React | `client:visible` | — |
| `ProductTable.tsx` | React | `client:load` | — |
| `OrderTable.tsx` | React | `client:load` | — |
| `Toast.tsx` | React | `client:load` | — |

### Convención de hidratación Astro

- `client:load` → se hidrata inmediatamente. Para componentes críticos en el primer render (navbar, cart, auth).
- `client:visible` → se hidrata cuando entra en viewport. Para carruseles, gráficos y secciones de scroll.
- `client:idle` → se hidrata cuando el navegador está inactivo. Para componentes no urgentes.
- Sin directiva → no se hidrata (HTML estático puro).

---

## 10. Backend — Módulos y responsabilidades

### Estructura de un Controller

Cada método de controller sigue este patrón:

```
1. Extraer y sanitizar datos de req.body / req.params / req.query
2. Llamar al Model correspondiente
3. Si hay lógica de negocio compleja: manejarla aquí (nunca en el Model)
4. Si se necesita un servicio externo: llamar al Service
5. Usar utils/response.js para construir la respuesta
6. Si ocurre un error inesperado: pasar a errorHandler con next(error)
```

### Manejo de errores

Todos los errores inesperados del servidor deben propagarse con `next(error)` para que el `errorHandler.js` los capture. Los errores esperados (validación, no encontrado, no autorizado) se responden directamente con el código HTTP apropiado:

| Situación | Código HTTP |
|-----------|------------|
| Body inválido (validación Zod) | 400 |
| Credenciales incorrectas | 401 |
| No autenticado | 401 |
| No tiene permisos | 403 |
| Recurso no encontrado | 404 |
| Conflicto (email ya existe, reseña duplicada) | 409 |
| Error interno del servidor | 500 |

### Transacciones SQLite

Para operaciones que involucren múltiples escrituras (creación de pedido), usar transacciones de `better-sqlite3`:

```javascript
// Ejemplo de uso de transacción en Model:
const createOrderTransaction = db.transaction((orderData, items) => {
  const orderId = db.prepare('INSERT INTO orders ...').run(orderData).lastInsertRowid
  for (const item of items) {
    db.prepare('INSERT INTO order_items ...').run({ orderId, ...item })
    db.prepare('UPDATE product_variants SET stock = stock - ? WHERE id = ?')
      .run(item.quantity, item.variantId)
  }
  return orderId
})
```

---

## 11. Variables de entorno

### `frontend/.env`

```env
# URL base del backend (sin slash final)
PUBLIC_API_URL=http://localhost:3001/api

# Cloudinary (solo para upload directo desde el admin, si se implementa)
PUBLIC_CLOUDINARY_CLOUD_NAME=tu_cloud_name
```

### `backend/.env`

```env
# Servidor
PORT=3001
NODE_ENV=development           # development | production

# Base de datos SQLite
DB_PATH=./database/mediantem.db

# JWT — Cambiar por strings aleatorios largos en producción
JWT_SECRET=cambia_esto_minimo_32_caracteres_aleatorios
JWT_EXPIRES_IN=15m             # 15 minutos en producción
JWT_REFRESH_SECRET=otro_string_diferente_al_anterior
JWT_REFRESH_EXPIRES_IN=30d

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# Resend (email)
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@mediantem.com

# CORS — URL del frontend
FRONTEND_URL=http://localhost:4321

# Pasarela de pago
CULQI_PUBLIC_KEY=pk_test_xxxxxxxxxxxx
CULQI_SECRET_KEY=sk_test_xxxxxxxxxxxx
```

> Para generar strings seguros para JWT_SECRET usar:  
> `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

---

## 12. Reglas de código y convenciones

### Nombrado

| Elemento | Convención | Ejemplo |
|---------|-----------|---------|
| Componentes React/Astro | PascalCase | `ProductCard.tsx`, `HeroSection.astro` |
| Archivos de utilidad/store | camelCase | `cartStore.ts`, `formatters.ts` |
| Archivos backend | camelCase | `authController.js`, `productModel.js` |
| Variables y funciones | camelCase | `getAuthUser`, `accessToken` |
| Constantes | UPPER_SNAKE_CASE | `MAX_CART_ITEMS` |
| Rutas de API | kebab-case | `/api/top-products`, `/api/reset-password` |
| Clases CSS Tailwind | utility classes | `bg-brand-negro text-white` |

### TypeScript

- Usar `interface` para objetos, `type` para uniones y primitivos.
- No usar `any`. Si el tipo es desconocido, usar `unknown` y hacer type narrowing.
- Todos los props de componentes React deben tener su interface definida en el mismo archivo o en `types/index.ts` si es reutilizable.
- El archivo `types/index.ts` del frontend es la fuente de verdad de los contratos de datos.

### Commits

Seguir Conventional Commits (ver sección 5). Cada commit debe ser atómico: una sola cosa por commit.

### Estilos

- Usar las clases de color de Tailwind con los nombres de marca: `bg-brand-negro`, `text-brand-rojo`, etc.
- No escribir CSS inline en componentes React (`style={{}}`). Usar clases Tailwind o `global.css`.
- Para animaciones simples usar clases de Tailwind (`transition`, `hover:`). Para animaciones complejas, usar Framer Motion (se puede agregar como dependencia).

---

## 13. Orden de desarrollo sugerido

La siguiente secuencia minimiza bloqueos entre integrantes al separar el trabajo por capas.

### Semana 1 — Fundamentos compartidos
- [ ] Crear repositorio en GitHub con las 3 ramas
- [ ] Setup inicial: `frontend/` con Astro + React + Tailwind, `backend/` con Express
- [ ] Definir `types/index.ts` en el frontend (contratos de datos) — **todo el equipo lo revisa**
- [ ] Configurar Tailwind con la paleta de colores de Mediantem
- [ ] Crear `BaseLayout.astro`, `ShopLayout.astro` y `AdminLayout.astro` con estructura HTML base
- [ ] Crear `Navbar.astro` y `Footer.astro` estáticos (sin lógica auth aún)
- [ ] Setup de `server.js` en backend: Express + middlewares globales + ruta de health check (`GET /api/health`)
- [ ] Setup de `config/database.js`: crear conexión SQLite y ejecutar script de creación de tablas

### Semana 2 — Auth completa
- [ ] Backend: `User.js` model, `authController.js`, `routes/auth.js`, `middlewares/auth.js`
- [ ] Backend: `utils/jwt.js`, tabla `refresh_tokens`, flujo register/login/logout/refresh
- [ ] Frontend: `authStore.ts` (Zustand), `lib/api.ts` (fetch wrapper con 401 handler)
- [ ] Frontend: `LoginForm.tsx`, `RegisterForm.tsx`, `AuthModal.tsx`
- [ ] Frontend: `CartButton.tsx` conectado a `cartStore.ts`
- [ ] Probar flujo completo: register → login → petición autenticada → logout

### Semana 3 — Páginas estáticas y catálogo
- [ ] `index.astro` (Landing): todas las secciones con datos estáticos (sin API aún)
- [ ] `about.astro`: todas las secciones estáticas
- [ ] `shop/index.astro`: estructura con ProductCarousel usando datos mock
- [ ] Backend: `Product.js` model, `productController.js`, `routes/products.js`
- [ ] Backend: seeds con 10 productos de prueba en las 4 categorías
- [ ] Frontend: conectar `/shop` a `GET /api/products` real

### Semana 4 — Detalle de producto y carrito
- [ ] `product/[id].astro`: todas las secciones con fetch a `GET /api/products/:id`
- [ ] `ProductGallery.tsx`, `VariantSelector.tsx`, `QuantityInput.tsx`
- [ ] `AddToCartButton.tsx`, `BuyNowButton.tsx`, `WishlistButton.tsx`
- [ ] `CartDrawer.tsx` conectado a `cartStore.ts`
- [ ] `RelatedProducts.tsx` con fetch a `GET /api/products/:id/related`

### Semana 5 — Checkout y pedidos
- [ ] `cart.astro` y `checkout.astro` con `CartSummary.tsx`
- [ ] Backend: `Order.js` model, `orderController.js` con transacción SQLite
- [ ] Backend: `emailService.js` con Resend (confirmación de pedido)
- [ ] `success.astro` con confirmación
- [ ] Integración con Culqi: widget de pago en checkout

### Semana 6 — Reviews y foro
- [ ] Backend: `Review.js` model, `reviewController.js`, `routes/reviews.js`
- [ ] Frontend: `RatingBar.tsx`, `ReviewCard.astro` en Product Details
- [ ] Backend: `ForumPost.js` model, `forumController.js`, `routes/forum.js`
- [ ] Frontend: `forum/index.astro`, `forum/[id].astro`, todos los componentes del foro

### Semana 7 — Panel admin
- [ ] `admin/index.astro` con `StatsCards.tsx` y `SalesChart.tsx`
- [ ] Backend: `statsController.js`, `routes/stats.js`
- [ ] `admin/products.astro` con `ProductTable.tsx` y `ProductFormModal.tsx`
- [ ] Backend: endpoints de gestión de productos con upload a Cloudinary
- [ ] `admin/orders.astro` con `OrderTable.tsx` y cambio de estado

### Semana 8 — Cuenta, wishlist y pulido
- [ ] `account/index.astro`, `account/orders.astro`, `account/wishlist.astro`
- [ ] Backend: `Wishlist.js` model, `wishlistController.js`
- [ ] `wishlistStore.ts` con sincronización al hacer login
- [ ] `Toast.tsx` global para feedback de acciones
- [ ] Revisión de SEO: meta tags en todas las páginas, og:image
- [ ] Pruebas de flujo completo de compra end-to-end

### Semana 9 — Deploy
- [ ] Variables de entorno en producción (Vercel + Railway)
- [ ] Deploy de frontend en Vercel (rama `main`)
- [ ] Deploy de backend en Railway con SQLite persistente
- [ ] Configurar dominio y HTTPS
- [ ] Pruebas en producción

---

*Mediantem — Diseño que se pone.*  
*Documento mantenido por el equipo: Honorio · Marcir · Jose*
