---
name: fixed-aspect-display-stage
description: Build a pixel-stable full-screen display (LED wall, kiosk, signage, dashboard TV) at a fixed target resolution and aspect ratio (e.g. 1920x1080, 1080x1920, 3840x2160) so the layout scales proportionally to any preview size without transform scaling, elements never get crushed, and content stays inside a safe area.
---

# Fixed-Aspect Display Stage

Use when the user needs a screen designed for a specific physical output (LED wall, TV, kiosk, digital signage, control-room dashboard) that must look identical at the target resolution AND scale down cleanly in the editor preview or smaller windows — without `transform: scale`, without elements being squished, and with a consistent safe area.

## Core idea

1. Wrap the whole screen in a **Stage** with a fixed `aspect-ratio` matching the target device (e.g. `16/9` for 1920x1080).
2. The Stage sizes itself to the largest rectangle that fits the viewport keeping that aspect ratio (`max-width: 100vw`, `max-height: 100vh`, both `min` via `aspect-ratio`).
3. Give the Stage `container-type: size` and a `container-name`. Every child inside uses **container query units** (`cqh` / `cqw`) instead of `px`, `rem`, `vh`, or `vw`.
4. Result: 1cqh = 1% of stage height, 1cqw = 1% of stage width. At target resolution 1920x1080 → 1cqh = 10.8px, 1cqw = 19.2px. At any smaller size, the same ratios hold — no scaling transform, no blur, no crushing.

## Stage component

```tsx
// src/components/<name>/DisplayStage.tsx
import { CSSProperties, ReactNode } from "react";

export function DisplayStage({
  children,
  aspectRatio = "16 / 9",
}: { children: ReactNode; aspectRatio?: string }) {
  const style: CSSProperties = {
    aspectRatio,
    width: "min(100vw, calc(100vh * (16 / 9)))", // adjust ratio if needed
    height: "min(100vh, calc(100vw * (9 / 16)))",
    containerType: "size",
    containerName: "stage",
    position: "relative",
    overflow: "hidden",
    margin: "auto",
  };
  return (
    <div className="grid min-h-screen w-full place-items-center bg-black">
      <div style={style}>{children}</div>
    </div>
  );
}
```

For portrait (1080x1920) use `aspectRatio="9 / 16"` and swap the width/height calc ratios.

## Authoring rules for children

- **Never use `px`, `rem`, `vw`, or `vh` inside the Stage.** Only `cqh`, `cqw`, `%`, `fr`, and `minmax(0, ...)`.
- **Vertical measurements → `cqh`.** Horizontal → `cqw`. Font-size can use either; `cqh` keeps type proportional to vertical rhythm.
- **Safe area:** apply a single padding on the top-level child, e.g. `padding: "4cqh 3.8cqw"`. Nothing important should live outside it.
- **Grids:** use `gridTemplateRows: "16cqh minmax(0, 1fr) 5cqh"` style — fixed header/footer in `cqh`, flexible middle with `minmax(0, 1fr)` so it can shrink without overflow.
- **Images / QR / logos that must stay square:** wrap in a box with `width: "min(100%, Ncqh)"` and `aspectRatio: "1 / 1"`. Never set both width and height in different units.
- **Decorative overlays** (side ornaments, corner marks) must be rendered **inside** the Stage as absolutely positioned children with `cq` units — never outside it as `vw/vh` overlays, or they will float away from the content when the viewport changes.
- **Text:** use `fontSize: "6cqh"` etc. `line-height` unitless. Long strings: `min-w-0`, `truncate` or `overflow-wrap: anywhere` as needed.

## Conversion cheat sheet (1920x1080 target)

| Design px | cqh (÷10.8) | cqw (÷19.2) |
|-----------|-------------|-------------|
| 40        | 3.7         | 2.08        |
| 60 safe   | 5.55        | 3.13        |
| 100       | 9.26        | 5.2         |
| 200       | 18.5        | 10.4        |

Rule of thumb: `value_cqh = design_px / (targetHeight / 100)`.

## Retrofit checklist (converting an existing screen)

1. Wrap the current root in `<DisplayStage>`. Remove any `transform: scale`, `zoom`, or manual `vw/vh` scaling logic.
2. Replace the outer safe-area padding with `cqh/cqw`.
3. Sweep the file: change every `px`, `rem`, `vh`, `vw` inside the stage to `cqh`/`cqw` using the cheat sheet.
4. Convert absolute widgets (QR, logos, timers) to `min(100%, Ncqh)` + `aspectRatio` when they must stay proportional.
5. Move decorative overlays inside the Stage.
6. Verify at three sizes: target resolution (e.g. 1920x1080), editor preview (~950px wide), and a random in-between. Layout should look identical, only smaller. Nothing overlaps or clips.

## Common failure modes

- **Elements "crushed" on small preview** → still using `vh`/`vw` or fixed `px`. Container queries only work with `cq*` units.
- **Nothing scales at all** → forgot `containerType: "size"` on the Stage, or set it on an ancestor without a defined size.
- **QR/image distorted** → mixing `width` in `cqw` and `height` in `cqh`. Use one dimension + `aspectRatio`.
- **Decorations drift off-screen** → they're outside the Stage using viewport units. Move them inside.
- **Middle row overflows** → grid row is `auto` or `1fr` without `minmax(0, 1fr)`. Always use `minmax(0, 1fr)` for the flexible row.

## When NOT to use

- Responsive marketing sites, dashboards meant for arbitrary window sizes, or anything where users resize freely and expect reflow. Fixed-aspect Stage is for **broadcast-style, single-target-resolution** surfaces.
