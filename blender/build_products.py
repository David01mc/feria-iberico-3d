"""Productos ibéricos de la feria, modelados y texturizados por código con Blender.

Uso (lo lanza `npm run models`):
    blender -b --factory-startup --python blender/build_products.py -- <carpeta_salida> [producto ...]

Cada producto se modela con materiales procedurales (veteado, grasa, pleita, rebozado…),
se hornean con Cycles a un único atlas (color, rugosidad y relieve) y se exporta a GLB como
UNA malla con UN material: así el visor lo pinta cientos de veces con instancias.

Orígenes:
- Productos apoyados: centro de la base, en el suelo.
- Productos colgados (jamón colgado, chorizos, salchichón): el punto del gancho.
Además se genera meta.json con tamaños y anclajes (coordenadas del visor, Y arriba).
"""

import json
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bmesh  # noqa: E402
import bpy  # noqa: E402
from mathutils import Matrix, Vector  # noqa: E402

from common import (  # noqa: E402
    Shader,
    assign_faces,
    bake_to_textures,
    boolean,
    catmull_rom,
    dimensions,
    displace,
    export,
    inset_material,
    join,
    lathe,
    link,
    reset,
    subdivide,
    sweep_tube,
    to_three,
)

# ── Materiales procedurales ───────────────────────────────────────────────────


def m_ham_rind():
    """Corteza del jamón: dorada, moteada, con afloramientos claros y arrugas finas."""
    s = Shader("corteza_jamon")
    mottle = s.noise(9, detail=6, roughness=0.6)
    base = s.ramp(mottle, [(0.3, "#3d1d0c"), (0.55, "#683716"), (0.8, "#8a5024")])
    # Eflorescencias finas de sal y grasa aflorada, no manchas grandes.
    salt = s.ramp(s.noise(90, detail=2), [(0.66, 0.0), (0.72, 1.0)])
    s.set("Base Color", s.mix(s.math("MULTIPLY", salt, 0.35), base, "#b89a70"))
    s.set("Roughness", s.ramp(mottle, [(0.3, 0.36), (0.8, 0.6)]))
    s.set("Normal", s.bump(s.noise(55, detail=8, roughness=0.65, distortion=0.4), 0.35, 0.002))
    return s.mat


def m_ham_fat():
    """Tocino de bellota: cremoso, amarillento y brillante."""
    s = Shader("grasa_jamon")
    s.set("Base Color", s.ramp(s.noise(22, detail=4), [(0.35, "#c99f58"), (0.72, "#e6cc8e")]))
    s.set("Roughness", 0.3)
    s.set("Normal", s.bump(s.noise(80, detail=3), 0.12, 0.001))
    return s.mat


def m_ham_meat():
    """Magro veteado: rojo profundo con vetas de grasa infiltrada."""
    s = Shader("magro_jamon")
    base = s.ramp(s.noise(14, detail=5), [(0.3, "#5a1215"), (0.6, "#7b1f22"), (0.82, "#8d292a")])
    veins = s.ramp(s.noise(8, detail=8, roughness=0.62, distortion=2.2), [(0.47, 0.0), (0.5, 1.0), (0.53, 0.0)])
    fine = s.ramp(s.noise(28, detail=6, distortion=1.6), [(0.49, 0.0), (0.505, 1.0), (0.52, 0.0)])
    marbling = s.math("MAXIMUM", veins, s.math("MULTIPLY", fine, 0.7))
    s.set("Base Color", s.mix(marbling, base, "#ead6c6"))
    s.set("Roughness", 0.28)
    s.set("Normal", s.bump(s.wave(60, distortion=4, detail=3, direction="X"), 0.08, 0.0005))
    return s.mat


def m_hoof():
    s = Shader("pezuna")
    s.set("Base Color", s.ramp(s.noise(30, detail=5), [(0.3, "#151211"), (0.7, "#3a302a")]))
    s.set("Roughness", 0.32)
    s.set("Normal", s.bump(s.noise(120, detail=4), 0.2, 0.0005))
    return s.mat


def m_cord():
    """Cordel bicolor rojo y blanco para colgar."""
    s = Shader("cordel")
    bands = s.wave(160, profile="SAW", direction="DIAGONAL")
    s.set("Base Color", s.ramp(bands, [(0.0, "#b3261e"), (0.49, "#b3261e"), (0.5, "#efe7da"), (1.0, "#efe7da")]))
    s.set("Roughness", 0.85)
    s.set("Normal", s.bump(bands, 0.3, 0.0005))
    return s.mat


def m_string():
    """Bramante de atar embutidos."""
    s = Shader("bramante")
    twist = s.wave(220, profile="SAW", direction="DIAGONAL")
    s.set("Base Color", s.ramp(s.noise(60), [(0.3, "#bba986"), (0.7, "#dccfb2")]))
    s.set("Roughness", 0.9)
    s.set("Normal", s.bump(twist, 0.4, 0.0004))
    return s.mat


