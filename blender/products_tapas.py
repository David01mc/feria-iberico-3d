"""Tapas y mobiliario de caseta para build_products.py (stand de Piel de Toro).

Mismo criterio que los productos ibéricos: materiales procedurales horneados en un atlas, una
malla y un material por pieza, para instanciarlos sin coste. Aquí entran también las piezas de
caseta que se repiten mucho y viven de su textura (silla de enea, velador con mantón): así el
mantón lleva su bordado y la enea su trenzado sin un material por silla.

Orígenes: centro de la base, en el suelo. El frente mira a −Y (+Z en el visor).
"""

import math
import random

import bmesh
import bpy
from mathutils import Matrix, Vector

from common import Shader, apply_modifiers, assign_faces, boolean, catmull_rom, displace, ground, inset_material, join, lathe, link, rod, sweep_tube
from products_bebidas import between, upright, xyz

# ── Utilidades ────────────────────────────────────────────────────────────────


def blob(name, radii, loc, mat, rotation=(0, 0, 0), subdivisions=2):
    """Elipsoide (guisante, mejillón, gajo de limón…)."""
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=subdivisions, radius=1.0)
    bmesh.ops.scale(bm, vec=Vector(radii), verts=bm.verts)
    obj = link(name, bm, mat)
    obj.rotation_euler = rotation
    obj.location = loc
    return obj


def slab(name, size, loc, mat, rotation=(0, 0, 0)):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
    obj = link(name, bm, mat)
    obj.rotation_euler = rotation
    obj.location = loc
    return obj


def plate(name, radius, mat):
    """Plato llano de loza (perfil del plato de jamón escalado a `radius`)."""
    k = radius / 0.14
    profile = [(0.0, 0.0), (0.0, 0.07 * k), (0.003, 0.08 * k), (0.004, 0.1 * k), (0.012, 0.132 * k),
               (0.018, 0.14 * k), (0.02, 0.139 * k), (0.017, 0.13 * k), (0.009, 0.1 * k), (0.008, 0.0)]
    return upright(lathe(name, profile, segments=64, mat=mat))


# ── Materiales ────────────────────────────────────────────────────────────────


def m_ceramic():
    s = Shader("loza")
    s.set("Base Color", "#f4f1ea")
    s.set("Roughness", 0.12)
    return s.mat


def m_pan():
    """Paellera de acero pulido con la pátina del fuego: oscura, con reflejos y manchas."""
    s = Shader("paellera")
    patina = s.noise(14, detail=5, roughness=0.65)
    s.set("Base Color", s.ramp(patina, [(0.3, "#1f1d1b"), (0.55, "#3b3631"), (0.8, "#5a5047")]))
    s.set("Metallic", 0.85)
    s.set("Roughness", s.ramp(s.noise(22, detail=3), [(0.3, 0.28), (0.8, 0.5)]))
    return s.mat


def m_rice():
    """Arroz de paella: grano a grano, azafrán y socarrat tostado hacia el borde."""
    s = Shader("arroz")
    x, y, _ = xyz(s)
    radial = s.math("SQRT", s.math("ADD", s.math("MULTIPLY", x, x), s.math("MULTIPLY", y, y)))
    grains = s.voronoi(700, feature="F1", randomness=1.0, vector=s.scaled(1.0, 1.7, 1.0))
    base = s.ramp(s.noise(16, detail=3), [(0.3, "#c9780f"), (0.7, "#dc931d")])
    base = s.mix(s.ramp(grains, [(0.0, 0.0), (0.5, 0.45)]), base, "#eab045")
    toasted = s.ramp(s.math("ADD", radial, s.math("MULTIPLY", s.noise(9, detail=3), 0.03)), [(0.2, 0.0), (0.255, 0.85)])
    s.set("Base Color", s.mix(toasted, base, "#8a4a17"))
    s.set("Roughness", 0.42)
    s.set("Normal", s.bump(grains, 0.55, 0.002))
    return s.mat


