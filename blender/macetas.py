"""Macetas de la feria: plantas de Poly Haven puestas en jarrones y plantas mediterráneas por código.

Uso (lo lanza `npm run models -- macetas`):
    blender -b --factory-startup --python blender/macetas.py -- <carpeta_salida> [maceta ...]

- Compuestas: toman los glTF originales que `npm run assets` deja en .cache/polyhaven (plantas
  y jarrones CC0 marcados `raw` en el manifiesto), eligen una variante, escalan el jarrón a
  tamaño de suelo y plantan la mata con su tierra. Conservan las texturas de Poly Haven.
- Mediterráneas: geranios (en el suelo y colgados de la pared, como en un patio cordobés), un
  olivo y un limonero, modelados aquí con materiales de color: se ven a distancia de stand.

Metros, origen en el centro de la base y frente hacia −Y (+Z en el visor). La maceta de pared
tiene el origen en la pared (y = 0) y crece hacia −Y.
"""

import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bmesh  # noqa: E402
import bpy  # noqa: E402
from mathutils import Matrix, Vector  # noqa: E402

from common import export, lathe, link, reset, rod, srgb, sweep_tube  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POLYHAVEN = os.path.join(ROOT, ".cache", "polyhaven")


def material(name, color, roughness=0.7, metallic=0.0):
    mat = bpy.data.materials.get(name)
    if mat:
        return mat
    mat = bpy.data.materials.new(name)
    if mat.node_tree is None:
        mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = srgb(color)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    return mat


def upright(obj):
    """lathe() gira alrededor de X: la pieza queda de pie (eje X → Z)."""
    obj.data.transform(Matrix.Rotation(-math.pi / 2, 4, "Y"))
    return obj


def bounds(objs):
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
    return (
        Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts))),
        Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts))),
    )


def import_polyhaven(asset, keep):
    """Importa un glTF de Poly Haven y deja solo los objetos cuyo nombre está en `keep`."""
    path = os.path.join(POLYHAVEN, asset, f"{asset}.gltf")
    if not os.path.exists(path):
        raise SystemExit(f"Falta {path}: ejecuta npm run assets")
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    kept = [o for o in new if o.name in keep]
    for o in new:
        if o not in kept:
            bpy.data.objects.remove(o, do_unlink=True)
    for o in kept:
        world = o.matrix_world.copy()
        o.parent = None
        o.matrix_world = world
    return kept


def place(objs, scale, z=0.0):
    """Escala un grupo y lo apoya centrado sobre (0, 0, z)."""
    for o in objs:
        o.matrix_world = Matrix.Scale(scale, 4) @ o.matrix_world
    lo, hi = bounds(objs)
    shift = Vector((-(lo.x + hi.x) / 2, -(lo.y + hi.y) / 2, z - lo.z))
    for o in objs:
        o.location += shift
    return bounds(objs)


def soil(radius, z, name="tierra"):
    """Tierra de maceta: disco ligeramente abombado."""
    bm = bmesh.new()
    bmesh.ops.create_circle(bm, cap_ends=True, radius=radius, segments=32)
    for v in bm.verts:
        v.co.z = z + 0.008 * (1 - (v.co.length / radius) ** 2)
    return link(name, bm, material("tierra", "#3b2a1e", 0.95))


def pot(name, r_base, r_top, height, mat, rim=0.018):
    """Maceta de torno con reborde; devuelve (objeto, radio de la tierra, altura de la tierra)."""
    profile = [
        (0.0, 0.0), (0.0, r_base - 0.01), (0.006, r_base), (height - rim, r_top),
        (height - rim, r_top + 0.012), (height, r_top + 0.012), (height, r_top - 0.012),
        (height * 0.2, r_base - 0.02), (height * 0.2, 0.0),
    ]
    return upright(lathe(name, profile, segments=48, mat=mat)), r_top - 0.015, height - 0.05


# ── Compuestas con Poly Haven ─────────────────────────────────────────────────


def in_vase(vase, vase_scale, plant, variants, plant_scale, sink=0.03, mouth=0.8):
    """Jarrón escalado a tamaño de suelo con una mata de Poly Haven plantada en la boca."""
    lo, hi = place(import_polyhaven(vase, {vase}), vase_scale)
    soil((hi.x - lo.x) / 2 * mouth, hi.z - 0.035)
    place(import_polyhaven(plant, set(variants)), plant_scale, z=hi.z - sink)