def m_cheese_rind(name, colors):
    """
    Corteza de queso curado: dibujo de pleita en zigzag en el costado y flor (anillos y
    pétalos) en las caras, como dejan los moldes tradicionales.
    """
    s = Shader(name)
    split = s.node("ShaderNodeSeparateXYZ")
    s.link(s.coords(), split.inputs["Vector"])
    x, y, z = split.outputs["X"], split.outputs["Y"], split.outputs["Z"]
    angle = s.math("ARCTAN2", y, x)
    radius = s.math("SQRT", s.math("ADD", s.math("MULTIPLY", x, x), s.math("MULTIPLY", y, y)))
    zig = s.math("ABSOLUTE", s.math("SUBTRACT", s.math("FRACT", s.math("MULTIPLY", angle, 6.5)), 0.5))
    band = s.math("FRACT", s.math("ADD", s.math("MULTIPLY", z, 95), s.math("MULTIPLY", zig, 1.8)))
    side = s.math("ABSOLUTE", s.math("SUBTRACT", band, 0.5))
    rings = s.math("ABSOLUTE", s.math("SUBTRACT", s.math("FRACT", s.math("MULTIPLY", radius, 70)), 0.5))
    petals = s.math("MULTIPLY", s.math("ADD", s.math("SINE", s.math("MULTIPLY", angle, 18)), 1), 0.25)
    top = s.math("MULTIPLY", s.math("ADD", rings, petals), 0.8)
    mask = s.up_facing(0.8)
    height = s.math("ADD", s.math("MULTIPLY", side, s.math("SUBTRACT", 1, mask)), s.math("MULTIPLY", top, mask))
    dark, mid, light = colors
    base = s.ramp(s.noise(12, detail=5), [(0.3, dark), (0.55, mid), (0.8, light)])
    groove = s.math("MULTIPLY", s.math("SUBTRACT", 0.5, height), 1.4)
    s.set("Base Color", s.mix(groove, base, dark))
    s.set("Roughness", 0.72)
    s.set("Normal", s.bump(height, 1.0, 0.0015))
    return s.mat


def m_cheese_paste():
    """Pasta prensada de oveja: marfil con ojos pequeños e irregulares."""
    s = Shader("pasta_queso")
    base = s.ramp(s.noise(10, detail=4), [(0.35, "#e7d39c"), (0.7, "#f2e4bd")])
    holes = s.ramp(s.voronoi(85), [(0.0, 1.0), (0.06, 0.0)])
    sparse = s.ramp(s.noise(16, detail=2), [(0.56, 0.0), (0.6, 1.0)])
    eyes = s.math("MULTIPLY", holes, sparse)
    s.set("Base Color", s.mix(eyes, base, "#b89a5c"))
    s.set("Roughness", 0.55)
    s.set("Normal", s.bump(s.math("SUBTRACT", 1, eyes), 0.5, 0.0008))
    return s.mat


def m_cheese_rim():
    s = Shader("canto_corteza")
    s.set("Base Color", "#8d6231")
    s.set("Roughness", 0.7)
    return s.mat


def m_torta_rind():
    s = Shader("corteza_torta")
    s.set("Base Color", s.ramp(s.noise(14, detail=5), [(0.3, "#bf9f63"), (0.7, "#dcc18a")]))
    s.set("Roughness", 0.5)
    s.set("Normal", s.bump(s.noise(150, detail=6, distortion=0.8), 0.3, 0.0006))
    return s.mat


def m_torta_cream():
    """Interior de torta: crema untuosa y brillante."""
    s = Shader("crema_torta")
    s.set("Base Color", s.ramp(s.noise(8, detail=3, distortion=3), [(0.35, "#ecd9a8"), (0.7, "#f6e8c6")]))
    s.set("Roughness", 0.16)
    s.set("Normal", s.bump(s.noise(12, detail=2, distortion=4), 0.25, 0.002))
    return s.mat


def m_chorizo_casing():
    """Tripa de chorizo: rojo pimentón, grasa que transparenta y arrugas del curado."""
    s = Shader("tripa_chorizo")
    base = s.ramp(s.noise(16, detail=5), [(0.3, "#420b06"), (0.55, "#651709"), (0.8, "#80240f")])
    blobs = s.ramp(s.voronoi(70), [(0.0, 1.0), (0.2, 0.0)])
    sparse = s.ramp(s.noise(40, detail=2), [(0.5, 0.0), (0.62, 1.0)])
    fat = s.math("MULTIPLY", blobs, sparse)
    s.set("Base Color", s.mix(s.math("MULTIPLY", fat, 0.7), base, "#c98a72"))
    s.set("Roughness", s.ramp(s.noise(9), [(0.3, 0.26), (0.8, 0.44)]))
    # Arrugas longitudinales del curado (coordenadas estiradas) más poro fino.
    wrinkles = s.noise(30, detail=7, distortion=1.4, vector=s.scaled(1.0, 1.0, 0.35))
    fine = s.noise(140, detail=3)
    height = s.math("ADD", s.math("ADD", wrinkles, s.math("MULTIPLY", fine, 0.3)), s.math("MULTIPLY", fat, 0.3))
    s.set("Normal", s.bump(height, 0.7, 0.0015))
    return s.mat


