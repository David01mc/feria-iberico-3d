"""Mobiliario y menaje del Espacio Maridaje para build_models.py.

Mismas convenciones que el resto del mobiliario: metros, origen en el suelo y centrado, frente
hacia −Y (+Z en el visor) y materiales con nombre de la librería del visor (vidrio, cuero,
pino, líquidos…), que los sustituye por sus PBR compartidos. 'brand' se tiñe con el color del
expositor.
"""

import math

import bmesh
from mathutils import Matrix, Vector

from common import box, lathe, link, rod

# ── Menaje ────────────────────────────────────────────────────────────────────


def upright(obj):
    """lathe() gira alrededor de X: la pieza queda de pie (eje X → Z)."""
    obj.data.transform(Matrix.Rotation(-math.pi / 2, 4, "Y"))
    return obj


def glass_shell(name, profile, thickness=0.0014):
    """Pared de vidrio abierta por arriba con grosor real (el canto del borde se ve)."""
    obj = upright(lathe(name, profile, segments=40, mat="glass"))
    mod = obj.modifiers.new("Grosor", "SOLIDIFY")
    mod.thickness = thickness
    mod.offset = -1
    return obj


def liquid(name, profile, mat):
    """Volumen cerrado de líquido (polos en los dos extremos del perfil)."""
    return upright(lathe(name, profile, segments=40, mat=mat))


def copa_vino():
    """Copa de vino tinto de 21 cm con un dedo de vino."""
    glass_shell("copa", [
        (0.0, 0.0), (0.0006, 0.036), (0.003, 0.037), (0.0045, 0.02), (0.009, 0.005),
        (0.085, 0.0036), (0.094, 0.008), (0.106, 0.026), (0.122, 0.039), (0.145, 0.0435),
        (0.168, 0.042), (0.19, 0.0375), (0.212, 0.0325),
    ])
    liquid("vino", [(0.0965, 0.0), (0.0968, 0.009), (0.106, 0.0245), (0.119, 0.0355), (0.126, 0.038), (0.126, 0.0)], "wine")


def vaso_sidra():
    """Vaso de sidra asturiano: ancho, fino y alto, con un culín recién escanciado."""
    glass_shell("vaso", [(0.0, 0.0), (0.0006, 0.031), (0.004, 0.0332), (0.132, 0.0418)], 0.0012)
    liquid("sidra", [(0.006, 0.0), (0.0062, 0.0328), (0.034, 0.0342), (0.034, 0.0)], "cider")


def vaso_cerveza():
    """Caña de 15 cm llena, con dos dedos de espuma."""
    glass_shell("vaso", [(0.0, 0.0), (0.0006, 0.0282), (0.004, 0.03), (0.15, 0.037)])
    liquid("cerveza", [(0.007, 0.0), (0.0072, 0.0295), (0.121, 0.0352), (0.121, 0.0)], "beer")
    liquid("espuma", [(0.1205, 0.0), (0.1207, 0.0354), (0.14, 0.0364), (0.1445, 0.03), (0.146, 0.0)], "foam")


def torre_grifos():
    """Columna de tiro en T con tres grifos (mandos del color del expositor) y cubeta."""
    upright(lathe("base", [(0.0, 0.0), (0.0, 0.07), (0.012, 0.07), (0.014, 0.05), (0.014, 0.0)], mat="chrome"))
    rod("columna", (0, 0, 0.012), (0, 0, 0.36), 0.034, "chrome", 32)
    rod("travesano", (-0.17, 0, 0.36), (0.17, 0, 0.36), 0.03, "chrome", 32)
    for i, x in enumerate((-0.12, 0.0, 0.12)):
        rod(f"cuerpo_{i}", (x, -0.02, 0.36), (x, -0.065, 0.36), 0.013, "chrome", 20)
        rod(f"cano_{i}", (x, -0.062, 0.355), (x, -0.062, 0.3), 0.007, "chrome", 16)
        rod(f"mando_{i}", (x, -0.045, 0.38), (x, -0.05, 0.53), 0.014, "brand", 16)
        rod(f"pomo_{i}", (x, -0.05, 0.53), (x, -0.05, 0.545), 0.017, "lacquerBlack", 16)
    box("cubeta", (0.42, 0.13, 0.02), (0, -0.07, 0.01), "steelBrushed", 0.004)
    box("rejilla", (0.39, 0.1, 0.004), (0, -0.07, 0.021), "steelBlack")