def maceta_calathea():
    """Calathea de hoja ancha rayada en jarrón blanco acanalado (0,65 m)."""
    in_vase("ceramic_vase_01", 1.55, "calathea_orbifolia_01", ["calathea_orbifolia_01_a"], 0.95)


def maceta_anthurium():
    """Anthurium de hoja brillante en jarrón de loza azul con flores (1 m)."""
    in_vase("antique_ceramic_vase_01", 1.45, "anthurium_botany_01", ["anthurium_botany_01_a"], 0.62, mouth=0.5)


def maceta_helecho():
    """Helecho que se derrama sobre un jarrón alto y estrecho (1,1 m)."""
    in_vase("ceramic_vase_03", 2.1, "fern_02", ["fern_02_b"], 0.6, sink=0.05)


def arbol_dinero():
    """Pachira de tronco trenzado en macetero cilíndrico gris antracita (1,9 m)."""
    _, inner, top = pot("macetero", 0.2, 0.23, 0.5, material("macetero_antracita", "#2e2f31", 0.55), rim=0.01)
    soil(inner, top)
    place(import_polyhaven("pachira_aquatica_01", {"pachira_aquatica_01_bark_d", "pachira_aquatica_01_leaves_d"}), 0.85, z=top - 0.02)


# ── Mediterráneas por código ──────────────────────────────────────────────────


def leaf_disc(bm, center, radius, normal, lobes=9, wobble=0.18):
    """Hoja redonda festoneada (geranio): abanico de triángulos alrededor del centro."""
    normal = Vector(normal).normalized()
    t = normal.orthogonal().normalized()
    b = normal.cross(t)
    c = bm.verts.new(center)
    n = lobes * 3
    ring = []
    for i in range(n):
        a = math.tau * i / n
        r = radius * (1 + wobble * math.cos(a * lobes))
        # La hoja se curva: el borde cae un poco respecto al centro.
        ring.append(bm.verts.new(Vector(center) + r * (math.cos(a) * t + math.sin(a) * b) - normal * r * 0.25))
    for i in range(n):
        bm.faces.new((c, ring[i], ring[(i + 1) % n]))


def flower_head(bm, center, radius, rng, count=14):
    """Umbela de geranio: bolitas de flor apiñadas en media esfera."""
    for _ in range(count):
        d = Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(0, 1))).normalized() * radius * rng.uniform(0.5, 1)
        geo = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=radius * 0.36)
        bmesh.ops.translate(bm, vec=Vector(center) + d, verts=geo["verts"])


def geranium(center, height, rng, spread=0.15):
    """Mata de geranio rojo: hojas redondas abajo y umbelas altas sobre tallos."""
    cx, cy, cz = center
    bm = bmesh.new()
    for _ in range(46):
        a, r = rng.uniform(0, math.tau), spread * math.sqrt(rng.random())
        p = (cx + r * math.cos(a), cy + r * math.sin(a), cz + rng.uniform(0.03, height * 0.45))
        leaf_disc(bm, p, rng.uniform(0.03, 0.045), (math.cos(a) * r * 3, math.sin(a) * r * 3, 1))
    link("hojas", bm, material("hoja_geranio", "#3f6b2a", 0.6))
    bm = bmesh.new()
    stems = material("tallo_geranio", "#557a35", 0.7)
    for i in range(9):
        a, r = rng.uniform(0, math.tau), spread * 0.8 * math.sqrt(rng.random())
        top = Vector((cx + r * math.cos(a) * 1.3, cy + r * math.sin(a) * 1.3, cz + height * rng.uniform(0.7, 1.0)))
        rod(f"tallo_{i}", (cx + r * math.cos(a) * 0.5, cy + r * math.sin(a) * 0.5, cz), top, 0.004, stems, 6)
        flower_head(bm, top, rng.uniform(0.035, 0.05), rng)
    link("flores", bm, material("flor_geranio", "#d0182c", 0.5))


def maceta_geranios():
    """Maceta de barro con geranios rojos (0,55 m)."""
    _, inner, top = pot("maceta", 0.11, 0.15, 0.24, material("barro", "#b5603a", 0.85))
    soil(inner, top)
    geranium((0, 0, top), 0.32, random.Random(4))


