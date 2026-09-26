# Piel de Toro · Tapas

> Isla de 54 m², la mayor de la feria. Es una caseta de la Feria de Abril convertida en stand de tapas:
> dos módulos de lona a rayas con pañoletas pintadas y farolillos, El Real con veladores y tablao,
> barra de azulejo con la paella al fuego, La Despensa con los envases de la marca y una
> trastienda encalada con el cubo del escudo.

Referencia de estilo: la caseta de Piel de Toro en la Feria de Sevilla de Miami 2026. Tiene
pañoleta con cenefa floral, lona roja y blanca, guirnaldas de farolillos de lunares y el escudo
de piel con corona y «TP». Es una marca real, cliente o prospecto, así que aquí sí aparecen su
nombre y su logo, que he redibujado en vectorial.

## Ficha

| | |
|---|---|
| Código de parcela | B-51 |
| Tipo y tamaño | Isla · grande · 9 × 6 m (54 m²) |
| Parcela (pabellón) | x −16 … −7, z −8 … −2 (filas B y C, entre las calles 1 y 2) |
| Lados a pasillo | Los cuatro: Pasillo Norte, Avenida Central, Calle 1 y Calle 2 |
| Frente principal | Sur: hacia la Avenida Central, en simetría con Casa Bellotar |
| Altura máxima | 4,5 m (perillas a 4,35 m; cubo del escudo de 3,12 a 4,42 m) |
| Estado | Construido y revisado en capturas headless |

## Expositor

- **Piel de Toro**: «Authentic Spanish Tapas». Distribuye en EE. UU. desde Miami y vende en
  Amazon y en supermercados como Kroger o Winn-Dixie.
- **Productos que se ven en el stand:**
  - **Envases réplica de los reales:** «Tapas Gourmet» (surtido de cuatro quesos), «Serrano
    Ham» 3 oz, «Spanish Tapas Fiesta» 9 oz (serrano, manchego y almendras marcona), rollitos
    de serrano y manchego, y queso de cabra al vino en rueda.
  - **Congelados:** paella de marisco, tortilla española y croquetas de jamón.
- **Identidad:**
  - Tipografía Playfair Display 700. Pinyon Script para «Tapas Gourmet».
  - Rojo `#b3121f`, burdeos `#6d0f14`, oro `#d4a64a`, crema `#f3e7cf` y verde caseta `#2f6b3a`.
- **Dato inventado:** `founded: 2006` en la configuración es un marcador de posición. El stand no
  lo muestra, pero hay que confirmarlo con el cliente.

## Arquitectura

Coordenadas locales: el frente mira a +z (sur). +x es el este (Calle 2).

- **Tarima de albero:** 0,12 m, con canto de madera oscura.
- **Dos módulos de caseta** de 3,6 m (x −4,4…−0,8 y −0,8…2,8):
  - Lona a dos aguas, del alero a 3,0 m a la cumbrera a 4,05 m, con la cumbrera de frente a fondo.
  - Faldones festoneados en los aleros.
  - Pañoleta pintada en los dos testeros, con el escudo en el frontón y los rótulos «Piel de
    Toro» y «Tapas de España» en la banda.
  - Perilla dorada en cada testero.
- **Estructura:** nueve postes blancos y tres tirantes al alero.
- **Barandilla verde:** dos tramos al frente, con la entrada de El Real entre ellos, y todo el
  costado oeste.
- **Trastienda encalada** (x 2,98…4,42, z −2,9…0,95, 2,9 m de alto):
  - Zócalo y cornisa color albero, y puerta a la cocina.
  - Al frente, el panel «Llévatelas a casa» con un QR.
  - Hacia la Calle 2, el escudo retroiluminado.
  - Encima, un cubo de 1,3 m con el escudo luminoso en sus cuatro caras.

## Zonas

1. **El Real** (oeste):
   - Tres veladores con mantón de Manila bordado y nueve sillas de enea.
   - Tablao de roble en la esquina noroeste, con dos sillas y una guitarra.
   - Tapas servidas: jamón, tortilla, tabla de embutidos, cucurucho de croquetas y jarras de
     rebujito.
2. **La barra** (centro):
   - 3,0 × 0,72 m, con frente de azulejo sevillano y tapa de madera oscura.
   - Vitrina caliente con croquetas, tortilla empezada y jarra de rebujito.
   - Paellero con una paella de marisco de 55 cm.
   - Dos barricas de pie para tapear delante.
3. **Trasbarra y La Despensa** (espina de doble cara, detrás de la barra):
   - **Hacia la barra:** quesos al vino, serrano, jarras y cuñas de queso.
   - **Hacia el Pasillo Norte:** la tienda, con Fiesta, rollitos, Serrano Ham, Tapas Gourmet y
     quesos.
   - Rótulo «La Despensa» a las dos caras.
4. **Congelados** (sureste): arcón con tapas de cristal y 45 cajas de paella, tortilla y croquetas.
5. **Plantas:**
   - Dos macetas de geranios flanquean la entrada de El Real.
   - Un limonero en el costado oeste.
   - Cinco macetas azules de patio cordobés colgadas de la trastienda: tres al Pasillo Norte y
     dos a la Calle 2. Salen de `blender/macetas.py`.

## Iluminación

- **Luces reales:** dos focos, uno sobre la barra y otro sobre El Real.
- **Emisivos:**
  - Farolillos: unos 100, en tres mallas instanciadas.
  - Lona: emisivo suave para dar sensación de translucidez.
  - Cubo, paneles y rótulo de La Despensa.

## Archivos

- **Configuración:** `src/config/stands/pieldetoro.ts`.
- **Cotas y colisiones:** `PIELDETORO` en `src/config/layouts.ts`. Hay un test de altura y
  entrada en `layouts.test.ts`.
- **Escena:** `src/scene/stands/PielDeToroStand.tsx`.
- **Caseta:** `src/scene/stands/caseta/`:
  - `Lona.tsx`: lona, faldones y pañoletas.
  - `Farolillos.tsx`.
  - `Envases.tsx`.
  - `textures.ts`: toda la gráfica en canvas (escudo, pañoleta, azulejo, lunares y etiquetas).
- **Modelos:**
  - `blender/products_tapas.py`, horneados: `paella`, `tortilla`, `velador`, `silla_enea`,
    `guitarra` y `jarra_rebujito`.
  - `blender/models_caseta.py`: `paellero` y `arcon_congelador`.

## Pendiente

- **Logo:** falta la versión vectorial oficial. La silueta de la piel está redibujada a mano y
  conviene ajustarla o sustituirla por el SVG de la marca.
- **Envases:** son réplicas dibujadas a partir de las fotos del cliente. Con los artes finales
  en PDF o PNG se podrían usar tal cual.
- **Catálogo:** el de Amazon no se pudo consultar (devolvía 503). Si hay más referencias clave,
  añadirlas a La Despensa.