def m_salchichon_casing():
    """Salchichón: tripa granate con flor de moho blanca (mate) y granos de pimienta."""
    s = Shader("tripa_salchichon")
    base = s.ramp(s.noise(18, detail=4), [(0.3, "#401212"), (0.7, "#6a1f1f")])
    fat = s.math("MULTIPLY", s.ramp(s.voronoi(90), [(0.0, 1.0), (0.22, 0.0)]), s.ramp(s.noise(30), [(0.45, 0.0), (0.55, 1.0)]))
    pepper = s.math("MULTIPLY", s.ramp(s.voronoi(150), [(0.0, 1.0), (0.12, 0.0)]), s.ramp(s.noise(25), [(0.6, 0.0), (0.65, 1.0)]))
    # Flor de moho: un velo blanco suave, no manchas.
    bloom = s.ramp(s.noise(14, detail=7, roughness=0.65), [(0.5, 0.0), (0.78, 0.45)])
    color = s.mix(fat, base, "#dcc3b8")
    color = s.mix(pepper, color, "#140e0c")
    s.set("Base Color", s.mix(bloom, color, "#d8d3c8"))
    s.set("Roughness", s.math("ADD", 0.42, s.math("MULTIPLY", bloom, 0.45)))
    s.set("Normal", s.bump(s.noise(50, detail=6, distortion=1.0), 0.4, 0.001))
    return s.mat


def m_lomo_skin():
    """Exterior del lomo embuchado: rojizo con adobo de pimentón en polvo."""
    s = Shader("exterior_lomo")
    base = s.ramp(s.noise(12, detail=5), [(0.3, "#5c1810"), (0.7, "#86281a")])
    powder = s.ramp(s.noise(70, detail=3), [(0.5, 0.0), (0.62, 1.0)])
    s.set("Base Color", s.mix(s.math("MULTIPLY", powder, 0.75), base, "#b8481f"))
    s.set("Roughness", 0.55)
    s.set("Normal", s.bump(s.noise(200, detail=3), 0.2, 0.0004))
    return s.mat


def m_cecina_skin():
    s = Shader("exterior_cecina")
    base = s.ramp(s.noise(10, detail=6), [(0.25, "#35120d"), (0.55, "#521b13"), (0.8, "#6a291c")])
    dry = s.ramp(s.noise(22, detail=3), [(0.6, 0.0), (0.72, 1.0)])
    s.set("Base Color", s.mix(s.math("MULTIPLY", dry, 0.6), base, "#7c4535"))
    s.set("Roughness", s.ramp(s.noise(12), [(0.3, 0.35), (0.8, 0.55)]))
    s.set("Normal", s.bump(s.noise(30, detail=6, distortion=0.8), 0.3, 0.002))
    return s.mat


def m_chorizo_cut():
    """Corte de chorizo: magro rojo pimentón con tropezones de grasa rosada."""
    s = Shader("corte_chorizo")
    base = s.ramp(s.noise(30, detail=5), [(0.3, "#8d1d0e"), (0.7, "#b33718")])
    fat = s.ramp(s.noise(42, detail=3, distortion=1.6), [(0.58, 0.0), (0.63, 1.0)])
    s.set("Base Color", s.mix(fat, base, "#efd5c7"))
    s.set("Roughness", 0.33)
    s.set("Normal", s.bump(fat, 0.15, 0.0003))
    return s.mat


def m_salchichon_cut():
    s = Shader("corte_salchichon")
    base = s.ramp(s.noise(30, detail=5), [(0.3, "#6e1b20"), (0.7, "#8a2a2d")])
    fat = s.math("MULTIPLY", s.ramp(s.voronoi(110), [(0.0, 1.0), (0.26, 0.0)]), s.ramp(s.noise(35), [(0.4, 0.0), (0.5, 1.0)]))
    pepper = s.math("MULTIPLY", s.ramp(s.voronoi(170), [(0.0, 1.0), (0.14, 0.0)]), s.ramp(s.noise(28), [(0.62, 0.0), (0.66, 1.0)]))
    s.set("Base Color", s.mix(pepper, s.mix(fat, base, "#f0e2d8"), "#15100e"))
    s.set("Roughness", 0.34)
    return s.mat


def m_lomo_cut():
    s = Shader("corte_lomo")
    base = s.ramp(s.noise(18, detail=5), [(0.3, "#7a1a22"), (0.7, "#9c2f38")])
    veins = s.ramp(s.noise(10, detail=6, distortion=2.0), [(0.49, 0.0), (0.5, 1.0), (0.51, 0.0)])
    s.set("Base Color", s.mix(s.math("MULTIPLY", veins, 0.6), base, "#e4c9bf"))
    s.set("Roughness", 0.3)
    return s.mat


def m_cecina_cut():
    s = Shader("corte_cecina")
    base = s.ramp(s.wave(120, distortion=6, detail=4, direction="Z"), [(0.2, "#5e1414"), (0.8, "#861f1e")])
    s.set("Base Color", base)
    s.set("Roughness", 0.3)
    s.set("Normal", s.bump(s.wave(120, distortion=6, detail=4, direction="Z"), 0.1, 0.0003))
    return s.mat