def m_shrimp():
    """Gamba cocida: rojo anaranjado con anillos del caparazón y brillo."""
    s = Shader("gamba")
    rings = s.wave(260, distortion=2, detail=2, direction="X")
    s.set("Base Color", s.ramp(rings, [(0.25, "#c8431f"), (0.7, "#ec7b45"), (0.95, "#f3b07e")]))
    s.set("Roughness", 0.3)
    s.set("Normal", s.bump(rings, 0.25, 0.0008))
    return s.mat


def m_mussel_shell():
    s = Shader("mejillon")
    s.set("Base Color", s.ramp(s.noise(60, detail=4), [(0.3, "#101218"), (0.7, "#2b3140")]))
    s.set("Roughness", 0.25)
    s.set("Normal", s.bump(s.wave(420, distortion=3), 0.2, 0.0004))
    return s.mat


def m_mussel_meat():
    s = Shader("mejillon_carne")
    s.set("Base Color", s.ramp(s.noise(90), [(0.3, "#d8702c"), (0.7, "#eb9447")]))
    s.set("Roughness", 0.35)
    return s.mat


def m_lemon():
    s = Shader("limon")
    s.set("Base Color", s.ramp(s.noise(80, detail=3), [(0.3, "#e3c52c"), (0.7, "#f1dc5a")]))
    s.set("Roughness", 0.4)
    s.set("Normal", s.bump(s.voronoi(900), 0.2, 0.0003))
    return s.mat


def m_pea():
    s = Shader("guisante")
    s.set("Base Color", s.ramp(s.noise(200), [(0.3, "#4f8a2a"), (0.7, "#6fa63b")]))
    s.set("Roughness", 0.35)
    return s.mat


def m_pepper():
    s = Shader("pimiento")
    s.set("Base Color", s.ramp(s.noise(120), [(0.3, "#9a1510"), (0.7, "#c42a1a")]))
    s.set("Roughness", 0.2)
    return s.mat


def m_tortilla_crust():
    """Tortilla cuajada: dorada con zonas tostadas de la sartén."""
    s = Shader("tortilla_dorada")
    spots = s.ramp(s.noise(28, detail=6, roughness=0.7), [(0.45, 0.0), (0.72, 1.0)])
    base = s.ramp(s.noise(10, detail=3), [(0.3, "#d69a3e"), (0.7, "#e7b659")])
    s.set("Base Color", s.mix(spots, base, "#9b5d22"))
    s.set("Roughness", 0.5)
    s.set("Normal", s.bump(s.noise(70, detail=5), 0.35, 0.0012))
    return s.mat


def m_tortilla_inside():
    """Corte de tortilla: huevo jugoso con láminas de patata."""
    s = Shader("tortilla_corte")
    potato = s.voronoi(55, feature="F1", vector=s.scaled(1.0, 1.0, 3.0))
    base = s.ramp(s.noise(40, detail=3), [(0.3, "#f0d27a"), (0.7, "#f7e29a")])
    base = s.mix(s.ramp(potato, [(0.1, 1.0), (0.3, 0.0)]), base, "#e8c979")
    s.set("Base Color", base)
    s.set("Roughness", 0.55)
    s.set("Normal", s.bump(potato, 0.4, 0.0015))
    return s.mat


def m_manton():
    """
    Mantón de Manila rojo: rosas bordadas (anillos de crema, oro y granate) con hojas verdes
    alrededor, repartidas como en un bordado a mano.
    """
    s = Shader("manton")
    cells = s.voronoi(6, feature="F1", randomness=0.7)
    wobble = s.math("MULTIPLY", s.noise(60, detail=2), 0.05)
    d = s.math("ADD", cells, wobble)
    cloth = s.ramp(s.noise(40, detail=3), [(0.3, "#a30f1a"), (0.7, "#bb1822")])
    leaves = s.math("MULTIPLY", between(s, d, 0.3, 0.44), s.math("GREATER_THAN", s.noise(26, detail=1), 0.5))
    cloth = s.mix(leaves, cloth, "#2f6b3a")
    cloth = s.mix(between(s, d, 0.0, 0.3), cloth, "#f2e4c4")
    cloth = s.mix(between(s, d, 0.2, 0.235), cloth, "#8a1a1a")
    cloth = s.mix(between(s, d, 0.1, 0.125), cloth, "#c98f7a")
    cloth = s.mix(s.math("LESS_THAN", d, 0.07), cloth, "#d4a64a")
    s.set("Base Color", cloth)
    s.set("Roughness", 0.55)
    s.set("Normal", s.bump(s.math("LESS_THAN", d, 0.44), 0.3, 0.001))
    return s.mat