def maceta_geranios_pared():
    """
    Maceta azul de patio cordobés colgada de la pared con su aro de forja. Origen en la pared:
    la maceta sobresale hacia el frente (−Y) y su base está en z = 0.
    """
    iron = material("forja", "#1b1b1b", 0.5, 0.6)
    body, inner, top = pot("maceta", 0.075, 0.1, 0.17, material("barro_azul", "#2a5fa8", 0.45), rim=0.014)
    y = -0.13
    body.data.transform(Matrix.Translation((0, y, 0)))
    soil(inner, top).data.transform(Matrix.Translation((0, y, 0)))
    ring = [(0.112 * math.cos(a), y + 0.112 * math.sin(a), top - 0.02) for a in (math.tau * i / 32 for i in range(33))]
    sweep_tube("aro", ring, lambda t: 0.005, segments=8, mat=iron, caps=False)
    for sx in (-1, 1):
        rod(f"brazo_{sx}", (sx * 0.08, 0, top - 0.02), (sx * 0.08, y + 0.08, top - 0.02), 0.005, iron, 8)
    rod("placa", (0, -0.004, top - 0.06), (0, -0.004, top + 0.02), 0.022, iron, 12)
    geranium((0, y, top), 0.24, random.Random(9), spread=0.11)


def canopy_tree(name, trunk_height, tips, leaf, leaf_size, leaf_count, fruit=None, seed=1):
    """Árbol de maceta: tronco retorcido, ramas hasta `tips` y hojas apiñadas en cada copa."""
    rng = random.Random(seed)
    bark = material(f"corteza_{name}", "#6b5a48", 0.9)
    _, inner, top = pot("maceta", 0.2, 0.28, 0.46, material("barro", "#b0603c", 0.85), rim=0.024)
    soil(inner, top)
    base = Vector((0, 0, top - 0.02))
    path = [base + Vector((0.035 * math.sin(t * 5), 0.03 * math.cos(t * 4), trunk_height * t)) for t in (i / 20 for i in range(21))]
    sweep_tube("tronco", path, lambda s: 0.07 * (1 - 0.45 * s), segments=12, mat=bark)
    fork = path[-1]
    bm = bmesh.new()
    for i, tip in enumerate(tips):
        tip = Vector(tip)
        mid = fork.lerp(tip, 0.5) + Vector((rng.uniform(-0.05, 0.05), rng.uniform(-0.05, 0.05), 0.05))
        branch = [fork.lerp(mid, t / 6) for t in range(6)] + [mid.lerp(tip, t / 6) for t in range(1, 7)]
        sweep_tube(f"rama_{i}", branch, lambda s: 0.03 * (1 - 0.7 * s), segments=8, mat=bark)
        for _ in range(leaf_count):
            d = Vector((rng.gauss(0, 1), rng.gauss(0, 1), rng.gauss(0, 0.7))).normalized()
            p = tip + d * 0.3 * rng.random() ** 0.5
            axis = Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-0.6, 0.6))).normalized()
            side = axis.cross(Vector((0, 0, 1))).normalized()
            lx, ly = leaf_size
            quad = (p - axis * lx / 2, p + side * ly / 2, p + axis * lx / 2, p - side * ly / 2)
            bm.faces.new([bm.verts.new(v) for v in quad])
    link("hojas", bm, material(f"hoja_{name}", leaf, 0.55))
    if fruit:
        color, radii, count = fruit
        bm = bmesh.new()
        for tip in tips:
            for _ in range(count):
                d = Vector((rng.gauss(0, 1), rng.gauss(0, 1), rng.gauss(0, 0.6))).normalized()
                geo = bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1.0)
                bmesh.ops.scale(bm, vec=radii, verts=geo["verts"])
                bmesh.ops.translate(bm, vec=Vector(tip) + d * 0.26, verts=geo["verts"])
        link("frutos", bm, material(f"fruto_{name}", color, 0.4))


def olivo():
    """Olivo en maceta de barro grande: tronco retorcido y copa gris verdosa (1,8 m)."""
    canopy_tree(
        "olivo", 0.75,
        [(0.28, 0.05, 1.45), (-0.25, 0.12, 1.5), (0.02, -0.26, 1.42), (-0.05, 0.02, 1.72), (0.2, 0.25, 1.62)],
        "#56653f", (0.085, 0.017), 900, fruit=("#2b2230", (0.009, 0.009, 0.012), 10), seed=5,
    )