def m_crust():
    """Rebozado de panko: dorado irregular, migas en relieve y tostado en las crestas."""
    s = Shader("rebozado")
    crumbs = s.voronoi(380)
    grain = s.noise(260, detail=4)
    height = s.math("ADD", s.math("MULTIPLY", crumbs, 1.4), s.math("MULTIPLY", grain, 0.6))
    base = s.ramp(s.noise(24, detail=5), [(0.2, "#6e3a10"), (0.5, "#a8651e"), (0.8, "#d0943f")])
    # Crestas de miga más tostadas y valles más claros.
    s.set("Base Color", s.mix(s.ramp(crumbs, [(0.0, 0.0), (0.4, 0.7)]), "#5e2e0c", base))
    s.set("Roughness", 0.5)
    s.set("Normal", s.bump(height, 1.0, 0.0009))
    return s.mat


def m_crust_rim():
    s = Shader("canto_rebozado")
    s.set("Base Color", "#b06f28")
    s.set("Roughness", 0.6)
    return s.mat


def m_bechamel():
    """Interior de croqueta: bechamel cremosa con tropezones de jamón."""
    s = Shader("bechamel")
    base = s.ramp(s.noise(20, detail=3), [(0.3, "#ecd8ad"), (0.7, "#f5e7c5")])
    bits = s.ramp(s.noise(90, detail=2, distortion=1.0), [(0.66, 0.0), (0.7, 1.0)])
    s.set("Base Color", s.mix(bits, base, "#c0604f"))
    s.set("Roughness", 0.32)
    s.set("Normal", s.bump(s.noise(40, detail=3), 0.2, 0.0006))
    return s.mat


def m_kraft():
    s = Shader("papel_kraft")
    fibers = s.wave(260, distortion=12, detail=6, direction="Z")
    s.set("Base Color", s.ramp(s.noise(30), [(0.3, "#a47c4e"), (0.7, "#c39c6b")]))
    s.set("Roughness", 0.92)
    s.set("Normal", s.bump(fibers, 0.12, 0.0003))
    return s.mat


def m_ceramic():
    s = Shader("ceramica")
    s.set("Base Color", "#f3f0ea")
    s.set("Roughness", 0.12)
    return s.mat


def m_board():
    """Tabla de madera de olivo para servir."""
    s = Shader("tabla_olivo")
    rings = s.wave(16, distortion=7, detail=4, direction="X")
    s.set("Base Color", s.ramp(rings, [(0.2, "#6f4323"), (0.55, "#a06a3b"), (0.85, "#bf8a57")]))
    s.set("Roughness", 0.55)
    s.set("Normal", s.bump(s.noise(160, detail=4), 0.15, 0.0004))
    return s.mat


# ── Geometría de productos ────────────────────────────────────────────────────

HAM_LENGTH = 0.845
HAM_SQUASH = 0.66
# Silueta de pera: maza ancha y redonda que se estrecha deprisa hacia una caña fina.
HAM_PROFILE = catmull_rom(
    [(0.0, 0.0), (0.012, 0.06), (0.035, 0.1), (0.07, 0.13), (0.12, 0.148), (0.19, 0.152),
     (0.27, 0.145), (0.35, 0.125), (0.43, 0.098), (0.5, 0.072), (0.56, 0.052), (0.62, 0.04),
     (0.68, 0.034), (0.73, 0.031), (0.77, 0.03)],
    44,
)
HOOF_PROFILE = catmull_rom([(0.765, 0.03), (0.79, 0.029), (0.815, 0.025), (0.835, 0.017), (0.845, 0.0)], 10)


def ham_bend(x):
    """El jamón se arquea ligeramente hacia arriba en el centro."""
    return 0.025 * math.sin(math.pi * x / HAM_LENGTH)


def ham_radius(x):
    for (xa, ra), (xb, rb) in zip(HAM_PROFILE, HAM_PROFILE[1:]):
        if xa <= x <= xb:
            return ra + (rb - ra) * (x - xa) / max(xb - xa, 1e-9)
    return 0.0


def build_ham(mats):
    """Pieza de jamón a lo largo de +X (maza en x=0, pezuña en x≈0,845) con su corte en V."""
    body = lathe("jamon", HAM_PROFILE, segments=40, squash=HAM_SQUASH, bend=ham_bend, mat=mats["rind"])
    subdivide(body, 1)
    displace(body, 0.006, 0.05)
    hoof = lathe("pezuna", HOOF_PROFILE, segments=40, squash=HAM_SQUASH, bend=ham_bend, mat=mats["hoof"])
    from common import apply_modifiers
    apply_modifiers(body)

    def v_cut(center, normal):
        """Corte en V sobre la maza: deja a la vista el tocino, con el vértice hacia la caña."""
        x, y = center.x, center.y
        return normal.z > 0.6 and x < 0.36 and abs(y) < (0.36 - x) * 0.45

    assign_faces(body, mats["fat"], v_cut)
    return body, hoof


