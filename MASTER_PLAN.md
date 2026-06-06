# ⚓ ARCA PARTY - MASTER PLAN & ARCHITECTURE

## 🎯 Visión del Proyecto
"Arca Party" es un mini-juego web interactivo en 2D con temática del Arca de Noé, inspirado en el estilo visual vibrante y frenético de "Mario Party Jamboree". El objetivo es sobrevivir a minijuegos rápidos, acumular animales y ganar con un mensaje de victoria inspirador. Si el jugador pierde, recibe un versículo bíblico motivacional. Todo debe sentirse "hyper-casual", pulido, a 60fps y visualmente "Wooooow".

## 🛠️ Tech Stack
- **Framework:** React (vía Vite para máxima velocidad).
- **Estilos:** Tailwind CSS (para diseño rápido y responsivo).
- **Animaciones:** Framer Motion (para físicas fluidas, olas del mar, rebotes UI).
- **Assets:** Gráficos basados en Emojis gigantes (🦁, 🐘, 🦒, 🕊️, 🧔🏽‍♂️) o SVGs simples en su defecto.

## 🤖 Reglas de Oro para los Agentes IA
1. **NO SOBRESCRIBIR:** Si vas a modificar un componente que hizo otro agente, asegúrate de no romper sus dependencias. 
2. **MODULARIDAD ESTRICTA:** Cada minijuego, botón y pantalla debe ser un componente separado dentro de la carpeta `/components`.
3. **MANTENER EL ESTADO CENTRALIZADO:** Usar un contexto (`GameContext`) o un estado en `App.js` para manejar el flujo general (vidas, nivel, puntaje).

## 🗂️ Estructura de Componentes
El juego fluye a través de diferentes "Pantallas" o estados:
- `MainMenu.jsx`: Pantalla inicial, título rebotando, botón gigante de "¡EMBARCAR!".
- `GameHUD.jsx`: Barra superior siempre visible. Muestra Nivel, Vidas (❤️), Puntaje y Botón de Pausa.
- `GameLoop.jsx`: El orquestador que decide qué minijuego lanzar.
- `VictoryScreen.jsx`: Animación épica de arcoíris, paloma (🕊️) y texto "¡FINISH! VICTORIA!".
- `DefeatScreen.jsx`: Lluvia, oscuridad, pergamino y un Versículo Bíblico aleatorio para motivar.

## 🎮 Los 3 Desafíos (Minijuegos)
1. **"Acomoda la Barca" (Match / Drag & Drop):**
   - **Mecánica:** Cuadrícula de animales desordenados. El jugador debe emparejar parejas o arrastrarlos a sus posiciones correctas en menos de 15 segundos para estabilizar el arca.
2. **"Salta la Ola" (Timing):**
   - **Mecánica:** Noé en cubierta. Barras azules (olas) se acercan horizontalmente. Tocar la pantalla o presionar "Espacio" para saltar y esquivar. Si toca una ola, pierde una vida.
3. **"El Desafío de la Sombra" (Bonus Track Aleatorio):**
   - **Mecánica:** Pantalla especial sorpresiva. Una caja cae, sale una sombra negra de un animal. Un reloj de 10 segundos inicia. 4 botones con opciones de nombres.
   - **Premio:** Si adivina correcto: Revelación brillante del animal, +1 Vida Extra, +500 Puntos. Si falla: la sombra huye, el juego sigue normal.

## 📖 Base de Datos Dinámica
- El sistema debe incluir un array `bibleVerses.js` con al menos 15-30 versículos motivacionales categorizados (Ej. Josué 1:9, Isaías 43:2, Filipenses 4:13).
- El sistema debe aumentar la velocidad general (animaciones y temporizadores reducidos) al subir de Nivel.

## 🎨 Guía Visual (UI/UX)
- **Colores:** Azul océano vibrante (#00a8ff), madera cálida (#f39c12), botones dorados y brillantes.
- **Tipografía:** Gruesa, redondeada, juguetona (importar una fuente estilo "Fredoka One" o "Baloo" de Google Fonts).
- **Feedback:** Cada clic debe tener un pequeño efecto de escala (Framer Motion `whileTap={{ scale: 0.9 }}`).