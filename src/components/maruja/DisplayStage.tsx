import type { ReactNode } from "react";

/**
 * Contenedor 16:9 fijo (pensado para LED 1920x1080).
 * - Ajusta al tamaño de la ventana manteniendo aspect-ratio (letterbox si hace falta).
 * - Expone container queries (`cqw`, `cqh`) para que TODO el contenido escale
 *   proporcionalmente sin `transform: scale`.
 * - En 1920x1080 real, 1cqh = 10.8px, 1cqw = 19.2px.
 */
export function DisplayStage({
  children,
  background = "transparent",
}: {
  children: ReactNode;
  background?: string;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background,
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
      }}
    >
      <div
        style={{
          width: "min(100vw, calc(100vh * 16 / 9))",
          height: "min(100vh, calc(100vw * 9 / 16))",
          position: "relative",
          containerType: "size",
        }}
      >
        {children}
      </div>
    </div>
  );
}