def ham_materials():
    return {"rind": m_ham_rind(), "fat": m_ham_fat(), "meat": m_ham_meat(), "hoof": m_hoof(), "cord": m_cord()}


def cutter_box(name, size, loc, mat, rotation=(0, 0, 0)):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
    obj = link(name, bm, mat)
    obj.location = loc
    obj.rotation_euler = rotation
    bpy.context.view_layer.update()
    obj.data.transform(obj.matrix_world)
    obj.matrix_world = Matrix.Identity(4)
    return obj


def ground(obj):
    """Origen en el centro de la base (apoyado en el suelo)."""
    xs = [v.co.x for v in obj.data.vertices]
    ys = [v.co.y for v in obj.data.vertices]
    zs = [v.co.z for v in obj.data.vertices]
    offset = Vector(((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, min(zs)))
    obj.data.transform(Matrix.Translation(-offset))
    return offset


def disc(name, rx, ry, thickness, face_mat, side_mat, seed, segments=28, wobble=0.06):
    """Rodaja irregular: caras de corte arriba/abajo y canto de tripa."""
    rng = random.Random(seed)
    bm = bmesh.new()
    verts = []
    phase = rng.uniform(0, math.tau)
    for i in range(segments):
        a = math.tau * i / segments
        k = 1 + wobble * math.sin(3 * a + phase) + rng.uniform(-wobble, wobble) * 0.4
        verts.append(bm.verts.new((rx * k * math.cos(a), ry * k * math.sin(a), 0)))
    face = bm.faces.new(verts)
    result = bmesh.ops.extrude_face_region(bm, geom=[face])
    top = [e for e in result["geom"] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=(0, 0, thickness), verts=top)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    obj = link(name, bm, side_mat)
    assign_faces(obj, face_mat, lambda c, n: abs(n.z) > 0.7)
    return obj


# ── Productos ────────────────────────────────────────────────────────────────


def jamon_colgado():
    """Jamón entero colgado por la pezuña con cordel bicolor (origen: el gancho)."""
    mats = ham_materials()
    body, hoof = build_ham(mats)
    band = sweep_tube(
        "atadura",
        [(0.735, 0.036 * math.cos(a), ham_bend(0.735) + 0.036 * HAM_SQUASH * math.sin(a)) for a in (math.tau * i / 32 for i in range(33))],
        lambda s: 0.0035, segments=8, mat=mats["cord"], caps=False,
    )
    loop_points = []
    for i in range(41):
        t = math.pi * (i / 40)
        loop_points.append((0.8 + 0.12 * math.sin(t), 0.02 * math.cos(t) * 0.2, ham_bend(0.8) + 0.03 * math.cos(t)))
    loop = sweep_tube("lazo", loop_points, lambda s: 0.003, segments=8, mat=mats["cord"])
    ham = join([body, hoof, band, loop], "jamon_colgado")
    # Pezuña arriba: +X → +Z, y el gancho (extremo del lazo) en el origen.
    ham.data.transform(Matrix.Rotation(-math.pi / 2, 4, "Y"))
    hook = Vector((0, 0, 0.8 + 0.12))
    ham.data.transform(Matrix.Translation(-hook))
    return ham, {}


def jamon_cortado():
    """Jamón empezado para el jamonero: corte plano sobre la maza con magro veteado."""
    mats = ham_materials()
    body, hoof = build_ham(mats)
    z_cut = ham_bend(0.3) + 0.045
    cutter = cutter_box("corte", (0.66, 0.5, 0.3), (0.23, 0, z_cut + 0.15), mats["meat"], rotation=(0, math.radians(-4), 0))
    boolean(body, cutter)
    inset_material(body, mats["meat"], mats["fat"], 0.011)
    ham = join([body, hoof], "jamon_cortado")
    support_x, clamp_x = 0.3, 0.74
    anchors = {
        "apoyo": to_three((support_x, 0, ham_bend(support_x) - ham_radius(support_x) * HAM_SQUASH)),
        "pezuna": to_three((clamp_x, 0, ham_bend(clamp_x))),
    }
    return ham, anchors


def plato_jamon():
    """Plato de loncheado a cuchillo: lonchas finas y onduladas en rosetón."""
    mats = ham_materials()
    ceramic = m_ceramic()
    plate = lathe(
        "plato",
        [(0.0, 0.0), (0.0, 0.07), (0.003, 0.08), (0.004, 0.1), (0.012, 0.132), (0.018, 0.14),
         (0.02, 0.139), (0.017, 0.13), (0.009, 0.1), (0.008, 0.0)],
        segments=64, mat=ceramic,
    )
    plate.data.transform(Matrix.Rotation(-math.pi / 2, 4, "Y"))
    parts = [plate]
    rng = random.Random(7)
    count = 11
    for i in range(count):
        bm = bmesh.new()
        bmesh.ops.create_grid(bm, x_segments=22, y_segments=9, size=0.5)
        for v in bm.verts:
            u, w = v.co.x * 2, v.co.y * 2
            edge = 1 - 0.18 * (1 - abs(w)) ** 2
            v.co.x = u * 0.07 * edge
            v.co.y = w * 0.03 * (1 - 0.3 * u * u)
            # Ondulación suave de loncha fina cortada a cuchillo.
            v.co.z = 0.0025 * math.sin(u * 3 + i) + 0.0015 * math.sin(w * 3 + i * 0.7)
        slice_obj = link(f"loncha_{i}", bm, mats["meat"])
        mod = slice_obj.modifiers.new("Solidify", "SOLIDIFY")
        mod.thickness = 0.0016
        assign_faces(slice_obj, mats["fat"], lambda c, n: c.y > 0.021)
        angle = math.tau * i / count + rng.uniform(-0.08, 0.08)
        slice_obj.location = (0.066 * math.cos(angle), 0.066 * math.sin(angle), 0.016 + i * 0.0014)
        # Veta de grasa hacia fuera del plato (+y local → radial).
        slice_obj.rotation_euler = (rng.uniform(-0.04, 0.04), rng.uniform(-0.04, 0.04), angle - math.pi / 2)
        parts.append(slice_obj)
    return join(parts, "plato_jamon"), {}


# Rueda de pasta prensada: costado casi recto y cantos firmes (no un cojín).
WHEEL_PROFILE = [(0.0, 0.0), (0.0, 0.092)] + catmull_rom(
    [(0.0, 0.092), (0.001, 0.1), (0.004, 0.104), (0.05, 0.107), (0.096, 0.104), (0.099, 0.1),
     (0.1, 0.092)], 16)[1:] + [(0.1, 0.0)]


def cheese_wheel(name, rind):
    wheel = lathe(name, WHEEL_PROFILE, segments=72, mat=rind)
    wheel.data.transform(Matrix.Rotation(-math.pi / 2, 4, "Y"))
    return wheel


def queso_curado():
    wheel = cheese_wheel("queso_curado", m_cheese_rind("corteza_curado", ("#6f4a22", "#9c7440", "#b8904f")))
    return wheel, {}


def queso_pimenton():
    wheel = cheese_wheel("queso_pimenton", m_cheese_rind("corteza_pimenton", ("#4e150a", "#7e2811", "#9a3a1a")))
    return wheel, {}


def queso_cortado():
    """Rueda con un cuarto cortado: pasta a la vista y canto de corteza."""
    rind = m_cheese_rind("corteza_cortado", ("#6f4a22", "#9c7440", "#b8904f"))
    paste = m_cheese_paste()
    wheel = cheese_wheel("queso_cortado", rind)
    boolean(wheel, cutter_box("cuarto", (0.3, 0.3, 0.3), (0.15, 0.15, 0.05), paste))
    inset_material(wheel, paste, m_cheese_rim(), 0.004)
    return wheel, {}


def cuna_queso():
    """Cuña de un octavo de rueda, apoyada sobre su base."""
    rind = m_cheese_rind("corteza_cuna", ("#6f4a22", "#9c7440", "#b8904f"))
    paste = m_cheese_paste()
    wheel = cheese_wheel("cuna_queso", rind)
    bm = bmesh.new()
    a = math.radians(40)
    base = [bm.verts.new(p) for p in ((0, 0, -0.1), (0.2, 0, -0.1), (0.2 * math.cos(a), 0.2 * math.sin(a), -0.1))]
    face = bm.faces.new(base)
    result = bmesh.ops.extrude_face_region(bm, geom=[face])
    bmesh.ops.translate(bm, vec=(0, 0, 0.3), verts=[e for e in result["geom"] if isinstance(e, bmesh.types.BMVert)])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    boolean(wheel, link("prisma", bm, paste), operation="INTERSECT")
    inset_material(wheel, paste, m_cheese_rim(), 0.003)
    ground(wheel)
    return wheel, {}


def torta():
    """Torta de oveja abierta por arriba, con la crema a la vista."""
    rind = m_torta_rind()
    cream = m_torta_cream()
    profile = [(0.0, 0.0), (0.0, 0.07)] + catmull_rom(
        [(0.0, 0.07), (0.004, 0.08), (0.014, 0.086), (0.03, 0.086), (0.042, 0.082), (0.048, 0.074), (0.05, 0.06)], 14
    )[1:] + [(0.05, 0.0)]
    body = lathe("torta", profile, segments=64, mat=rind)
    body.data.transform(Matrix.Rotation(-math.pi / 2, 4, "Y"))
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=64, radius1=0.066, radius2=0.066, depth=0.1)
    bmesh.ops.translate(bm, vec=(0, 0, 0.038 + 0.05), verts=bm.verts)
    boolean(body, link("tapa", bm, cream))
    return body, {}


