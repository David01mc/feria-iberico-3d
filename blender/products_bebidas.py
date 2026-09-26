"""Bebidas y decorado del Espacio Maridaje para build_products.py: botellas de vino, cava,
cerveza y sidra, manzana de sidra y el muro de musgo preservado del chigre.

Mismo criterio que los productos ibéricos: materiales procedurales horneados en un atlas, una
malla y un material por pieza. El vidrio se hornea opaco (oscuro y brillante; el visor le añade
una capa de barniz): a la distancia de un stand se lee como botella y se instancia sin coste.
Las etiquetas son procedurales (papel, filetes y renglones de largo aleatorio): de lejos se leen
como etiqueta impresa sin reproducir ninguna marca real.

Orígenes: centro de la base, en el suelo. El frente de la etiqueta mira a −Y (+Z en el visor).
"""

import math

import bmesh
from mathutils import Matrix

from common import Shader, apply_modifiers, catmull_rom, displace, ground, join, lathe, link, sweep_tube

# ── Nodos auxiliares ──────────────────────────────────────────────────────────


def xyz(s):
    split = s.node("ShaderNodeSeparateXYZ")
    s.link(s.coords(), split.inputs["Vector"])
    return split.outputs["X"], split.outputs["Y"], split.outputs["Z"]


def between(s, value, lo, hi):
    """1 dentro de (lo, hi), 0 fuera."""
    return s.math("MULTIPLY", s.math("GREATER_THAN", value, lo), s.math("LESS_THAN", value, hi))


def lerp(s, a, b, t):
    """a + t·(b − a) con escalares o salidas de nodo (rugosidad, máscaras…)."""
    return s.math("ADD", a, s.math("MULTIPLY", t, s.math("SUBTRACT", b, a)))


def lettering(s, x, letter_pitch, word_scale, word_gap):
    """1 donde hay tinta a lo largo de un renglón: letras separadas por huecos finos y palabras."""
    letters = s.math("LESS_THAN", s.math("FRACT", s.math("DIVIDE", x, letter_pitch)), 0.72)
    words = s.math("GREATER_THAN", s.noise(word_scale, detail=0.0, vector=s.scaled(1, 1, 0.25)), word_gap)
    return s.math("MULTIPLY", letters, words)


def rows(s, x, z, z0, z1, pitch, half_width, seed, fill=0.38):
    """Renglones de «texto» centrados entre z0 y z1, de largo aleatorio."""
    line = s.math("DIVIDE", s.math("SUBTRACT", z, z0), pitch)
    ink = s.math("LESS_THAN", s.math("FRACT", line), fill)
    noise = s.node("ShaderNodeTexWhiteNoise")
    noise.noise_dimensions = "1D"
    s.link(s.math("ADD", s.math("FLOOR", line), seed), noise.inputs["W"])
    width = s.math("MULTIPLY", s.math("ADD", s.math("MULTIPLY", noise.outputs["Value"], 0.5), 0.4), half_width)
    inside = s.math("LESS_THAN", s.math("ABSOLUTE", x), width)
    mask = s.math("MULTIPLY", s.math("MULTIPLY", ink, inside), lettering(s, x, pitch * 0.55, 380, 0.36))
    return s.math("MULTIPLY", mask, between(s, z, z0, z1))


def title(s, x, z, z0, z1, half_width):
    """Una línea de título: letras grandes con huecos finos entre ellas."""
    inside = s.math("LESS_THAN", s.math("ABSOLUTE", x), half_width)
    band = s.math("MULTIPLY", between(s, z, z0, z1), inside)
    return s.math("MULTIPLY", band, lettering(s, x, (z1 - z0) * 0.62, 140, 0.3))


# ── Botellas ──────────────────────────────────────────────────────────────────