def m_fringe():
    """Flecos de seda del mantón: hebras finas color crema."""
    s = Shader("flecos")
    strands = s.wave(700, direction="X", vector=s.scaled(1, 1, 0))
    s.set("Base Color", s.ramp(strands, [(0.2, "#b99c6a"), (0.6, "#efe0bd")]))
    s.set("Roughness", 0.45)
    s.set("Normal", s.bump(strands, 0.5, 0.0006))
    return s.mat


def m_iron():
    s = Shader("hierro_forjado")
    s.set("Base Color", s.ramp(s.noise(30, detail=3), [(0.3, "#141414"), (0.7, "#262422")]))
    s.set("Metallic", 0.6)
    s.set("Roughness", 0.55)
    return s.mat


def m_painted_wood():
    """Madera pintada de verde caseta, con el desgaste de muchas ferias."""
    s = Shader("madera_verde")
    wear = s.ramp(s.noise(45, detail=6, roughness=0.7), [(0.66, 0.0), (0.74, 1.0)])
    paint = s.ramp(s.noise(12, detail=2), [(0.3, "#285e35"), (0.7, "#327041")])
    s.set("Base Color", s.mix(wear, paint, "#6e5236"))
    s.set("Roughness", 0.45)
    s.set("Normal", s.bump(s.wave(80, distortion=6, direction="Z"), 0.08, 0.0005))
    return s.mat


def m_rush():
    """Asiento de enea trenzada: haces en cruz, dorados y secos."""
    s = Shader("enea")
    a = s.wave(70, distortion=1.0, detail=1, direction="X")
    b = s.wave(70, distortion=1.0, detail=1, direction="Y")
    weave = s.math("MAXIMUM", a, b)
    s.set("Base Color", s.ramp(weave, [(0.35, "#5e4119"), (0.7, "#b58b45"), (0.95, "#d9b56c")]))
    s.set("Roughness", 0.8)
    s.set("Normal", s.bump(weave, 0.6, 0.002))
    return s.mat


def m_spruce():
    """Tapa de abeto de la guitarra, con roseta de marquetería y boca oscura."""
    s = Shader("abeto")
    x, _, z = xyz(s)
    dz = s.math("SUBTRACT", z, 0.33)
    radial = s.math("SQRT", s.math("ADD", s.math("MULTIPLY", x, x), s.math("MULTIPLY", dz, dz)))
    grain = s.wave(170, distortion=1.2, detail=2, direction="X")
    wood = s.ramp(grain, [(0.3, "#d6ac6c"), (0.8, "#e8c68c")])
    rosette = between(s, radial, 0.044, 0.058)
    mosaic = s.ramp(s.voronoi(900), [(0.0, "#2c1a10"), (0.5, "#b8322a"), (1.0, "#1d4e2c")])
    wood = s.mix(rosette, wood, mosaic)
    hole = s.math("LESS_THAN", radial, 0.042)
    s.set("Base Color", s.mix(hole, wood, "#0b0806"))
    s.set("Roughness", 0.3)
    return s.mat


def m_rosewood():
    s = Shader("palosanto")
    s.set("Base Color", s.ramp(s.wave(60, distortion=8, detail=4, direction="Z"), [(0.3, "#3a1a0e"), (0.8, "#6a3319")]))
    s.set("Roughness", 0.28)
    return s.mat