def barril_cerveza():
    """Barril de acero de 30 l con aros de rodadura, faldón y cabezal de tiro."""
    upright(lathe("barril", [
        (0.0, 0.0), (0.0, 0.15), (0.004, 0.172), (0.028, 0.176), (0.034, 0.19), (0.085, 0.19),
        (0.092, 0.198), (0.1, 0.19), (0.3, 0.19), (0.308, 0.198), (0.315, 0.19), (0.366, 0.19),
        (0.372, 0.176), (0.398, 0.172), (0.4, 0.15), (0.404, 0.05), (0.404, 0.0),
    ], segments=48, mat="steelBrushed"))
    rod("valvula", (0, 0, 0.404), (0, 0, 0.43), 0.026, "steelBrushed", 24)
    rod("cabezal", (0, 0, 0.43), (0, 0, 0.47), 0.034, "lacquerBlack", 24)
    rod("palanca", (0, 0, 0.46), (0.07, 0, 0.48), 0.008, "lacquerBlack", 12)
    rod("manguera", (0.02, 0.02, 0.45), (0.07, 0.12, 0.43), 0.008, "rubber", 12)


# ── Mostradores y estructura ──────────────────────────────────────────────────


def barra_facetada():
    """
    Barra de sidrería de 1,9 m: frente de madera en facetas triangulares que se abren desde un
    vértice adelantado (a la izquierda del centro), tapa negra y zócalo retranqueado.
    """
    w, d, h = 1.9, 0.75, 1.1
    top, plinth = h - 0.045, 0.08
    back = d / 2
    front = -d / 2 + 0.26
    bm = bmesh.new()
    tl, tm, tr = (bm.verts.new(v) for v in ((-w / 2, front, top), (0.4, front - 0.13, top), (w / 2, front, top)))
    bl, bmid, br = (bm.verts.new(v) for v in ((-w / 2, front, plinth), (0.05, front - 0.11, plinth), (w / 2, front, plinth)))
    apex = bm.verts.new((-0.25, -d / 2, plinth + (top - plinth) * 0.52))
    tlb, trb = bm.verts.new((-w / 2, back, top)), bm.verts.new((w / 2, back, top))
    blb, brb = bm.verts.new((-w / 2, back, plinth)), bm.verts.new((w / 2, back, plinth))
    ring = [tl, tm, tr, br, bmid, bl]
    for a, b in zip(ring, ring[1:] + ring[:1]):
        bm.faces.new((a, b, apex))
    bm.faces.new((tl, tlb, trb, tr, tm))
    bm.faces.new((bl, bmid, br, brb, blb))
    bm.faces.new((tl, bl, blb, tlb))
    bm.faces.new((tr, trb, brb, br))
    bm.faces.new((tlb, blb, brb, trb))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    link("frente_facetado", bm, "oak")
    box("tapa", (w + 0.06, d + 0.05, 0.045), (0, -0.01, h - 0.0225), "lacquerBlack", 0.004)
    box("zocalo", (w - 0.08, d - 0.24, plinth), (0, 0.08, plinth / 2), "lacquerBlack")


def mostrador_cajon():
    """Mostrador de 1,1 m hecho como un cajón de pino: listones, postes y panel frontal de marca."""
    w, d, h = 1.1, 0.6, 1.0
    t = 0.022
    for sx in (-1, 1):
        for sy in (-1, 1):
            box(f"poste_{sx}_{sy}", (0.07, 0.07, h - 0.03), (sx * (w / 2 - 0.035), sy * (d / 2 - 0.035), (h - 0.03) / 2), "pine", 0.003)
    for i in range(4):
        y = -d / 2 + (i + 0.5) * d / 4
        box(f"tapa_{i}", (w, d / 4 - 0.006, 0.03), (0, y, h - 0.015), "pine", 0.003)
    slat, gap = 0.14, 0.045
    for i in range(5):
        z = 0.06 + i * (slat + gap) + slat / 2
        for sx in (-1, 1):
            box(f"lateral_{sx}_{i}", (t, d - 0.1, slat), (sx * (w / 2 - t / 2), 0, z), "pine", 0.002)
        box(f"trasero_{i}", (w - 0.1, t, slat), (0, d / 2 - t / 2, z), "pine", 0.002)
    box("travesano_sup", (w - 0.1, t, 0.12), (0, -d / 2 + t / 2, h - 0.03 - 0.06), "pine", 0.002)
    box("travesano_inf", (w - 0.1, t, 0.12), (0, -d / 2 + t / 2, 0.06 + 0.06), "pine", 0.002)
    box("panel_marca", (w - 0.2, 0.012, h - 0.34), (0, -d / 2 + 0.018, h / 2 + 0.005), "brand", 0.002)


def pale():
    """Palé europeo de 1,2 × 0,8 m tumbado: tablas de cubierta, travesaños, tacos y patines."""
    boards = [0.145, 0.1, 0.145, 0.1, 0.145]
    gap = (0.8 - sum(boards)) / (len(boards) - 1)
    y = -0.4
    for i, bw in enumerate(boards):
        box(f"cubierta_{i}", (1.2, bw, 0.022), (0, y + bw / 2, 0.133), "pine", 0.002)
        y += bw + gap
    for i, x in enumerate((-0.5275, 0.0, 0.5275)):
        box(f"travesano_{i}", (0.145, 0.8, 0.022), (x, 0, 0.111), "pine", 0.002)
        for j, yy in enumerate((-0.35, 0.0, 0.35)):
            box(f"taco_{i}_{j}", (0.145, 0.1, 0.078), (x, yy, 0.061), "pine", 0.003)
    for j, yy in enumerate((-0.3275, 0.0, 0.3275)):
        box(f"patin_{j}", (1.2, 0.145, 0.022), (0, yy, 0.011), "pine", 0.002)