def bottle_material(name, glass, label, top, glass_roughness=0.05):
    """
    Vidrio + etiqueta + remate (cápsula, chapa o corcho).
    - label: z (desde, hasta), wrap (la etiqueta cubre y < wrap), paper, y una lista de
      capas [(tipo, parámetros, color)] con tipo 'band' | 'rows' | 'title'.
    - top: z desde la que empieza el remate, color, rugosidad y arrugado del metal.
    """
    s = Shader(name)
    x, y, z = xyz(s)
    color = s.ramp(s.noise(30, detail=2), [(0.35, glass[0]), (0.75, glass[1])])
    rough = glass_roughness

    z0, z1 = label["z"]
    on_label = s.math("MULTIPLY", between(s, z, z0, z1), s.math("LESS_THAN", y, label["wrap"]))
    paper = s.ramp(s.noise(180, detail=3), [(0.3, label["paper"]), (0.8, label.get("paper_light", label["paper"]))])
    for kind, params, ink in label["layers"]:
        if kind == "band":
            mask = between(s, z, *params)
        elif kind == "rows":
            mask = rows(s, x, z, *params)
        else:
            mask = title(s, x, z, *params)
        paper = s.mix(mask, paper, ink)
    color = s.mix(on_label, color, paper)
    rough = lerp(s, rough, 0.62, on_label)

    on_top = s.math("GREATER_THAN", z, top["z"])
    color = s.mix(on_top, color, top["color"])
    rough = lerp(s, rough, top["roughness"], on_top)
    s.set("Base Color", color)
    s.set("Roughness", rough)
    crinkle = s.math("MULTIPLY", s.noise(140, detail=6, roughness=0.7), on_top)
    s.set("Normal", s.bump(crinkle, top.get("crinkle", 0.0), 0.0006))
    return s.mat


def shoulder(x0, r0, x1, r1, n=12):
    """Transición suave (coseno) entre el cuerpo y el cuello."""
    return [
        (x0 + (x1 - x0) * t, r0 + (r1 - r0) * (1 - math.cos(math.pi * t)) / 2)
        for t in (i / n for i in range(1, n + 1))
    ]


def bottle_profile(radius, body, neck_start, neck_radius, top):
    """Perfil (altura, radio) de base redondeada, cuerpo, hombro y cuello; `top`: remate."""
    base = [(0.0, 0.0), (0.0008, radius * 0.64), (0.003, radius * 0.94), (0.008, radius)]
    return base + [(body, radius)] + shoulder(body, radius, neck_start, neck_radius) + top


def upright(obj):
    """lathe() gira alrededor de X: la pieza queda de pie (eje X → Z)."""
    obj.data.transform(Matrix.Rotation(-math.pi / 2, 4, "Y"))
    return obj


def bottle(name, profile, mat):
    obj = upright(lathe(name, profile, segments=40, mat=mat))
    ground(obj)
    return obj, {}


def botella_vino():
    """Bordelesa de 75 cl: vidrio verde botella casi negro, etiqueta crema y cápsula granate."""
    profile = bottle_profile(
        0.0376, 0.2, 0.245, 0.0146,
        [(0.284, 0.0146), (0.286, 0.0158), (0.297, 0.0158), (0.2995, 0.0142), (0.3, 0.0)],
    )
    mat = bottle_material(
        "vidrio_tinto",
        ("#0b160d", "#172419"),
        {
            "z": (0.072, 0.168), "wrap": 0.024, "paper": "#e9dfca", "paper_light": "#f3ecdc",
            "layers": [
                ("band", (0.076, 0.0775), "#a8844e"),
                ("band", (0.1625, 0.164), "#a8844e"),
                ("title", (0.138, 0.151, 0.021), "#1c1916"),
                ("rows", (0.086, 0.128, 0.0036, 0.022, 3), "#2a2622"),
            ],
        },
        {"z": 0.243, "color": "#4a1016", "roughness": 0.32, "crinkle": 0.25},
    )
    return bottle("botella_vino", profile, mat)


def botella_cava():
    """Cava de 75 cl: botella champenoise ancha, etiqueta negra con oro y cápsula dorada."""
    profile = bottle_profile(
        0.0442, 0.185, 0.25, 0.0156,
        [(0.286, 0.0156), (0.29, 0.0168), (0.298, 0.0172), (0.303, 0.0128), (0.305, 0.0)],
    )
    mat = bottle_material(
        "vidrio_cava",
        ("#0d1a10", "#1a2c1d"),
        {
            "z": (0.07, 0.15), "wrap": 0.028, "paper": "#151515", "paper_light": "#202020",
            "layers": [
                ("band", (0.074, 0.0755), "#c3a15f"),
                ("band", (0.1445, 0.146), "#c3a15f"),
                ("title", (0.121, 0.134, 0.024), "#d2b273"),
                ("rows", (0.083, 0.112, 0.0038, 0.021, 7), "#b89a62"),
            ],
        },
        {"z": 0.232, "color": "#8f6a24", "roughness": 0.18, "crinkle": 0.45},
    )
    return bottle("botella_cava", profile, mat)