def sarta_path(radius_x=0.056, radius_z=0.1, center_z=-0.132, gap_deg=26, samples=90):
    """Herradura que cuelga: óvalo alto con los dos extremos juntos arriba."""
    start = math.radians(90 + gap_deg / 2)
    end = math.radians(90 - gap_deg / 2) + math.tau
    points = []
    for i in range(samples):
        a = start + (end - start) * i / (samples - 1)
        # El peso estira la parte baja: se abomba hacia abajo más que hacia los lados.
        sag = 1 + 0.12 * max(0.0, -math.sin(a))
        points.append(Vector((radius_x * math.cos(a), 0, center_z + radius_z * math.sin(a) * sag)))
    return points


def tied_radius(r, taper=0.06):
    return lambda s: r * max(0.35, min(1.0, s / taper, (1 - s) / taper)) ** 0.35


def chorizo_sarta():
    """Chorizo en herradura (sarta) atado por los extremos (origen: el gancho)."""
    casing = m_chorizo_casing()
    string = m_string()
    path = sarta_path()
    body = sweep_tube("chorizo", path, tied_radius(0.019), segments=20, mat=casing)
    displace(body, 0.0025, 0.012)
    ends = [path[0], path[-1]]
    ties = [sweep_tube(f"nudo_{i}", [e + Vector((0, 0, 0.006)), e + Vector((0, 0, -0.006))], lambda s: 0.009, segments=10, mat=string) for i, e in enumerate(ends)]
    hanger = sweep_tube("colgador", [ends[0], Vector((0, 0, -0.004)), ends[1]], lambda s: 0.0016, segments=6, mat=string)
    return join([body, *ties, hanger], "chorizo_sarta"), {}


