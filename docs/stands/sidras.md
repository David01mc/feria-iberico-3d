# Llagar Pumarín · Sidras

> Esquina de 18 m² frente a la Avenida Central: llagar asturiano de paredes claras y techo de
> madera, con dos toneles, jardín vertical, barra de degustación con taburetes y barra de
> tablas oscuras con manzanas.

Referencia de estilo: stand «chigre» de sidrería asturiana, con madera clara, musgo, suelo verde
y barra facetada.

## Ficha

| | |
|---|---|
| Código de parcela | D-54 |
| Tipo y tamaño | Esquina · mediano · 6 × 3 m (18 m²) |
| Parcela (pabellón) | x 7 … 13, z 2 … 5 (fila D, al este de la Calle 3) |
| Lados a pasillo | Norte (Avenida Central) y oeste (Calle 3) |
| Lados cerrados | Sur (espalda con Cervezas Montanera) y este (vecino D-06) |
| Frente principal | Norte |
| Altura máxima | 3,5 m |
| Estado | Construido. Pendiente de revisión visual en el navegador |

## Expositor

- **Llagar Pumarín**: «Sidra natural escanciada como en el chigre». Desde 1948, Villaviciosa
  (Asturias).
- Sidra natural de manzana asturiana de sus propias pumaradas, prensada en llagar de madera y
  fermentada en toneles de castaño.
- **Productos:**
  - Sidra natural.
  - Sidra de nueva expresión.
  - Sidra brut.
  - Vinagre de sidra.
- **Identidad:**
  - Tipografía Josefin Sans 700.
  - Verde `#2f6b35`, madera `#5b4630`, amarillo manzana `#e2c23a`, papel `#f2ecd8`.

## Arquitectura

Coordenadas locales: el frente mira a +z (norte). Los lados cerrados son −z y −x.

- **Suelo:** pino claro con canto de madera oscura.
- **Paredes:** encalada la del fondo y de pino la lateral, ambas de 3,0 m.
- **Visera:**
  - Madera oscura sobre la mitad trasera, a 2,9 m.
  - Dos vigas de roble en los extremos.
- **Frontis verde:** con el nombre y «SIDRA NATURAL · ASTURIAS».
- **Placa de origen:** madera oscura en la pared del fondo, con el nombre y «Villaviciosa,
  Asturias».
- **Jardín vertical enmarcado** (`MossPanel`):
  - Mide 2,7 × 1,95 m y ocupa la mitad derecha del fondo, vista desde el pasillo.
  - 442 hojas con textura dibujada en canvas, en una sola llamada de dibujo.

## Mobiliario y producto

- **Dos toneles** (`barrica` a escala 1,15) detrás de la barra, con cartel «SIDRA NATURAL».
- **Barra de degustación** delante del jardín:
  - Tapa de roble de 2,5 × 0,6 m a 1,05 m, sobre dos patas.
  - Faldón con «DEGUSTACIÓN DE SIDRA».
  - Dos taburetes tapizados, cuatro botellas de sidra y dos vasos de sidra.
- **Barra de tablas oscuras:**
  - Mide 1,9 × 0,75 × 1,1 m, con tapa de roble y listones verticales de roble.
  - En el frente, «SIDRA DE LLAGAR».
  - Encima: dos botellas, un vaso y una cesta con cuatro manzanas.
- **Planta** junto al lado abierto.

## Iluminación

Un foco real sobre la barra.

## Archivos

- **Configuración:** `src/config/stands/sidras.ts`.
- **Cotas y colisiones:** `SIDRAS` en `src/config/layouts.ts`. Un test comprueba que la planta no
  choca con los taburetes.
- **Escena:** `src/scene/stands/SidrasStand.tsx` y `src/scene/stands/MossPanel.tsx`.
- **Modelos:**
  - `blender/products_bebidas.py`: `botella_sidra` y `manzana`.
  - `blender/models_maridaje.py`: `vaso_sidra` y `taburete_tapizado`.

## Diferencias con el diseño aprobado

La construcción actual se aparta del diseño acordado en la fase 6:

| Diseño aprobado | Construido |
|---|---|
| Pared de musgo en triángulo diagonal con manzanas y tira LED en la diagonal | Jardín vertical rectangular enmarcado, sin manzanas ni LED |
| Fotomural de un chigre tradicional renderizado en Blender | Placa de origen de madera y dos toneles |
| Barra facetada de madera con tapa negra (`barraFacetada`) | Barra de tablas oscuras (`Counter`) |
| Alfombra redonda de yute | No hay |
| Estantería cúbica con botellas bajo el fotomural | No hay |
| Moqueta verde con franjas | Suelo de pino |

Como consecuencia, dos piezas del catálogo se descargan y precargan sin usarse:
- `muroMusgo`: el muro de musgo horneado, 1,9 MB.
- `barraFacetada`: 4 KB.

Hay que decidir si se incorporan al stand o se quitan del catálogo.

## Pendiente

- Revisión visual en el navegador.
- Decidir el diseño final: el actual o el aprobado. Según eso, usar o retirar `muroMusgo` y
  `barraFacetada`.
- El muro del fondo toca el panel de Cervezas Montanera en z = 5. Las caras enfrentadas no se ven,
  pero conviene separarlas unos milímetros, como en los vecinos.