def m_ebony():
    s = Shader("ebano")
    s.set("Base Color", "#141010")
    s.set("Roughness", 0.35)
    return s.mat


def m_nickel():
    s = Shader("niquel")
    s.set("Base Color", "#c9c4b8")
    s.set("Metallic", 1.0)
    s.set("Roughness", 0.25)
    return s.mat


def m_rebujito():
    """Jarra de cristal con rebujito: hielo y líquido pálido abajo, vidrio claro arriba."""
    s = Shader("jarra_rebujito")
    _, _, z = xyz(s)
    liquid = s.ramp(s.noise(35, detail=3), [(0.3, "#cfcf8e"), (0.7, "#e4e2ab")])
    ice = s.math("GREATER_THAN", s.voronoi(55), 0.32)
    liquid = s.mix(s.math("MULTIPLY", ice, 0.45), liquid, "#f5f5e6")
    glass = s.ramp(s.noise(25), [(0.3, "#b9c7c4"), (0.7, "#dfe8e6")])
    filled = s.math("LESS_THAN", z, 0.15)
    s.set("Base Color", s.mix(filled, glass, liquid))
    s.set("Roughness", 0.06)
    return s.mat


def m_mint():
    s = Shader("hierbabuena")
    s.set("Base Color", s.ramp(s.noise(120), [(0.3, "#2f6a24"), (0.7, "#4c8f33")]))
    s.set("Roughness", 0.5)
    return s.mat


# ── Paella ────────────────────────────────────────────────────────────────────

PAN_RADIUS = 0.27


def paella():
    """
    Paellera de 55 cm con paella de marisco recién hecha: arroz con socarrat, gambas,
    mejillones abiertos, tiras de pimiento, guisantes y gajos de limón.
    """
    rng = random.Random(3)
    pan_mat = m_pan()
    r = PAN_RADIUS
    pan = upright(lathe("paellera", [
        (0.0, 0.0), (0.0, r - 0.01), (0.003, r), (0.045, r + 0.012), (0.052, r + 0.018), (0.054, r + 0.016),
        (0.048, r + 0.006), (0.007, r - 0.014), (0.004, 0.0)], segments=72, mat=pan_mat))
    parts = [pan]
    for side in (-1, 1):
        loop = [(side * (r + 0.01 + 0.055 * math.sin(t)), 0.045 * math.cos(t), 0.047) for t in (math.pi * i / 20 for i in range(21))]
        parts.append(sweep_tube(f"asa_{side}", loop, lambda s: 0.005, segments=10, mat=pan_mat))

    rice = upright(lathe("arroz", [(0.0, 0.0), (0.0, r - 0.012), (0.02, r - 0.012), (0.024, r - 0.03), (0.026, 0.0)], segments=72, mat=m_rice()))
    rice.data.transform(Matrix.Translation((0, 0, 0.004)))
    displace(rice, 0.003, 0.02)
    parts.append(rice)
    top = 0.03

    shrimp = m_shrimp()
    for i in range(8):
        a = math.tau * i / 8 + 0.2
        cx, cy = 0.17 * math.cos(a), 0.17 * math.sin(a)
        path = []
        for j in range(16):
            t = j / 15
            ang = a + math.pi / 2 + (t - 0.5) * 3.6
            rad = 0.038 - 0.014 * t
            path.append((cx + rad * math.cos(ang), cy + rad * math.sin(ang), top + 0.008 + 0.006 * math.sin(math.pi * t)))
        parts.append(sweep_tube(f"gamba_{i}", path, lambda s: 0.012 * (1 - 0.7 * s) + 0.0015, segments=12, mat=shrimp))
        tail_a = a + math.pi / 2 + 1.8
        tx, ty = cx + 0.024 * math.cos(tail_a), cy + 0.024 * math.sin(tail_a)
        parts.append(blob(f"cola_{i}", (0.012, 0.007, 0.002), (tx, ty, top + 0.009), shrimp, rotation=(0, 0, tail_a + 1.2)))

    shell, meat = m_mussel_shell(), m_mussel_meat()
    for i in range(7):
        a = math.tau * i / 7 + rng.uniform(-0.2, 0.2)
        rr = 0.085 + rng.uniform(-0.01, 0.01)
        x, y = rr * math.cos(a), rr * math.sin(a)
        for k, off in enumerate((-0.013, 0.013)):
            ox, oy = -math.sin(a) * off, math.cos(a) * off
            parts.append(blob(f"concha_{i}_{k}", (0.03, 0.016, 0.006), (x + ox, y + oy, top + 0.005), shell, rotation=(0, 0, a)))
        parts.append(blob(f"carne_{i}", (0.02, 0.009, 0.006), (x, y, top + 0.009), meat, rotation=(0, 0, a)))

    pepper = m_pepper()
    for i in range(10):
        a = math.tau * i / 10 + 0.5
        rr = 0.13 + rng.uniform(-0.02, 0.05)
        parts.append(slab(f"pimiento_{i}", (0.07, 0.009, 0.003), (rr * math.cos(a), rr * math.sin(a), top + 0.004), pepper, rotation=(0, 0, a + rng.uniform(-0.5, 0.5))))

    pea = m_pea()
    for i in range(34):
        a, rr = rng.uniform(0, math.tau), rng.uniform(0.04, 0.23)
        parts.append(blob(f"guisante_{i}", (0.0055, 0.0055, 0.005), (rr * math.cos(a), rr * math.sin(a), top + 0.002), pea, subdivisions=1))

    lemon = m_lemon()
    for i in range(4):
        a = math.tau * i / 4 + math.pi / 4
        parts.append(blob(f"limon_{i}", (0.038, 0.014, 0.013), (0.025 * math.cos(a), 0.025 * math.sin(a), top + 0.012), lemon, rotation=(0, 0, a)))
    return join(parts, "paella"), {}