def straight_hanging(name, length, radius, casing, seed):
    """Pieza recta colgada por un extremo con lazada de bramante (origen: el gancho)."""
    rng = random.Random(seed)
    string = m_string()
    top = -0.03
    path = [Vector((0.006 * math.sin(i / 12 + rng.uniform(0, 1)), 0, top - length * i / 40)) for i in range(41)]
    body = sweep_tube(name, path, tied_radius(radius, 0.05), segments=20, mat=casing)
    displace(body, radius * 0.1, radius * 0.6)
    tie = sweep_tube("nudo", [path[0] + Vector((0, 0, 0.004)), path[0] + Vector((0, 0, -0.008))], lambda s: radius * 0.5, segments=10, mat=string)
    loop = sweep_tube("lazada", [path[0], Vector((0.008, 0, -0.012)), Vector((0, 0, 0)), Vector((-0.008, 0, -0.012)), path[0]], lambda s: 0.0015, segments=6, mat=string)
    return join([body, tie, loop], name)


def chorizo_vela():
    return straight_hanging("chorizo_vela", 0.3, 0.021, m_chorizo_casing(), 3), {}


def salchichon():
    return straight_hanging("salchichon", 0.42, 0.027, m_salchichon_casing(), 5), {}


def lomo():
    """Lomo embuchado atado en espiral, con un extremo cortado a la vista (apoyado)."""
    skin = m_lomo_skin()
    string = m_string()
    cut = m_lomo_cut()
    length, radius, squash = 0.36, 0.034, 0.85
    profile = catmull_rom([(0.0, 0.0), (0.004, 0.022), (0.014, 0.031), (0.03, radius), (length - 0.03, radius),
                           (length - 0.014, 0.031), (length - 0.004, 0.022), (length, 0.0)], 30)
    body = lathe("lomo", profile, segments=36, squash=squash, mat=skin)
    displace(body, 0.002, 0.03)
    boolean(body, cutter_box("corte", (0.1, 0.2, 0.2), (length - 0.02 + 0.05, 0, 0), cut))
    helix = []
    pitch = 0.028
    for i in range(400):
        x = 0.03 + (length - 0.08) * i / 399
        a = math.tau * x / pitch
        helix.append(((x), (radius + 0.0012) * math.cos(a), (radius + 0.0012) * squash * math.sin(a)))
    wrap = sweep_tube("atado", helix, lambda s: 0.0014, segments=6, mat=string)
    obj = join([body, wrap], "lomo")
    ground(obj)
    return obj, {}


def cecina():
    """Pieza de cecina con un extremo loncheado."""
    skin = m_cecina_skin()
    cut = m_cecina_cut()
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=4, use_grid_fill=True)
    bmesh.ops.scale(bm, vec=(0.3, 0.17, 0.075), verts=bm.verts)
    body = link("cecina", bm, skin)
    subdivide(body, 2)
    displace(body, 0.014, 0.09)
    boolean(body, cutter_box("base", (0.5, 0.4, 0.1), (0, 0, -0.08), skin))
    boolean(body, cutter_box("loncheado", (0.1, 0.4, 0.3), (0.16, 0, 0), cut, rotation=(0, math.radians(8), 0)))
    ground(body)
    return body, {}


def tabla_embutidos():
    """Tabla de degustación: rodajas de chorizo, salchichón y lomo en abanico."""
    board_mat = m_board()
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(0.42, 0.22, 0.022), verts=bm.verts)
    bmesh.ops.translate(bm, vec=(0, 0, 0.011), verts=bm.verts)
    board = link("tabla", bm, board_mat)
    from common import bevel
    bevel(board, 0.004, 3)
    parts = [board]
    casing_chorizo, casing_salchichon, skin_lomo = m_chorizo_casing(), m_salchichon_casing(), m_lomo_skin()
    rows = [
        (0.065, 10, 0.021, 0.021, m_chorizo_cut(), casing_chorizo),
        (-0.005, 9, 0.026, 0.026, m_salchichon_cut(), casing_salchichon),
        (-0.072, 8, 0.033, 0.024, m_lomo_cut(), skin_lomo),
    ]
    for r, (y, count, rx, ry, face, side) in enumerate(rows):
        for i in range(count):
            piece = disc(f"rodaja_{r}_{i}", rx, ry, 0.0035, face, side, seed=r * 50 + i)
            x = -0.16 + i * (0.32 / (count - 1))
            piece.location = (x, y, 0.022 + 0.012)
            piece.rotation_euler = (0, math.radians(58), 0)
            parts.append(piece)
    return join(parts, "tabla_embutidos"), {}


