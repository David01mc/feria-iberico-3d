# Bodegas La Escribana · Vinos

> Península de 36 m² en el Espacio Maridaje: bodega en negro y blanco con bandeja blanca volada,
> muro negro con tres cajas de luz, barra de cata y lounge de cuero negro contra el único lado
> cerrado.

Referencia de estilo: stand de bodega de cava en Alimentaria, en negro y blanco, con cubierta
blanca volada, muros negros caligráficos, cajas de luz y lounge. Se ha reinterpretado sin copiar
marca, tipografía ni motivos.

## Ficha

| | |
|---|---|
| Código de parcela | B-50 |
| Tipo y tamaño | Península · grande · 6 × 6 m (36 m²) |
| Parcela (pabellón) | x 7 … 13, z −8 … −2 (filas B y C, al este de la Calle 3) |
| Lados a pasillo | Norte (Pasillo Norte), sur (Avenida Central) y oeste (Calle 3) |
| Lado cerrado | Este (vecinos B-06 y C-06) |
| Frente principal | Norte: fachada hacia la vista inicial |
| Altura máxima | 4,0 m |
| Estado | Construido. Pendiente de revisión visual en el navegador |

## Expositor

- **Bodegas La Escribana**: «Vinos escritos a mano desde 1921». Ribera del Guadiana.
- Tintos de tempranillo, blancos de cayetana y cava de Almendralejo, criados en calados
  centenarios bajo la antigua casa del escribano del pueblo.
- **Productos:**
  - Tinto crianza.
  - Tinto reserva.
  - Blanco cayetana.
  - Cava brut nature.
- **Identidad:**
  - Tipografía Cinzel 600. Pinyon Script queda reservada para la caligrafía de los muros.
  - Negro `#151515`, marfil `#f4f1ea`, oro viejo `#b08d57`.

## Arquitectura

Coordenadas locales: el frente mira a +z (norte). El lado cerrado es −x (este).

- **Tarima:**
  - Madera oscura de 0,15 m con canto de metal dorado.
  - Retranqueada 4 cm respecto a las caras de los muros.
- **Muro negro del fondo** (lado de la Avenida Central):
  - Mide 3,8 × 0,5 m y 3,4 m de alto.
  - Tres cajas de luz de 0,95 × 1,30 m, cada una con el nombre de un producto.
- **Bandeja blanca volada:**
  - Lacado blanco, 3,72 × 4,05 m y 0,53 m de canto.
  - Su cara inferior está a 3,42 m (llega a 3,95 m), separada del muro para no compartir caras.
  - En el canto, el nombre de la bodega y el origen.
- **Lounge:**
  - Muro negro de 3,6 m en todo el lado cerrado.
  - Techo negro a 3,0 m sobre la zona de estar.

## Mobiliario y producto

- **Lounge:**
  - Sofá de dos plazas (`sofa`).
  - Mesa baja lacada (`mesaBaja`) con dos copas de tinto.
  - Dos butacas (`butaca`).
  - Todo el tapizado es de cuero negro.
- **Barra de cata:**
  - Cuerpo negro con tapa de cerámica blanca, 2,6 × 0,7 × 1,05 m.
  - En el frente, el nombre de la bodega.
  - Tres taburetes tapizados del color corporativo (`tabureteTapizado`), dos botellas de tinto
    y tres copas.
- **Baldas doradas** delante de cada caja de luz, con tres botellas cada una: tinto, tinto y cava.
- **Peana negra** con urna de metacrilato (`urna`) y una botella de cava.

## Iluminación

- **Luz real:** un foco sobre la barra.
- **Cajas de luz:** material emisivo.

## Archivos

- **Configuración:** `src/config/stands/vinos.ts`.
- **Cotas y colisiones:** `VINOS` en `src/config/layouts.ts`. Un test comprueba que la bandeja no
  toca el muro y respeta la altura máxima.
- **Escena:** `src/scene/stands/VinosStand.tsx`.
- **Modelos:**
  - `blender/products_bebidas.py`: `botella_vino` y `botella_cava`.
  - `blender/models_maridaje.py`: `copa_vino`, `sofa`, `butaca`, `mesa_baja`,
    `urna_metacrilato` y `taburete_tapizado`.

## Pendiente

- **Revisión visual:** encuadre, materiales y escala. No se ha podido comprobar en el navegador.
- **Caligrafía en los muros negros:** faltan los textos en Pinyon Script, previstos en el diseño.
- **Cajas de luz:** ahora solo llevan texto. Estaban previstos bodegones renderizados en Blender
  con nuestras botellas y copas.
- **Tercera caja de luz:** anuncia «Blanco cayetana», pero su balda muestra botellas de cava.
- **Lounge:** faltan los downlights del techo y los estuches de regalo apilados del diseño.
