"""Mobiliario de la caseta de Piel de Toro para build_models.py: paellero y arcón congelador.

Mismas convenciones que el resto del mobiliario: metros, origen en el suelo y centrado, frente
hacia −Y (+Z en el visor) y materiales con nombre de la librería del visor. 'brand' se tiñe
con el color del expositor.
"""

import math

from common import box, rod, sweep_tube


def ring(name, radius, z, thickness, mat, segments=48):
    path = [(radius * math.cos(a), radius * math.sin(a), z) for a in (math.tau * i / segments for i in range(segments + 1))]
    return sweep_tube(name, path, lambda s: thickness, segments=10, mat=mat, caps=False)


def paellero():
    """Paellero de gas de sobremesa: tres coronas de quemadores sobre patas de acero negro."""
    top = 0.12
    for i, r in enumerate((0.07, 0.14, 0.21)):
        ring(f"corona_{i}", r, top - 0.03, 0.009, "steelBlack")
        ring(f"llama_{i}", r, top - 0.02, 0.003, "ledAmber")
    for i in range(6):
        a = math.tau * i / 6
        rod(f"brazo_{i}", (0.03 * math.cos(a), 0.03 * math.sin(a), top - 0.035), (0.23 * math.cos(a), 0.23 * math.sin(a), top - 0.035), 0.006, "steelBlack", 8)
        rod(f"apoyo_{i}", (0.2 * math.cos(a), 0.2 * math.sin(a), top - 0.035), (0.2 * math.cos(a), 0.2 * math.sin(a), top), 0.006, "steelBlack", 8)
    for i in range(3):
        a = math.tau * i / 3 + 0.5
        rod(f"pata_{i}", (0.22 * math.cos(a), 0.22 * math.sin(a), top - 0.035), (0.25 * math.cos(a), 0.25 * math.sin(a), 0), 0.009, "steelBlack", 10)
    rod("toma", (0, 0, top - 0.035), (0, -0.3, top - 0.05), 0.008, "steelBrushed", 10)
    rod("llave", (0, -0.3, top - 0.05), (0, -0.33, top - 0.05), 0.016, "brand", 16)


def arcon_congelador():
    """Arcón congelador de 1,3 m con tapas correderas de cristal y frente de marca."""
    w, d, h = 1.3, 0.68, 0.86
    t = 0.06
    floor = 0.5
    box("zocalo", (w - 0.06, d - 0.06, 0.08), (0, 0, 0.04), "rubber")
    box("frente", (w, t, h - 0.08), (0, -d / 2 + t / 2, 0.08 + (h - 0.08) / 2), "lacquerWhite", 0.01)
    box("trasera", (w, t, h - 0.08), (0, d / 2 - t / 2, 0.08 + (h - 0.08) / 2), "lacquerWhite", 0.01)
    for sx in (-1, 1):
        box(f"lateral_{sx}", (t, d - 2 * t, h - 0.08), (sx * (w / 2 - t / 2), 0, 0.08 + (h - 0.08) / 2), "lacquerWhite", 0.01)
    box("fondo", (w - 2 * t, d - 2 * t, floor - 0.08), (0, 0, 0.08 + (floor - 0.08) / 2), "lacquerWhite")
    box("panel_marca", (w - 0.12, 0.01, h - 0.3), (0, -d / 2 - 0.005, 0.1 + (h - 0.3) / 2 + 0.04), "brand", 0.003)
    box("marco", (w + 0.01, d + 0.01, 0.025), (0, 0, h), "steelBrushed", 0.004)
    for i, (x, y) in enumerate(((-w / 4 + 0.005, -0.012), (w / 4 - 0.005, 0.012))):
        box(f"tapa_{i}", (w / 2 - 0.04, d - 0.1, 0.008), (x, y * 0, h + 0.016 + i * 0.012), "glass")
        box(f"tirador_{i}", (0.2, 0.025, 0.012), (x + (0.18 if i else -0.18), -d / 2 + 0.07, h + 0.028 + i * 0.012), "steelBrushed", 0.003)
    box("led", (w - 0.2, 0.02, 0.008), (0, d / 2 - t - 0.02, h - 0.03), "ledWarm")


CASETA = {
    "paellero": paellero,
    "arcon_congelador": arcon_congelador,
}
