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

import math
import os
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

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


# ── Utilidades ────────────────────────────────────────────────────────────────


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def material(name):
    mat = bpy.data.materials.get(name)
    if mat is None:
        mat = bpy.data.materials.new(name)
        color = PREVIEW.get(name, (0.8, 0.8, 0.8, 1))
        mat.diffuse_color = color
        # Blender ≥ 5 crea el árbol de nodos siempre; `use_nodes` solo hace falta en versiones antiguas.
        if getattr(mat, "node_tree", None) is None:
            mat.use_nodes = True
        tree = getattr(mat, "node_tree", None)
        bsdf = tree.nodes.get("Principled BSDF") if tree else None
        if bsdf:
            bsdf.inputs["Base Color"].default_value = color
    return mat


def link(name, bm, mat):
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.data.materials.append(material(mat))
    return obj


def smooth(obj, angle=40):
    """Sombreado suave con aristas vivas por encima de `angle` grados."""
    mesh = obj.data
    if hasattr(mesh, "shade_smooth"):
        mesh.shade_smooth()
    else:
        for poly in mesh.polygons:
            poly.use_smooth = True
    if hasattr(mesh, "set_sharp_from_angle"):
        mesh.set_sharp_from_angle(angle=math.radians(angle))
    return obj


def bevel(obj, width, segments=3):
    """Chaflán redondeado: los cantos vivos atrapan la luz y quitan el aspecto de caja."""
    mod = obj.modifiers.new("Bevel", "BEVEL")
    mod.width = width
    mod.segments = segments
    mod.limit_method = "ANGLE"
    mod.angle_limit = math.radians(30)
    mod.harden_normals = True
    smooth(obj, angle=180)
    return obj


def box(name, size, loc, mat, bevel_width=0.0):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
    bmesh.ops.translate(bm, vec=Vector(loc), verts=bm.verts)
    obj = link(name, bm, mat)
    return bevel(obj, bevel_width) if bevel_width else obj


def rod(name, a, b, radius, mat, segments=20):
    """Cilindro entre dos puntos."""
    a, b = Vector(a), Vector(b)
    axis = b - a
    bm = bmesh.new()
    bmesh.ops.create_cone(
        bm, cap_ends=True, cap_tris=False, segments=segments,
        radius1=radius, radius2=radius, depth=axis.length,
    )
    rotation = Vector((0, 0, 1)).rotation_difference(axis.normalized()).to_matrix()
    bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=rotation, verts=bm.verts)
    bmesh.ops.translate(bm, vec=(a + b) / 2, verts=bm.verts)
    return smooth(link(name, bm, mat))


def extrude_profile(name, points_yz, x0, x1, mat):
    """Prisma a partir de un perfil (convexo) en el plano YZ, extruido entre x0 y x1."""
    bm = bmesh.new()
    left = [bm.verts.new((x0, y, z)) for y, z in points_yz]
    right = [bm.verts.new((x1, y, z)) for y, z in points_yz]
    bm.faces.new(list(reversed(left)))
    bm.faces.new(right)
    n = len(points_yz)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((left[i], left[j], right[j], right[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return link(name, bm, mat)


def curved_sheet(name, points_yz, x0, x1, thickness, mat):
    """Lámina curva (p. ej. cristal de vitrina) siguiendo un perfil abierto en YZ."""
    bm = bmesh.new()
    left = [bm.verts.new((x0, y, z)) for y, z in points_yz]
    right = [bm.verts.new((x1, y, z)) for y, z in points_yz]
    for i in range(len(points_yz) - 1):
        bm.faces.new((left[i], left[i + 1], right[i + 1], right[i]))
    obj = link(name, bm, mat)
    mod = obj.modifiers.new("Solidify", "SOLIDIFY")
    mod.thickness = thickness
    mod.offset = 0
    return smooth(obj, angle=60)


def wire_basket(name, size, loc, wire, mat, cuts=7):
    """Cesta de rejilla abierta por arriba (modificador Wireframe sobre una caja subdividida)."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
    top = [f for f in bm.faces if f.normal.z > 0.9]
    bmesh.ops.delete(bm, geom=top, context="FACES_ONLY")
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=cuts, use_grid_fill=True)
    bmesh.ops.translate(bm, vec=Vector(loc), verts=bm.verts)
    obj = link(name, bm, mat)
    mod = obj.modifiers.new("Wireframe", "WIREFRAME")
    mod.thickness = wire
    mod.use_even_offset = True
    return obj


def arc(center_yz, radius_y, radius_z, start_deg, end_deg, steps=24):
    cy, cz = center_yz
    pts = []
    for i in range(steps + 1):
        t = math.radians(start_deg + (end_deg - start_deg) * i / steps)
        pts.append((cy - radius_y * math.cos(t), cz + radius_z * math.sin(t)))
    return pts


def export(path):
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        export_apply=True,
        export_yup=True,
        use_selection=False,
    )


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
