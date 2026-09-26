# La Aceitunera · Aceitunas y encurtidos

Puesto de mercado inspirado en las referencias aportadas: vitrina de aceitunas a granel,
pizarra de variedades, tarros en la trasera y expositor para llevar.

## Ficha

| | |
|---|---|
| Parcela | D-55 · x 19 … 25, z 2 … 5 |
| Tipo | Esquina mediana · 6 × 3 m |
| Frente | Norte, hacia la Avenida Central |
| Entrada lateral | Oeste, desde la Calle 4 |
| Altura máxima | 3,5 m |

## Construcción

- Tarima de barro y paredes de yeso y azulejo retranqueadas de los límites compartidos.
- Vitrina de madera oscura y cristal ligero con diez cubetas. Las aceitunas de diez variedades
  usan una sola malla instanciada para evitar cientos de llamadas de dibujo.
- Pizarra de variedades y precio orientativo; dos baldas con tarros en la trasera.
- Expositor abierto de color terracota para tarros de venta.
- Rótulo verde oliva con letras crema y un foco real sobre la vitrina.

La piel de las aceitunas usa `public/assets/textures/olives/skin.webp`, un albedo neutro con
moteado suave. Se regenera con `node scripts/generate-olive-texture.mjs`; el color de cada variedad
se aplica por instancia en Three.js.

## Archivos

- Datos del expositor: `src/config/stands/aceitunas.ts`.
- Cotas y obstáculos: `ACEITUNAS` en `src/config/layouts.ts`.
- Escena y producto: `src/scene/stands/AceitunasStand.tsx` y `OliveBins.tsx`.

Pendiente de revisión visual en el navegador.
