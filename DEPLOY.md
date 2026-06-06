# 🚀 Publicar Arca Party online (gratis) — jugar desde cualquier lugar

Arca Party se despliega como **un solo servicio** en [Render](https://render.com):
ese servicio sirve el juego (la web) **y** el servidor multijugador en el mismo
origen. Así no hay que configurar URLs ni CORS, y basta **un** deploy gratis.

## Pasos (10 minutos, una sola vez)

### 1. Sube el código a GitHub
Desde la carpeta del proyecto:
```bash
git push origin dev          # o fusiona a main y sube main
```

### 2. Crea el servicio en Render
1. Entra a https://render.com y crea una cuenta (gratis, puedes usar tu GitHub).
2. **New → Blueprint**.
3. Conecta tu repositorio `Arca-Party-Game` y la rama (`dev` o `main`).
4. Render detecta `render.yaml` y propone el servicio **arca-party**. Pulsa
   **Apply / Create**.
5. Espera a que termine el build (instala, compila el juego y arranca el server).

### 3. ¡Listo!
Render te da una URL pública, por ejemplo:
```
https://arca-party.onrender.com
```
Ese link **es el juego**. Ábrelo en cualquier celular/PC del mundo, pulsa
**🌐 JUGAR ONLINE → CREAR SALA**, comparte el código de 4 letras y a competir. 🎉

## Cosas a saber del plan gratis
- El servicio **se duerme** tras ~15 min sin uso. La primera visita lo despierta
  en ~30–50 s (sale "cargando"); luego va fluido. Para amigos es perfecto.
- Soporta varias salas y hasta 12 jugadores por sala.

## Actualizar el juego
Cada vez que hagas `git push`, Render puede redeplegar automáticamente
(auto-deploy activado por defecto) con los últimos cambios.

## Alternativa: front y server separados
Si prefieres el juego en Vercel/GitHub Pages y el server aparte, despliega solo
`server/` en Render y pon en el front la variable `VITE_SERVER_URL` con la URL
`wss://...onrender.com` (ver `.env.example`). El modo combinado de arriba es más
simple y recomendado.