# ── Tortilla ──────────────────────────────────────────────────────────────────


def wedge(name, a0, a1, mat):
    """Prisma triangular vertical desde el eje (para cortar porciones de piezas redondas)."""
    bm = bmesh.new()
    base = [bm.verts.new(p) for p in ((0, 0, -0.01), (0.2 * math.cos(a0), 0.2 * math.sin(a0), -0.01), (0.2 * math.cos(a1), 0.2 * math.sin(a1), -0.01))]
    face = bm.faces.new(base)
    result = bmesh.ops.extrude_face_region(bm, geom=[face])
    bmesh.ops.translate(bm, vec=(0, 0, 0.08), verts=[e for e in result["geom"] if isinstance(e, bmesh.types.BMVert)])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return link(name, bm, mat)


def tortilla():
    """Tortilla de patatas de 22 cm en su plato, empezada: falta una porción y está al lado."""
    crust, inside = m_tortilla_crust(), m_tortilla_inside()
    profile = [(0.0, 0.0), (0.0, 0.1)] + catmull_rom(
        [(0.0, 0.1), (0.006, 0.108), (0.02, 0.112), (0.034, 0.109), (0.042, 0.1), (0.045, 0.085)], 14)[1:] + [(0.045, 0.0)]
    body = upright(lathe("tortilla", profile, segments=64, mat=crust))
    displace(body, 0.0015, 0.02)
    apply_modifiers(body)
    portion = body.copy()
    portion.data = body.data.copy()
    bpy.context.scene.collection.objects.link(portion)
    boolean(body, wedge("hueco", math.radians(-25), math.radians(25), inside))
    boolean(portion, wedge("porcion", math.radians(-24), math.radians(24), inside), operation="INTERSECT")
    # En la intersección, las caras del prisma son el corte; la corteza conserva su material.
    inset_material(body, inside, crust, 0.003)
    inset_material(portion, inside, crust, 0.003)
    # La porción, fuera y tumbada de lado junto al hueco.
    portion.data.transform(Matrix.Translation((-0.05, 0, 0)))
    portion.data.transform(Matrix.Rotation(math.radians(80), 4, "X"))
    portion.data.transform(Matrix.Rotation(math.radians(-30), 4, "Z"))
    portion.data.transform(Matrix.Translation((0.135, -0.075, 0.035)))

    dish = plate("plato", 0.16, m_ceramic())
    body.data.transform(Matrix.Translation((-0.025, 0.0, 0.012)))
    return join([dish, body, portion], "tortilla"), {}


