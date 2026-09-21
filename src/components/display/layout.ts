//src/components/display/layout.ts
/** Convierte unidades de diseño en un tamaño CSS (ver --u en globals.css). */
export const u = (value: number) => `calc(var(--u) * ${value})`;

/** Columnas compartidas por el encabezado de la tabla y las filas: moneda | compra | venta. */
export const ROW_GRID_STYLE = {
  gridTemplateColumns: `minmax(0, 1fr) ${u(27)} ${u(27)}`,
  columnGap: u(2),
  paddingInline: u(4),
} as const;