# Cervezas Montanera · Cervezas

> Esquina de 18 m² frente al Pasillo Sur: un módulo de feria de aluminio y panel blanco que la
> cervecera ha vestido con un muro de palés, mostradores de cajón de pino, torre de grifos y
> jardineras.

Referencia de estilo: stand modular de cervecera artesana, con muro de palés, rótulo luminoso,
cajas de madera como jardineras y mostradores de cajón con panel de color.

## Ficha

| | |
|---|---|
| Código de parcela | E-50 |
| Tipo y tamaño | Esquina · mediano · 6 × 3 m (18 m²) |
| Parcela (pabellón) | x 7 … 13, z 5 … 8 (fila E, al este de la Calle 3) |
| Lados a pasillo | Sur (Pasillo Sur) y oeste (Calle 3) |
| Lados cerrados | Norte (espalda con Llagar Pumarín) y este (vecino E-06) |
| Frente principal | Sur |
| Altura máxima | 3,5 m |
| Estado | Construido. Pendiente de revisión visual en el navegador |

## Expositor

- **Cervezas Montanera**: «Cerveza artesana de bellota». Desde 2014, dehesa salmantina.
- Cervezas sin filtrar elaboradas con harina de bellota tostada en una antigua nave de secado
  de la dehesa, junto a Guijuelo.
- **Productos:**
  - Rubia de bellota.
  - Tostada.
  - IPA de la dehesa.
  - Negra de castaña.
- **Identidad:**
  - Tipografía Bebas Neue.
  - Granate `#8e2a25`, tostado `#3a2a1c`, ámbar `#e0a526`, papel `#f3e6cf`.

## Arquitectura

Coordenadas locales: el frente mira a +z (sur). Los lados cerrados son −z y +x.

- **Suelo:** pino, 2,5 cm.
- **Módulo de feria:**
  - Paneles lacados en blanco de 2,5 m en el fondo y el lateral cerrado.
  - Perfilería de aluminio visible: postes y travesaños.
- **Muro de palés:**
  - Nueve palés europeos de pie (3 × 3), 3,6 × 2,4 m, delante del panel del fondo.
  - Las tablas de cubierta miran al pasillo.
- **Rótulo:**
  - Granate, de 3,9 × 0,5 m a 2,7 m de alto, con «CERVEZAS MONTANERA».
  - Debajo, el eslogan en ámbar.

## Mobiliario y producto

- **Tres mostradores de cajón de pino** (`mostradorCajon`):
  - Llevan panel frontal granate, del color de marca.
  - Cada uno anuncia un producto y tiene encima una botella y una caña (`botellaCerveza` y
    `vasoCerveza`).
- **Torre de tres grifos** (`torreGrifos`) sobre el mostrador central, con mandos del color de
  marca.
- **Barril de acero de 30 l** (`barrilCerveza`) junto al muro de palés.
- **Dos jardineras:** caja de madera con planta, una en cada esquina del frente.
- **Expositor** junto al lado abierto:
  - Acero negro con tres baldas de pino.
  - Nueve botellas de cerveza.

## Iluminación

Un foco real sobre los mostradores.

## Archivos

- **Configuración:** `src/config/stands/cervezas.ts`.
- **Cotas y colisiones:** `CERVEZAS` en `src/config/layouts.ts`.
- **Escena:** `src/scene/stands/CervezasStand.tsx`.
- **Modelos:**
  - `blender/products_bebidas.py`: `botella_cerveza`.
  - `blender/models_maridaje.py`: `pale`, `mostrador_cajon`, `torre_grifos`, `barril_cerveza` y
    `vaso_cerveza`.
- **Textura:** `plywood` (Poly Haven, CC0) como material `pine`.

## Diferencias con el diseño aprobado

- **Suelo:** estaba prevista moqueta azul; se ha construido de pino.
- **Rótulo:** estaba previsto con bombillas (marquesina); se ha construido como una placa
  granate plana.

## Pendiente

- Revisión visual en el navegador.
- **Colisión del muro de palés:** cubre z −1,43 … −1,29, pero los palés ocupan
  z −1,36 … −1,22. En el paseo se pueden atravesar unos 7 cm. Hay que ajustar `palletWall.z` o la
  colisión.
- **Rótulo de bombillas:** decidir si se hace el de la referencia, que es la seña del stand.