# ── Mobiliario de caseta ──────────────────────────────────────────────────────

TABLE_TOP = 0.72
TABLE_RADIUS = 0.3


def velador():
    """
    Velador de caseta: pie de hierro forjado con tres patas y tablero redondo de 60 cm cubierto
    por un mantón rojo bordado puesto en pico, con las cuatro puntas cayendo.
    """
    iron = m_iron()
    parts = [rod("columna", (0, 0, 0.08), (0, 0, TABLE_TOP - 0.03), 0.022, iron, 20)]
    for i in range(3):
        a = math.tau * i / 3
        path = [((0.02 + 0.24 * t) * math.cos(a), (0.02 + 0.24 * t) * math.sin(a), 0.1 * (1 - t) ** 1.6 + 0.012) for t in (j / 14 for j in range(15))]
        parts.append(sweep_tube(f"pata_{i}", path, lambda s: 0.014 * (1 - 0.35 * s), segments=10, mat=iron))
    parts.append(rod("tablero", (0, 0, TABLE_TOP - 0.03), (0, 0, TABLE_TOP - 0.004), TABLE_RADIUS, iron, 48))

    size, n = 1.05, 56
    bm = bmesh.new()
    grid = []
    for j in range(n + 1):
        row = []
        for i in range(n + 1):
            u, v = (i / n - 0.5) * size, (j / n - 0.5) * size
            # Puesto en pico: el cuadrado gira 45°.
            x, y = (u - v) / math.sqrt(2), (u + v) / math.sqrt(2)
            d = math.hypot(x, y)
            if d <= TABLE_RADIUS:
                p = (x, y, TABLE_TOP)
            else:
                hang = d - TABLE_RADIUS
                bend = 0.02 * (1 - math.exp(-hang * 30))
                fold = 0.012 * math.sin(math.atan2(y, x) * 14) * min(1, hang * 8)
                k = (TABLE_RADIUS + bend + 0.03 * hang + fold) / d
                p = (x * k, y * k, TABLE_TOP - hang + bend)
            row.append(bm.verts.new(p))
        grid.append(row)
    for j in range(n):
        for i in range(n):
            bm.faces.new((grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]))
    # Flecos: una cinta de 7 cm que cuelga de todo el borde.
    edge = [grid[0][i] for i in range(n)] + [grid[j][n] for j in range(n)] + [grid[n][i] for i in range(n, 0, -1)] + [grid[j][0] for j in range(n, 0, -1)]
    drop = [bm.verts.new((v.co.x * 1.01, v.co.y * 1.01, v.co.z - 0.07)) for v in edge]
    fringe_faces = []
    for k in range(len(edge)):
        a, b = k, (k + 1) % len(edge)
        fringe_faces.append(bm.faces.new((edge[a], edge[b], drop[b], drop[a])))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in fringe_faces:
        f.material_index = 1
    cloth = link("manton", bm, m_manton())
    cloth.data.materials.append(m_fringe())
    mod = cloth.modifiers.new("Grosor", "SOLIDIFY")
    mod.thickness = 0.003
    mod.offset = 0
    parts.append(cloth)
    obj = join(parts, "velador")
    ground(obj)
    return obj, {"tablero": [0.0, TABLE_TOP + 0.0015, 0.0]}


