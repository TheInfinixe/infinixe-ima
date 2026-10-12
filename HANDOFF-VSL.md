# Handoff — Terminar el VSL (Infinixe IMA)

Documento para unificar el VSL en el Vercel del **IMA beta** (`infinixe-ima.vercel.app`).
Todo el trabajo visual ya está hecho y alineado con la marca (`ima.infinixe.co`). Faltan **3 cosas operativas**: traer el cambio de código, subir el video y poner los links de Stripe.

---

## TL;DR — 3 tareas

1. **Código:** hacer merge/push de `app/vsl/VslPage.js` a `main` (repo `TheInfinixe/infinixe-ima`). Vercel redeploya solo.
2. **Video:** subir `vsl julio.mp4` (332 MB) a Vercel Blob **en el team que es dueño de `infinixe-ima`** y poner su URL pública en la env var `NEXT_PUBLIC_VSL_VIDEO_SRC`.
3. **Stripe:** poner los 2 links de pago en `NEXT_PUBLIC_STRIPE_LINK_450` y `NEXT_PUBLIC_STRIPE_LINK_350`.

---

## Contexto

- **Qué es el VSL:** la página que ve el usuario **después del assessment**, explica su resultado y vende el "IMA Completo + sesión 1:1".
- **Rutas:**
  - `/vsl` → variante A, **$450** (`NEXT_PUBLIC_STRIPE_LINK_450`)
  - `/vsl-b` → variante B, **$350** (`NEXT_PUBLIC_STRIPE_LINK_350`)
  - Ambas comparten el mismo componente: `app/vsl/VslPage.js`.
- **Funnel completo (ya funciona):**
  `anuncio` → `ima.infinixe.co` (landing) → `infinixe-ima.vercel.app` (assessment) → pantalla de resultados → botón **"Qué significa tu resultado →"** → `/vsl?lvl=<nivel>&n=<nombre>`.
  (El botón está en `app/page.js`, ~línea 744. La VSL lee `n` y `lvl` para personalizar el título.)
- **Repo:** `github.com/TheInfinixe/infinixe-ima` (branch `main`).
- **Deploy:** `infinixe-ima.vercel.app`.

---

## 1. Cambio de código (diseño + reproductor flexible)

**Archivo tocado (uno solo):** `app/vsl/VslPage.js`

**Qué cambió:**
- **Consistencia con la marca/landing** (`ima.infinixe.co`): el botón CTA pasó de mint plano al **gradiente firma** `linear-gradient(92deg,#0AC6F9,#4FA8FF 55%,#8956FF)` con texto blanco + glow violeta; cards con glass (blur) y radios de 22px; glow radial de fondo. Tipografías (Montserrat + Staatliches) y paleta ya coincidían.
- **Reproductor de video flexible:** ahora elige la fuente por env var, en este orden:
  1. `NEXT_PUBLIC_VSL_VIDEO_SRC` → `<video>` nativo (MP4 directo, p. ej. Vercel Blob). **← lo que vamos a usar**
  2. `NEXT_PUBLIC_VSL_VIDEO_ID` → iframe de YouTube (fallback).
  3. Si ambas están vacías → placeholder "Video próximamente".

**Acción:** merge/push de ese archivo a `main`. Vercel redeploya automático. No hay cambios de dependencias.

---

## 2. Video — `vsl julio.mp4` (332 MB)

Archivo original en Drive: <https://drive.google.com/file/d/1ZPaWK5GCHTThiadvxmh0Z_6SgyqkhcR2/view>

> Importante: el MP4 pesa 332 MB — **no meterlo en el repo / `public`** (bloatea el deploy). Hay que hostearlo en un CDN. Recomendado: **Vercel Blob** en el MISMO team que es dueño del proyecto `infinixe-ima` (así la env var y el token quedan en el mismo lugar).

### Opción recomendada — Vercel Blob

1. Vercel → proyecto **`infinixe-ima`** → pestaña **Storage** → **Create Database → Blob** → crear y **conectarlo al proyecto** (esto agrega `BLOB_READ_WRITE_TOKEN` a las env vars del proyecto automáticamente).
2. Subir el MP4:
   - **Fácil (dashboard):** abrir el Blob store → **Upload** → subir `vsl julio.mp4` → copiar su **public URL**.
   - **O por CLI (logueado):**
     ```bash
     vercel blob put "vsl julio.mp4" --rw-token <BLOB_READ_WRITE_TOKEN>
     ```