def limonero():
    """Limonero en maceta de barro: copa redonda verde oscura con limones (1,6 m)."""
    canopy_tree(
        "limonero", 0.6,
        [(0.24, 0.0, 1.25), (-0.22, 0.1, 1.3), (0.0, -0.24, 1.22), (0.0, 0.05, 1.5), (-0.1, 0.24, 1.38)],
        "#2e5a24", (0.085, 0.036), 260, fruit=("#e5c62d", (0.03, 0.03, 0.038), 5), seed=8,
    )


# ── Jardín vertical ───────────────────────────────────────────────────────────

GARDEN_SIZE = (2.7, 1.95)
# (asset, variante, escala): matas pequeñas y medianas de Poly Haven para cubrir la pared.
GARDEN_PLANTS = [
    ("fern_02", "fern_02_a", 0.5),
    ("fern_02", "fern_02_d", 0.5),
    ("fern_02", "fern_02_b", 0.32),
    ("calathea_orbifolia_01", "calathea_orbifolia_01_d", 1.1),
    ("calathea_orbifolia_01", "calathea_orbifolia_01_e", 1.1),
    ("anthurium_botany_01", "anthurium_botany_05_e", 1.0),
]


def jardin_vertical():
    """
    Plantas del jardín vertical del llagar: matas de helecho, calathea y anthurium que brotan de
    la pared inclinadas hacia fuera y hacia arriba, repartidas en rejilla con holgura aleatoria.
    Va sobre la lámina de musgo horneada (panel_musgo). Origen en el centro del borde inferior,
    sobre la pared (y = 0); las plantas salen hacia −Y. Cada variante es una malla compartida:
    el GLB la instancia en vez de repetir la geometría.
    """
    rng = random.Random(21)
    templates = []
    for asset in sorted({a for a, _, _ in GARDEN_PLANTS}):
        variants = {v for a, v, _ in GARDEN_PLANTS if a == asset}
        for obj in import_polyhaven(asset, variants):
            # Mata centrada en su base, para girarla alrededor de su propio pie.
            lo, hi = bounds([obj])
            obj.data.transform(Matrix.Translation((-(lo.x + hi.x) / 2, -(lo.y + hi.y) / 2, -lo.z)) @ obj.matrix_world)
            obj.matrix_world = Matrix.Identity(4)
            scale = next(sc for _, v, sc in GARDEN_PLANTS if v == obj.name)
            templates.append((obj, scale))
    w, h = GARDEN_SIZE
    cols, rows = 15, 10
    k = 0
    for row in range(rows):
        for col in range(cols):
            x = -w / 2 + (col + 0.5 + rng.uniform(-0.35, 0.35) + (row % 2) * 0.25) * w / cols
            z = (row + 0.5 + rng.uniform(-0.3, 0.3)) * h / rows
            if abs(x) > w / 2 - 0.08 or z > h - 0.1:
                continue
            template, scale = templates[(k * 7 + rng.randrange(len(templates))) % len(templates)]
            k += 1
            copy = template.copy()
            bpy.context.scene.collection.objects.link(copy)
            tilt = math.radians(rng.uniform(62, 78))
            copy.matrix_world = (
                Matrix.Translation((x, -0.02, z))
                @ Matrix.Rotation(tilt, 4, "X")
                @ Matrix.Rotation(rng.uniform(0, math.tau), 4, "Z")
                @ Matrix.Scale(scale * rng.uniform(0.85, 1.15), 4)
            )
    for template, _ in templates:
        bpy.data.objects.remove(template, do_unlink=True)


MACETAS = {
    "maceta_calathea": maceta_calathea,
    "maceta_anthurium": maceta_anthurium,
    "maceta_helecho": maceta_helecho,
    "arbol_dinero": arbol_dinero,
    "maceta_geranios": maceta_geranios,
    "maceta_geranios_pared": maceta_geranios_pared,
    "olivo": olivo,
    "limonero": limonero,
    "jardin_vertical": jardin_vertical,
}


def main():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    out_dir = argv[0] if argv else os.path.join(ROOT, ".cache", "blender", "macetas")
    only = set(argv[1:])
    os.makedirs(out_dir, exist_ok=True)
    for name, build in MACETAS.items():
        if only and name not in only:
            continue
        reset()
        build()
        path = os.path.join(out_dir, f"{name}.glb")
        export(path)
        faces = sum(len(o.data.polygons) for o in bpy.data.objects if o.type == "MESH")
        print(f"[blender] {name}.glb ({os.path.getsize(path) / 1024:.0f} KB, {faces} caras)")


main()