CROQUETA_PROFILE = catmull_rom(
    [(0.0, 0.0), (0.003, 0.0085), (0.008, 0.0128), (0.0145, 0.0145), (0.0435, 0.0145),
     (0.05, 0.0128), (0.055, 0.0085), (0.058, 0.0)], 22)


def croqueta_body(name, crust, seed=0):
    body = lathe(name, CROQUETA_PROFILE, segments=28, mat=crust)
    body.data.transform(Matrix.Translation((-0.029, 0, 0)))
    tex_seed = random.Random(seed)
    displace(body, 0.0011, 0.004 + tex_seed.uniform(0, 0.002))
    return body


def croqueta():
    body = croqueta_body("croqueta", m_crust())
    ground(body)
    return body, {}


def croqueta_abierta():
    """Media croqueta: la bechamel cremosa a la vista."""
    bechamel = m_bechamel()
    body = croqueta_body("croqueta_abierta", m_crust(), seed=2)
    boolean(body, cutter_box("mitad", (0.05, 0.05, 0.05), (0.025, 0, 0), bechamel))
    inset_material(body, bechamel, m_crust_rim(), 0.0016)
    # De pie con el corte hacia arriba: así se presenta la bechamel en el mostrador.
    body.data.transform(Matrix.Rotation(-math.pi / 2, 4, "Y"))
    ground(body)
    return body, {}


def cucurucho():
    """Cucurucho de papel kraft con croquetas asomando."""
    crust = m_crust()
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=False, segments=40, radius1=0.004, radius2=0.052, depth=0.15)
    bmesh.ops.translate(bm, vec=(0, 0, 0.075), verts=bm.verts)
    cone = link("cucurucho", bm, m_kraft())
    mod = cone.modifiers.new("Solidify", "SOLIDIFY")
    mod.thickness = 0.0009
    parts = [cone]
    rng = random.Random(11)
    for i, (x, y, z) in enumerate([(0.012, 0.01, 0.14), (-0.014, 0.006, 0.143), (0.0, -0.016, 0.138), (0.004, 0.0, 0.158), (-0.006, 0.016, 0.15)]):
        piece = croqueta_body(f"croqueta_{i}", crust, seed=i)
        piece.location = (x, y, z)
        piece.rotation_euler = (rng.uniform(-0.6, 0.6), rng.uniform(-1.2, 1.2), rng.uniform(0, math.tau))
        parts.append(piece)
    return join(parts, "cucurucho"), {}


# Nombre → (constructor, resolución del atlas)
PRODUCTS = {
    "jamon_colgado": (jamon_colgado, 1024),
    "jamon_cortado": (jamon_cortado, 2048),
    "plato_jamon": (plato_jamon, 2048),
    "queso_curado": (queso_curado, 1024),
    "queso_pimenton": (queso_pimenton, 1024),
    "queso_cortado": (queso_cortado, 1024),
    "cuna_queso": (cuna_queso, 1024),
    "torta": (torta, 1024),
    "chorizo_sarta": (chorizo_sarta, 1024),
    "chorizo_vela": (chorizo_vela, 1024),
    "salchichon": (salchichon, 1024),
    "lomo": (lomo, 1024),
    "cecina": (cecina, 1024),
    "tabla_embutidos": (tabla_embutidos, 2048),
    "croqueta": (croqueta, 512),
    "croqueta_abierta": (croqueta_abierta, 512),
    "cucurucho": (cucurucho, 1024),
}


def main():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    out_dir = argv[0] if argv else os.path.join(os.getcwd(), ".cache", "blender", "products")
    only = set(argv[1:])
    os.makedirs(out_dir, exist_ok=True)
    meta_path = os.path.join(out_dir, "meta.json")
    meta = json.load(open(meta_path)) if os.path.exists(meta_path) else {}
    for name, (build, size) in PRODUCTS.items():
        if only and name not in only:
            continue
        reset()
        obj, anchors = build()
        bake_to_textures(obj, name, size, os.path.join(out_dir, "textures"))
        meta[name] = {"size": dimensions(obj), "anchors": anchors}
        path = os.path.join(out_dir, f"{name}.glb")
        export(path)
        print(f"[blender] {name}.glb ({os.path.getsize(path) / 1024:.0f} KB, {len(obj.data.polygons)} caras)")
    meta = {"_generado": "blender/build_products.py", **{k: v for k, v in sorted(meta.items()) if k != "_generado"}}
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2, ensure_ascii=False)


main()