def botella_cerveza():
    """Tercio de 33 cl de vidrio ámbar: etiqueta crema con banda granate y chapa dorada."""
    profile = bottle_profile(
        0.0305, 0.118, 0.172, 0.0125,
        [(0.221, 0.0125), (0.2215, 0.0138), (0.2255, 0.0138), (0.226, 0.0149), (0.2325, 0.0149),
         (0.2335, 0.012), (0.2338, 0.0)],
    )
    mat = bottle_material(
        "vidrio_cerveza",
        ("#241003", "#3d1d07"),
        {
            "z": (0.052, 0.114), "wrap": 0.02, "paper": "#efe0c4", "paper_light": "#f6ead3",
            "layers": [
                ("band", (0.07, 0.097), "#8e2a25"),
                ("title", (0.077, 0.09, 0.019), "#f3e6cf"),
                ("rows", (0.058, 0.0685, 0.0033, 0.016, 11), "#3a2a1c"),
                ("rows", (0.1, 0.1105, 0.0033, 0.016, 17), "#3a2a1c"),
            ],
        },
        {"z": 0.2255, "color": "#c29a3c", "roughness": 0.3, "crinkle": 0.2},
    )
    return bottle("botella_cerveza", profile, mat)


def botella_sidra():
    """Sidra natural de 70 cl: vidrio verde, etiqueta pequeña y corcho que asoma."""
    profile = bottle_profile(
        0.0392, 0.205, 0.24, 0.0152,
        [(0.284, 0.0152), (0.285, 0.0166), (0.292, 0.0166), (0.2925, 0.0114), (0.303, 0.0112),
         (0.305, 0.009), (0.3055, 0.0)],
    )
    mat = bottle_material(
        "vidrio_sidra",
        ("#1d3116", "#2e4a23"),
        {
            "z": (0.098, 0.152), "wrap": 0.022, "paper": "#efe8d2", "paper_light": "#f6f1e2",
            "layers": [
                ("band", (0.101, 0.1045), "#d9b934"),
                ("band", (0.1455, 0.149), "#d9b934"),
                ("title", (0.127, 0.139, 0.02), "#2f6b35"),
                ("rows", (0.108, 0.1225, 0.0034, 0.018, 23), "#3b4a2e"),
            ],
        },
        {"z": 0.2925, "color": "#b38d62", "roughness": 0.85, "crinkle": 0.4},
        glass_roughness=0.08,
    )
    return bottle("botella_sidra", profile, mat)


# ── Manzana ───────────────────────────────────────────────────────────────────


def m_apple():
    """Manzana de sidra: amarilla con chapa roja, lenticelas claras y rugosa junto al rabillo."""
    s = Shader("piel_manzana")
    x, y, z = xyz(s)
    base = s.ramp(s.noise(9, detail=3), [(0.3, "#b39a1c"), (0.7, "#cdb52e")])
    blush = s.ramp(
        s.math("ADD", s.math("MULTIPLY", x, 14), s.noise(6, detail=4)),
        [(0.15, 0.0), (0.85, 0.95)],
    )
    # Vetas por meridianos (de rabillo a cáliz): ruido 1D sobre el ángulo alrededor del eje.
    # Unas bandas planas cortarían la esfera en anillos.
    meridian = s.node("ShaderNodeTexNoise")
    meridian.noise_dimensions = "1D"
    meridian.inputs["Scale"].default_value = 7.0
    meridian.inputs["Detail"].default_value = 4.0
    meridian.inputs["Roughness"].default_value = 0.6
    s.link(s.math("ARCTAN2", y, x), meridian.inputs["W"])
    streaks = s.ramp(meridian.outputs["Fac"], [(0.35, 0.55), (0.65, 1.0)])
    color = s.mix(s.math("MULTIPLY", blush, streaks), base, "#962719")
    dots = s.math("LESS_THAN", s.voronoi(320), 0.08)
    color = s.mix(s.math("MULTIPLY", dots, 0.6), color, "#efe6a8")
    radial = s.math("SQRT", s.math("ADD", s.math("MULTIPLY", x, x), s.math("MULTIPLY", y, y)))
    cavity = s.math("MULTIPLY", s.math("GREATER_THAN", z, 0.058), s.math("LESS_THAN", radial, 0.012))
    color = s.mix(cavity, color, "#6f5a26")
    s.set("Base Color", color)
    s.set("Roughness", s.ramp(s.noise(20), [(0.3, 0.32), (0.8, 0.48)]))
    s.set("Normal", s.bump(s.noise(160, detail=3), 0.08, 0.0003))
    return s.mat


def m_stem():
    s = Shader("rabillo")
    s.set("Base Color", s.ramp(s.noise(80), [(0.3, "#3b2a17"), (0.7, "#5e4526")]))
    s.set("Roughness", 0.8)
    return s.mat