3. La URL pública se ve así:
   `https://<hash>.public.blob.vercel-storage.com/vsl-julio.mp4`
4. Poner esa URL en la env var **`NEXT_PUBLIC_VSL_VIDEO_SRC`** (Production + Preview) y redeploy.

### Alternativa — YouTube no listado
Subir el MP4 a YouTube como "no listado" y poner el ID en **`NEXT_PUBLIC_VSL_VIDEO_ID`**. (El código ya lo soporta como fallback.)

### (Opcional) Portada del video
`NEXT_PUBLIC_VSL_VIDEO_POSTER` = URL de una imagen de portada. Si se omite, el `<video>` muestra el primer frame.

---

## 3. Env vars a configurar en Vercel (proyecto `infinixe-ima`)

| Variable | Valor | Notas |
|---|---|---|
| `NEXT_PUBLIC_VSL_VIDEO_SRC` | URL pública del MP4 en Blob | Fuente principal del video |
| `NEXT_PUBLIC_VSL_VIDEO_POSTER` | *(opcional)* URL de portada | — |
| `NEXT_PUBLIC_VSL_VIDEO_ID` | *(opcional)* ID de YouTube | Solo si NO se usa Blob |
| `NEXT_PUBLIC_VSL_CTA_DELAY` | `120` | Segundos antes de mostrar la oferta. `?cta=1` la muestra de inmediato |
| `NEXT_PUBLIC_STRIPE_LINK_450` | link de pago Stripe $450 | Botón de `/vsl` |
| `NEXT_PUBLIC_STRIPE_LINK_350` | link de pago Stripe $350 | Botón de `/vsl-b` |
| `NEXT_PUBLIC_VSL_URL` | `https://infinixe-ima.vercel.app/vsl` | Usado por el email de resultados para el CTA. Cambiar si hay dominio propio |

> Son todas `NEXT_PUBLIC_*` (se leen en el cliente) → **requieren redeploy** para tomar efecto.

---

## 4. Stripe (pendiente)

Los links de pago están vacíos → hoy el botón "Desbloquear mi IMA Completo" apunta a `#` (no cobra).
Crear/usar los **Payment Links** de Stripe (uno de $450 y uno de $350) y ponerlos en las env vars de arriba.

---

## Probar en local

```bash
npm install
npm run dev
# abrir http://localhost:3000/vsl?cta=1   (cta=1 muestra la oferta de inmediato)
# variante B: http://localhost:3000/vsl-b?cta=1
```

Para probar el video en local sin Blob, crear `.env.local` con:
```
NEXT_PUBLIC_VSL_VIDEO_SRC=https://<hash>.public.blob.vercel-storage.com/vsl-julio.mp4
```

---

## Checklist final

- [ ] Merge/push de `app/vsl/VslPage.js` a `main`.
- [ ] Blob store creado y conectado a `infinixe-ima` (o video en YouTube).
- [ ] `vsl julio.mp4` subido → URL pública obtenida.
- [ ] `NEXT_PUBLIC_VSL_VIDEO_SRC` configurada en Vercel.
- [ ] `NEXT_PUBLIC_STRIPE_LINK_450` y `_350` configuradas.
- [ ] `NEXT_PUBLIC_VSL_CTA_DELAY` = 120 (o el valor acordado).
- [ ] Redeploy y verificar `/vsl` y `/vsl-b` (video reproduce, oferta aparece, botón va a Stripe).

---

## Notas de consistencia visual

- La VSL quedó alineada con la **landing** (`ima.infinixe.co`): Montserrat + Staatliches, cian `#0AC6F9`, violeta `#8956FF`, mint `#6CEECC`, fondo `#170F40`, botón gradiente firma.
- El **assessment** (`infinixe-ima.vercel.app`) usa una variante levemente distinta (tipografía **Outfit**, cian `#00E5FF`, violeta `#B388FF`). Si se quiere que landing + assessment + VSL calcen al 100%, habría que alinear también el assessment a Montserrat + `#0AC6F9`. (Fuera del alcance de este cambio.)
