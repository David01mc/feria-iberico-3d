"""Mobiliario a medida de la feria, modelado por código con Blender (modo background).

Uso (lo lanza `npm run models`):
    blender -b --factory-startup --python blender/build_models.py -- <carpeta_salida>

Convenciones:
- Metros. Origen en el suelo, centrado. En Blender el frente del mueble mira a -Y; el
  exportador glTF lo convierte a +Z, que es el "frente" en three.js.
- Los materiales se nombran con las claves de la librería del visor
  (src/materials/library.tsx), que los sustituye por los PBR compartidos. El material
  'brand' se tiñe en tiempo real con el color corporativo del expositor.
- Las superficies donde se colocan productos se documentan en src/scene/props/catalog.ts.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import common  # noqa: E402
from common import (  # noqa: E402
    arc,
    bevel,
    box,
    curved_sheet,
    export,
    extrude_profile,
    flat_material,
    reset,
    rod,
    wire_basket,
)

# Color base aproximado (solo para visores externos; el visor usa su librería PBR).
# Deben ser todos distintos: gltf-transform fusiona materiales idénticos y se perdería el nombre.
PREVIEW = {
    "lacquerWhite": (0.86, 0.85, 0.82, 1),
    "lacquerBlack": (0.02, 0.02, 0.02, 1),
    "steelBrushed": (0.62, 0.63, 0.64, 1),
    "steelBlack": (0.03, 0.03, 0.035, 1),
    "chrome": (0.9, 0.9, 0.92, 1),
    "glass": (0.9, 0.95, 0.95, 1),
    "rubber": (0.012, 0.012, 0.012, 1),
    "oak": (0.55, 0.38, 0.22, 1),
    "darkWood": (0.18, 0.1, 0.06, 1),
    "ledWarm": (1.0, 0.85, 0.6, 1),
    "ledAmber": (1.0, 0.45, 0.05, 1),
    "oil": (0.55, 0.36, 0.05, 1),
    "brand": (0.5, 0.1, 0.1, 1),
}


common.MATERIAL_RESOLVER = lambda name: flat_material(name, PREVIEW.get(name, (0.8, 0.8, 0.8, 1)))


# ── Modelos ───────────────────────────────────────────────────────────────────


def vitrina_refrigerada():
    """Mostrador frigorífico de 1,5 m con cristal curvo (quesos y embutidos)."""
    w, d = 1.5, 0.9
    box("zocalo", (w - 0.1, d - 0.1, 0.1), (0, 0.02, 0.05), "rubber")
    box("cuerpo", (w, d, 0.75), (0, 0, 0.475), "lacquerWhite", 0.008)
    box("frente_marca", (w - 0.08, 0.012, 0.58), (0, -d / 2 - 0.006, 0.47), "brand", 0.003)
    box("labio", (w, 0.05, 0.05), (0, -d / 2 + 0.025, 0.875), "steelBrushed", 0.006)
    box("bandeja", (w - 0.06, 0.62, 0.02), (0, -0.08, 0.86), "steelBrushed", 0.003)
    box("encimera_trasera", (w, 0.18, 0.03), (0, d / 2 - 0.09, 0.865), "steelBrushed", 0.004)

    glass = arc((-0.07, 0.9), 0.36, 0.38, 0, 90)
    curved_sheet("cristal_curvo", glass, -w / 2 + 0.03, w / 2 - 0.03, 0.008, "glass")
    box("cristal_superior", (w - 0.06, 0.34, 0.008), (0, 0.1, 1.28), "glass")
    box("puertas_traseras", (w - 0.06, 0.008, 0.4), (0, 0.27, 1.07), "glass")
    box("perfil_trasero", (w, 0.03, 0.03), (0, 0.28, 1.27), "steelBrushed", 0.004)
    box("tira_led", (w - 0.1, 0.02, 0.008), (0, -0.05, 1.268), "ledWarm")

    cap = [(-0.45, 0.85), (-0.45, 0.9)] + arc((-0.07, 0.9), 0.38, 0.4, 5, 90) + [(0.3, 1.3), (0.3, 0.85)]
    for side, x in (("izq", -w / 2), ("dcha", w / 2 - 0.025)):
        obj = extrude_profile(f"cabecero_{side}", cap, x, x + 0.025, "lacquerBlack")
        bevel(obj, 0.004, 2)


def vitrina_caliente():
    """Expositor calefactado de sobremesa para croquetas (dos bandejas)."""
    w, d = 0.7, 0.45
    box("base", (w, d, 0.07), (0, 0, 0.035), "steelBlack", 0.005)
    box("bandeja_inferior", (w - 0.06, d - 0.06, 0.01), (0, 0, 0.08), "steelBrushed", 0.002)
    box("bandeja_superior", (w - 0.06, d - 0.14, 0.01), (0, 0.03, 0.28), "steelBrushed", 0.002)
    for sx in (-1, 1):
        for sy in (-1, 1):
            box(f"poste_{sx}_{sy}", (0.02, 0.02, 0.45), (sx * (w / 2 - 0.01), sy * (d / 2 - 0.01), 0.295), "steelBlack")
    box("cristal_frontal", (w - 0.04, 0.006, 0.43), (0, -d / 2 + 0.01, 0.295), "glass")
    box("cristal_trasero", (w - 0.04, 0.006, 0.43), (0, d / 2 - 0.01, 0.295), "glass")
    for sx in (-1, 1):
        box(f"cristal_lateral_{sx}", (0.006, d - 0.04, 0.43), (sx * (w / 2 - 0.01), 0, 0.295), "glass")
    box("techo", (w, d, 0.04), (0, 0, 0.54), "steelBlack", 0.005)
    for sy in (-1, 1):
        box(f"lampara_{sy}", (w - 0.1, 0.03, 0.006), (0, sy * 0.08, 0.517), "ledWarm")


def freidora():
    """Freidora eléctrica profesional doble, de sobremesa, con cestas de rejilla."""
    w, d = 0.62, 0.52
    for sx in (-1, 1):
        for sy in (-1, 1):
            rod(f"pata_{sx}_{sy}", (sx * 0.27, sy * 0.21, 0), (sx * 0.27, sy * 0.21, 0.04), 0.018, "steelBrushed")
    box("cuerpo", (w, d, 0.24), (0, 0, 0.16), "steelBrushed", 0.006)

    # Marco superior con dos cubas.
    z, h = 0.32, 0.08
    box("marco_frontal", (w, 0.08, h), (0, -d / 2 + 0.04, z), "steelBrushed", 0.004)
    box("marco_trasero", (w, 0.12, h), (0, d / 2 - 0.06, z), "steelBrushed", 0.004)
    box("peto", (w, 0.02, 0.14), (0, d / 2 - 0.01, 0.43), "steelBrushed", 0.004)
    for sx in (-1, 1):
        box(f"marco_lateral_{sx}", (0.02, d - 0.2, h), (sx * (w / 2 - 0.01), -0.02, z), "steelBrushed")
        box(f"aceite_{sx}", (0.28, 0.32, 0.005), (sx * 0.16, -0.02, 0.3), "oil")
        wire_basket(f"cesta_{sx}", (0.24, 0.26, 0.11), (sx * 0.16, -0.02, 0.335), 0.0025, "steelBlack")
        rod(f"mango_{sx}", (sx * 0.16, -0.15, 0.39), (sx * 0.16, -0.33, 0.42), 0.006, "steelBlack")
        rod(f"empunadura_{sx}", (sx * 0.16, -0.3, 0.415), (sx * 0.16, -0.39, 0.43), 0.014, "rubber")
        rod(f"mando_{sx}", (sx * 0.15, -d / 2, 0.2), (sx * 0.15, -d / 2 - 0.025, 0.2), 0.02, "steelBlack")
        rod(f"piloto_{sx}", (sx * 0.24, -d / 2, 0.2), (sx * 0.24, -d / 2 - 0.006, 0.2), 0.006, "ledAmber", 12)
    box("divisor", (0.04, d - 0.2, h), (0, -0.02, z), "steelBrushed")


def jamonero():
    """Jamonero profesional de roble con cuna y mordaza de acero, y cuchillo jamonero."""
    for sx in (-1, 1):
        for sy in (-1, 1):
            rod(f"pie_{sx}_{sy}", (sx * 0.24, sy * 0.08, 0), (sx * 0.24, sy * 0.08, 0.01), 0.012, "rubber")
    box("tabla", (0.56, 0.2, 0.04), (0, 0, 0.03), "oak", 0.006)

    # Mordaza trasera (sujeta la pezuña).
    box("poste", (0.025, 0.05, 0.3), (0.235, 0, 0.2), "steelBrushed", 0.003)
    rod("mordaza", (0.18, 0, 0.3), (0.235, 0, 0.3), 0.03, "steelBrushed")
    rod("tornillo", (0.205, 0.0, 0.33), (0.205, 0.0, 0.39), 0.006, "steelBrushed")
    rod("pomo", (0.19, 0.0, 0.39), (0.22, 0.0, 0.39), 0.016, "steelBlack")

    # Cuna delantera en V.
    for sy in (-1, 1):
        rod(f"cuna_{sy}", (-0.14, sy * 0.075, 0.05), (-0.14, sy * 0.035, 0.17), 0.007, "steelBrushed")
    rod("cuna_base", (-0.14, -0.08, 0.052), (-0.14, 0.08, 0.052), 0.008, "steelBrushed")

    # Cuchillo jamonero apoyado en la tabla.
    box("hoja", (0.3, 0.024, 0.0018), (-0.02, -0.078, 0.051), "chrome")
    box("mango", (0.12, 0.024, 0.018), (0.19, -0.078, 0.06), "darkWood", 0.004)


MODELS = {
    "vitrina_refrigerada": vitrina_refrigerada,
    "vitrina_caliente": vitrina_caliente,
    "freidora": freidora,
    "jamonero": jamonero,
}


def main():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    out_dir = argv[0] if argv else os.path.join(os.getcwd(), ".cache", "blender")
    only = set(argv[1:])
    os.makedirs(out_dir, exist_ok=True)
    for name, build in MODELS.items():
        if only and name not in only:
            continue
        reset()
        build()
        path = os.path.join(out_dir, f"{name}.glb")
        export(path)
        print(f"[blender] {name}.glb ({os.path.getsize(path) / 1024:.0f} KB)")


main()