APPLE_PROFILE = catmull_rom(
    [(0.009, 0.0), (0.0055, 0.006), (0.004, 0.014), (0.0075, 0.024), (0.017, 0.033),
     (0.031, 0.0392), (0.046, 0.0395), (0.058, 0.0352), (0.0668, 0.0272), (0.0718, 0.0172),
     (0.0712, 0.0092), (0.0665, 0.0036), (0.063, 0.0)],
    26,
)


def manzana():
    """Manzana de sidra de unos 8 cm, ligeramente irregular, con su rabillo."""
    body = upright(lathe("manzana", APPLE_PROFILE, segments=36, mat=m_apple()))
    displace(body, 0.0016, 0.035)
    path = [(0.0, 0.0, 0.062), (0.0006, 0.0003, 0.07), (0.0022, 0.001, 0.078), (0.0045, 0.002, 0.084)]
    stem = sweep_tube("rabillo", path, lambda t: 0.0017 * (1 - 0.3 * t), segments=8, mat=m_stem())
    obj = join([body, stem], "manzana")
    ground(obj)
    return obj, {}


# ── Muro de musgo ─────────────────────────────────────────────────────────────

MOSS_SIZE = (3.8, 2.4)


def m_moss():
    """
    Musgo preservado en lámina: manchas suaves de varios verdes a tres escalas, fibra fina que
    lo hace mullido y ningún borde nítido. Rugoso y mate; los huecos entre almohadillas los
    oscurece la oclusión horneada.
    """
    s = Shader("musgo")
    patches = s.ramp(s.noise(2.5, detail=3), [(0.28, "#2f4c18"), (0.5, "#4f7a24"), (0.72, "#7a9f33")])
    medium = s.ramp(s.noise(11, detail=5, roughness=0.6), [(0.3, 0.0), (0.7, 1.0)])
    color = s.mix(s.math("MULTIPLY", medium, 0.55), patches, "#a3b849")
    fibers = s.noise(420, detail=8, roughness=0.75)
    color = s.mix(s.ramp(fibers, [(0.3, 0.0), (0.7, 0.55)]), color, "#1d3212")
    s.set("Base Color", color)
    s.set("Roughness", 0.96)
    tufts = s.bump(s.noise(700, detail=6, roughness=0.7), 0.6, 0.0015)
    s.set("Normal", s.bump(s.noise(38, detail=4), 0.35, 0.01, normal=tufts))
    return s.mat


def muro_musgo():
    """
    Triángulo de musgo preservado de 3,8 × 2,4 m para la pared del fondo del chigre: ocupa la
    esquina superior derecha, por encima de la diagonal que sube de abajo a la derecha hacia
    arriba a la izquierda. Almohadillas en relieve y canto con grosor (la tira LED va delante).
    """
    w, h = MOSS_SIZE
    columns, rows = 95, 60
    bm = bmesh.new()
    # Cada fila va del borde diagonal al borde derecho: la diagonal queda recta, sin escalones.
    grid = []
    for j in range(rows + 1):
        v = h * j / rows
        u0 = w * (1 - v / h)
        grid.append([bm.verts.new((-w / 2 + u0 + (w - u0) * i / columns, 0.0, v)) for i in range(columns + 1)])
    for j in range(rows):
        for i in range(columns):
            bm.faces.new((grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.dissolve_degenerate(bm, edges=bm.edges, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    obj = link("muro_musgo", bm, m_moss())
    # Normales hacia −Y (el frente); el grosor crece hacia la pared.
    if obj.data.polygons and obj.data.polygons[0].normal.y > 0:
        obj.data.flip_normals()
    # Almohadillas: Voronoi invertido (centro de cada celda abombado, huecos entre ellas) y un
    # ruido fino encima para que ninguna sea redonda.
    displace(obj, -0.08, 0.11, kind="VORONOI")
    displace(obj, 0.03, 0.05, depth=2)
    solid = obj.modifiers.new("Grosor", "SOLIDIFY")
    solid.thickness = 0.035
    solid.offset = 1
    # Aplicados antes de desplegar UV: la cara trasera del grosor tendría las mismas UV que la
    # delantera y el horneado las pisaría.
    apply_modifiers(obj)
    ground(obj)
    obj["ao_distance"] = 0.06
    return obj, {}


# Nombre → (constructor, resolución del atlas)
BEBIDAS = {
    "botella_vino": (botella_vino, 1024),
    "botella_cava": (botella_cava, 1024),
    "botella_cerveza": (botella_cerveza, 1024),
    "botella_sidra": (botella_sidra, 1024),
    "manzana": (manzana, 512),
}

DECORADO = {
    # 1024: a 2048 pesaba 6,3 MB en KTX2 y el ruido del musgo no lo aprovecha a 2 m.
    "muro_musgo": (muro_musgo, 1024),
}