def silla_enea():
    """Silla de enea de caseta: madera pintada de verde, asiento trenzado y dos palas curvas."""
    wood, rush = m_painted_wood(), m_rush()
    w, d, seat, top = 0.42, 0.4, 0.44, 0.92
    parts = []
    for sx in (-1, 1):
        x = sx * (w / 2 - 0.02)
        parts.append(rod(f"pata_delantera_{sx}", (x, -d / 2 + 0.02, 0), (x, -d / 2 + 0.02, seat + 0.02), 0.018, wood, 12))
        parts.append(rod(f"pata_trasera_{sx}", (x, d / 2 - 0.02, 0), (x, d / 2 + 0.03, top), 0.019, wood, 12))
        parts.append(rod(f"lateral_bajo_{sx}", (x, -d / 2 + 0.02, 0.14), (x, d / 2 - 0.02, 0.14), 0.009, wood, 8))
        parts.append(rod(f"lateral_asiento_{sx}", (x, -d / 2 + 0.02, seat - 0.02), (x, d / 2 - 0.01, seat - 0.02), 0.014, wood, 10))
    for y, z in ((-d / 2 + 0.02, 0.2), (-d / 2 + 0.02, 0.1), (d / 2 - 0.02, 0.16)):
        parts.append(rod(f"travesano_{y}_{z}", (-w / 2 + 0.02, y, z), (w / 2 - 0.02, y, z), 0.009, wood, 8))
    for y in (-d / 2 + 0.02, d / 2 - 0.01):
        parts.append(rod(f"marco_asiento_{y}", (-w / 2 + 0.02, y, seat - 0.02), (w / 2 - 0.02, y, seat - 0.02), 0.014, wood, 10))

    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=12, y_segments=12, size=0.5)
    for v in bm.verts:
        u, t = v.co.x * 2, v.co.y * 2
        v.co.x, v.co.y = u * (w - 0.03) / 2, t * (d - 0.02) / 2 + 0.005
        v.co.z = seat + 0.008 - 0.012 * (1 - u * u) * (1 - t * t)
    cushion = link("asiento", bm, rush)
    solid = cushion.modifiers.new("Grosor", "SOLIDIFY")
    solid.thickness = 0.03
    solid.offset = -1
    parts.append(cushion)

    for i, (z, h) in enumerate(((0.62, 0.06), (0.8, 0.09))):
        y = d / 2 - 0.02 + 0.05 * (z - seat) / (top - seat)
        steps = 12
        curve = [(-w / 2 + 0.02 + (w - 0.04) * k / steps, y - 0.03 * math.sin(math.pi * k / steps)) for k in range(steps + 1)]
        crest = [0.02 * math.sin(math.pi * k / steps) if i == 1 else 0.0 for k in range(steps + 1)]
        bm = bmesh.new()
        lo = [bm.verts.new((cx, cy, z - h / 2)) for cx, cy in curve]
        hi = [bm.verts.new((cx, cy, z + h / 2 + c)) for (cx, cy), c in zip(curve, crest)]
        lo_b = [bm.verts.new((cx, cy + 0.016, z - h / 2)) for cx, cy in curve]
        hi_b = [bm.verts.new((cx, cy + 0.016, z + h / 2 + c)) for (cx, cy), c in zip(curve, crest)]
        for k in range(steps):
            bm.faces.new((lo[k], lo[k + 1], hi[k + 1], hi[k]))
            bm.faces.new((lo_b[k + 1], lo_b[k], hi_b[k], hi_b[k + 1]))
            bm.faces.new((hi[k], hi[k + 1], hi_b[k + 1], hi_b[k]))
            bm.faces.new((lo[k + 1], lo[k], lo_b[k], lo_b[k + 1]))
        bm.faces.new((lo[0], hi[0], hi_b[0], lo_b[0]))
        bm.faces.new((lo[-1], lo_b[-1], hi_b[-1], hi[-1]))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        parts.append(link(f"pala_{i}", bm, wood))
    obj = join(parts, "silla_enea")
    ground(obj)
    return obj, {}


GUITAR_OUTLINE = catmull_rom(
    [(0.0, 0.0), (0.012, 0.1), (0.05, 0.165), (0.13, 0.186), (0.21, 0.162), (0.27, 0.122),
     (0.33, 0.134), (0.39, 0.146), (0.44, 0.124), (0.472, 0.075), (0.48, 0.0)],
    40,
)


