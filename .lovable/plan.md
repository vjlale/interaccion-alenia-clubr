
# Grilla estable 1920×1080 para `/display` (VotingScreen)

Ahora mismo el layout usa `flex` con `flex: 1` sobre `100vh` heredado del stage, así que cuando el navegador escala se ven espacios raros. Voy a atarlo a una grilla explícita en unidades absolutas dentro del lienzo 1920×1080 con márgenes seguros (safe area), de modo que la posición y el alto de cada bloque no dependan del escalado.

## Sistema de grilla

- Lienzo: `1920 × 1080` (dado por `DisplayStage`, no se toca).
- Safe area: márgenes de **60px** en los 4 lados → área útil `1800 × 960`.
- Grilla vertical (rows) dentro de la safe area:
  ```text
  ┌──────────────────────────────────────────┐  60px  top safe
  │ HEADER  logo (240px alto) │ barra tiempo │  240px
  ├──────────────────────────────────────────┤  30px  gap
  │ CONTENT                                  │  1fr (~640px)
  │  ┌──────────┐   ┌────────────────────┐  │
  │  │  QR      │   │  4 tarjetas voto   │  │
  │  └──────────┘   └────────────────────┘  │
  ├──────────────────────────────────────────┤  20px  gap
  │ FOOTER  "N votos registrados"            │  70px
  └──────────────────────────────────────────┘  60px  bottom safe
  ```
- Grilla horizontal del bloque CONTENT: 2 columnas `1fr 1fr` con `gap: 40px`.
- Grilla vertical dentro de la columna de opciones: 4 filas iguales `repeat(4, 1fr)` con `gap: 18px`, así las tarjetas siempre tienen alturas idénticas y predecibles.

## Cambios concretos (solo `VotingScreen` en `src/routes/display.tsx`)

1. Reemplazar el `flex flex-col` raíz por `display: grid` con `gridTemplateRows: "240px 1fr 70px"`, `rowGap: 30`, `padding: 60`, `height: "100%"`, `width: "100%"`.
2. Header: `display: grid; gridTemplateColumns: "auto 1fr"; gap: 40; alignItems: center;`. Logo a la izquierda con altura fija `240px` (no clamp). Barra a la derecha ocupando todo el `1fr`, alto `78px`, centrada verticalmente.
3. Content: `display: grid; gridTemplateColumns: "1fr 1fr"; gap: 40; minHeight: 0;`.
   - Panel QR: mantiene su composición pero centrado con `place-items: center`.
   - Panel opciones: `display: grid; gridTemplateRows: "repeat(4, 1fr)"; gap: 18; padding: 20; minHeight: 0;`.
4. Cada tarjeta de opción: `min-height: 0`, `display: grid; gridTemplateRows: "1fr auto"; padding: 20px 26px;`. Título centrado en la fila `1fr`, barra + `%`/votos en la fila `auto` inferior. El tamaño de fuente del título deja de ser `vw`-based y pasa a `clamp(64px, 8.5cqh, 120px)` usando `containerType: size` en la tarjeta, así el texto escala con la altura real de la tarjeta, no con el viewport.
5. Footer: alto `70px`, centrado, misma tipografía y color actuales.
6. Se retira el `padding: "40px 60px 40px"` y cualquier `marginBottom` manual — ahora el espaciado lo maneja el `gap` de la grilla.

## Lo que NO cambia

- `DisplayStage` (sigue 1920×1080 con escalado uniforme).
- Estados `idle`, `revealing`, `winner`.
- Paleta, tipografías, glows, animaciones, lógica de sesión/votos/QR.
- Elementos decorativos (glocks laterales, orbes, trama).