# ── Lounge y exposición ───────────────────────────────────────────────────────


def upholstered(name, size, loc, radius):
    """Pieza tapizada en cuero negro: caja con cantos muy redondeados."""
    return box(name, size, loc, "leatherBlack", radius)


def seating(width):
    """Sofá (o butaca) de lounge: base, cojines, respaldo y brazos en cuero negro."""
    d = 0.82
    for sx in (-1, 1):
        for sy in (-1, 1):
            box(f"pata_{sx}_{sy}", (0.04, 0.04, 0.1), (sx * (width / 2 - 0.08), sy * (d / 2 - 0.08), 0.05), "steelBlack")
    upholstered("base", (width, d, 0.22), (0, 0, 0.21), 0.02)
    arms = 0.14
    inner = width - 2 * arms
    cushions = 2 if width > 1.2 else 1
    for i in range(cushions):
        cw = inner / cushions
        x = -inner / 2 + (i + 0.5) * cw
        upholstered(f"cojin_{i}", (cw - 0.01, d - 0.24, 0.14), (x, -0.1, 0.39), 0.035)
    upholstered("respaldo", (inner, 0.22, 0.36), (0, d / 2 - 0.13, 0.5), 0.045)
    for sx in (-1, 1):
        upholstered(f"brazo_{sx}", (arms, d, 0.44), (sx * (width / 2 - arms / 2), 0, 0.32), 0.035)


def sofa():
    """Sofá de dos plazas en cuero negro (lounge de la bodega)."""
    seating(2.0)


def butaca():
    seating(0.78)


def mesa_baja():
    """Mesa de centro lacada en blanco con patas de acero negro."""
    w, d, h = 0.9, 0.55, 0.4
    box("tapa", (w, d, 0.04), (0, 0, h - 0.02), "lacquerWhite", 0.006)
    for sx in (-1, 1):
        for sy in (-1, 1):
            x, y = sx * (w / 2 - 0.06), sy * (d / 2 - 0.06)
            rod(f"pata_{sx}_{sy}", (x, y, 0), (x, y, h - 0.04), 0.012, "steelBlack", 12)


def urna_metacrilato():
    """Urna de metacrilato de 38 cm sobre peana negra (se coloca una botella dentro)."""
    s, h, t = 0.26, 0.38, 0.004
    box("peana", (s + 0.02, s + 0.02, 0.02), (0, 0, 0.01), "lacquerBlack", 0.003)
    for sx in (-1, 1):
        box(f"lado_x_{sx}", (t, s, h), (sx * (s / 2 - t / 2), 0, 0.02 + h / 2), "glass")
        box(f"lado_y_{sx}", (s - 2 * t, t, h), (0, sx * (s / 2 - t / 2), 0.02 + h / 2), "glass")
    box("techo", (s, s, t), (0, 0, 0.02 + h + t / 2), "glass")


def taburete_tapizado():
    """Taburete alto de barra: asiento redondo tapizado (color de marca), patas y aro de acero."""
    seat = upright(lathe("asiento", [(0.0, 0.0), (0.0, 0.17), (0.015, 0.19), (0.075, 0.19), (0.09, 0.17), (0.092, 0.0)], segments=40, mat="brand"))
    seat.data.transform(Matrix.Translation((0, 0, 0.66)))
    for sx in (-1, 1):
        for sy in (-1, 1):
            rod(f"pata_{sx}_{sy}", (sx * 0.12, sy * 0.12, 0.66), (sx * 0.19, sy * 0.19, 0), 0.011, "steelBlack", 12)
    k = 0.19 - (0.19 - 0.12) * 0.28 / 0.66
    corners = [Vector((sx * k, sy * k, 0.28)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    for i, (a, b) in enumerate(zip(corners, corners[1:] + corners[:1])):
        rod(f"aro_{i}", a, b, 0.008, "steelBlack", 10)


# Nombre → constructor (mismo formato que MODELS de build_models.py)
MARIDAJE = {
    "copa_vino": copa_vino,
    "vaso_sidra": vaso_sidra,
    "vaso_cerveza": vaso_cerveza,
    "torre_grifos": torre_grifos,
    "barril_cerveza": barril_cerveza,
    "barra_facetada": barra_facetada,
    "mostrador_cajon": mostrador_cajon,
    "pale": pale,
    "sofa": sofa,
    "butaca": butaca,
    "mesa_baja": mesa_baja,
    "urna_metacrilato": urna_metacrilato,
    "taburete_tapizado": taburete_tapizado,
}