def guitarra():
    """Guitarra flamenca de 1 m, de pie (la tapa mira al frente): abeto, palosanto y clavijero."""
    spruce, rosewood, ebony, nickel = m_spruce(), m_rosewood(), m_ebony(), m_nickel()
    depth = 0.09
    bm = bmesh.new()
    half = [(x, z) for z, x in GUITAR_OUTLINE]
    ring = half + [(-x, z) for x, z in reversed(half[1:-1])]
    face = bm.faces.new([bm.verts.new((x, -depth / 2, z)) for x, z in ring])
    result = bmesh.ops.extrude_face_region(bm, geom=[face])
    bmesh.ops.translate(bm, vec=(0, depth, 0), verts=[e for e in result["geom"] if isinstance(e, bmesh.types.BMVert)])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bmesh.ops.triangulate(bm, faces=[f for f in bm.faces if len(f.verts) > 4])
    body = link("caja", bm, rosewood)
    assign_faces(body, spruce, lambda c, n: n.y < -0.9)
    parts = [body]
    parts.append(slab("mastil", (0.052, 0.03, 0.44), (0, 0.0, 0.68), rosewood))
    parts.append(slab("diapason", (0.054, 0.006, 0.47), (0, -0.018, 0.67), ebony))
    parts.append(slab("puente", (0.16, 0.012, 0.024), (0, -depth / 2 - 0.006, 0.11), rosewood))
    parts.append(slab("pala", (0.075, 0.02, 0.19), (0, 0.012, 0.99), rosewood, rotation=(math.radians(-12), 0, 0)))
    for i in range(3):
        for sx in (-1, 1):
            z = 0.95 + i * 0.045
            parts.append(rod(f"clavija_{i}_{sx}", (sx * 0.03, 0.02, z), (sx * 0.075, 0.02, z), 0.005, nickel, 8))
    for i in range(6):
        x = (i - 2.5) * 0.0085
        parts.append(rod(f"cuerda_{i}", (x * 1.4, -depth / 2 - 0.012, 0.115), (x, -0.024, 0.9), 0.0007, nickel, 5))
    obj = join(parts, "guitarra")
    ground(obj)
    return obj, {}


def jarra_rebujito():
    """Jarra de cristal de 1,5 l con rebujito, hielo, rodaja de limón y hierbabuena."""
    mat = m_rebujito()
    jug = upright(lathe("jarra", [
        (0.0, 0.0), (0.0, 0.055), (0.004, 0.06), (0.05, 0.063), (0.14, 0.058), (0.2, 0.052),
        (0.215, 0.054), (0.222, 0.056), (0.222, 0.05), (0.15, 0.05), (0.15, 0.0)], segments=48, mat=mat))
    handle = [(0.062 + 0.045 * math.sin(math.pi * t), 0.0, 0.18 - 0.12 * t) for t in (i / 16 for i in range(17))]
    parts = [jug, sweep_tube("asa", handle, lambda s: 0.009, segments=12, mat=mat)]
    parts.append(blob("rodaja", (0.028, 0.028, 0.004), (0.012, -0.01, 0.152), m_lemon(), rotation=(0.3, 0, 0)))
    mint = m_mint()
    for i in range(5):
        a = math.tau * i / 5
        parts.append(blob(f"hoja_{i}", (0.016, 0.008, 0.002), (-0.015 + 0.012 * math.cos(a), 0.012 * math.sin(a), 0.156), mint, rotation=(0.4, 0, a)))
    obj = join(parts, "jarra_rebujito")
    ground(obj)
    return obj, {}


# Nombre → (constructor, resolución del atlas)
TAPAS = {
    "paella": (paella, 2048),
    "tortilla": (tortilla, 1024),
    "velador": (velador, 2048),
    "silla_enea": (silla_enea, 1024),
    "guitarra": (guitarra, 1024),
    "jarra_rebujito": (jarra_rebujito, 512),
}
