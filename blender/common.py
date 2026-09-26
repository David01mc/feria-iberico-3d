"""Utilidades compartidas por los scripts de Blender de la feria (modo background).

Geometría (cajas, tubos, tornos, barridos), materiales de nodos procedurales, horneado de
texturas con Cycles y exportación a GLB. Unidades en metros; Z arriba (Blender).
"""

import math
import os

import bmesh
import bpy
from mathutils import Matrix, Vector

# ── Escena ────────────────────────────────────────────────────────────────────


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def export(path):
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        export_apply=True,
        export_yup=True,
        use_selection=False,
    )


def srgb(hex_color, alpha=1.0):
    """'#rrggbb' (sRGB) → RGBA lineal, que es lo que esperan los nodos de Blender."""
    hex_color = hex_color.lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(hex_color[i : i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, alpha)


# ── Materiales planos (mobiliario: el visor los sustituye por su librería) ───


def flat_material(name, color):
    mat = bpy.data.materials.get(name)
    if mat is None:
        mat = bpy.data.materials.new(name)
        mat.diffuse_color = color
        if getattr(mat, "node_tree", None) is None:
            mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        if bsdf:
            bsdf.inputs["Base Color"].default_value = color
    return mat


# ── Creación de objetos ───────────────────────────────────────────────────────

# Convierte un nombre de material en material (lo fija cada script: p. ej. materiales planos
# con nombre de la librería del visor en el mobiliario).
MATERIAL_RESOLVER = None


def link(name, bm, mat=None):
    """Convierte un bmesh en objeto de la escena. `mat`: material, nombre o None."""
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    if isinstance(mat, str):
        mat = MATERIAL_RESOLVER(mat)
    if mat is not None:
        obj.data.materials.append(mat)
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


# ── Formas orgánicas ─────────────────────────────────────────────────────────


def catmull_rom(points, samples):
    """Remuestrea una polilínea [(a, b)] con una spline suave de Catmull-Rom."""
    pts = [points[0]] + list(points) + [points[-1]]
    out = []
    segments = len(points) - 1
    for i in range(samples):
        t = i / (samples - 1) * segments
        k = min(int(t), segments - 1)
        u = t - k
        p0, p1, p2, p3 = pts[k], pts[k + 1], pts[k + 2], pts[k + 3]
        out.append(tuple(
            0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * u + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * u * u
                   + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * u * u * u)
            for j in range(2)
        ))
    return out


def lathe(name, profile, segments=48, squash=1.0, bend=None, mat=None):
    """
    Superficie de revolución alrededor del eje X a partir de un perfil [(x, radio)].
    Un radio 0 en un extremo cierra la pieza en un polo. `squash` aplana en Z y
    `bend(x)` desplaza el eje en Z (piezas arqueadas como el jamón).
    """
    bm = bmesh.new()
    rings = []
    for x, r in profile:
        zc = bend(x) if bend else 0.0
        if r <= 1e-6:
            rings.append([bm.verts.new((x, 0.0, zc))])
            continue
        rings.append([
            bm.verts.new((x, r * math.cos(a), zc + r * math.sin(a) * squash))
            for a in (2 * math.pi * j / segments for j in range(segments))
        ])
    for ring_a, ring_b in zip(rings, rings[1:]):
        if len(ring_a) == 1:
            for j in range(segments):
                bm.faces.new((ring_a[0], ring_b[(j + 1) % segments], ring_b[j]))
        elif len(ring_b) == 1:
            for j in range(segments):
                bm.faces.new((ring_a[j], ring_a[(j + 1) % segments], ring_b[0]))
        else:
            for j in range(segments):
                k = (j + 1) % segments
                bm.faces.new((ring_a[j], ring_a[k], ring_b[k], ring_b[j]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return smooth(link(name, bm, mat), angle=180)


def sweep_tube(name, path, radius, segments=16, mat=None, caps=True):
    """
    Tubo que recorre `path` (lista de Vector) con radio variable `radius(s)`, s ∈ [0, 1].
    Marcos por transporte paralelo (sin giros bruscos) y extremos redondeados.
    """
    path = [Vector(p) for p in path]
    n = len(path)
    tangents = []
    for i in range(n):
        a = path[max(i - 1, 0)]
        b = path[min(i + 1, n - 1)]
        tangents.append((b - a).normalized())
    normal = tangents[0].orthogonal().normalized()
    bm = bmesh.new()
    rings = []
    for i, (p, t) in enumerate(zip(path, tangents)):
        if i > 0:
            normal = (normal - t * normal.dot(t)).normalized()
        binormal = t.cross(normal)
        r = radius(i / (n - 1))
        rings.append([
            bm.verts.new(p + r * (math.cos(a) * normal + math.sin(a) * binormal))
            for a in (2 * math.pi * j / segments for j in range(segments))
        ])
    for ring_a, ring_b in zip(rings, rings[1:]):
        for j in range(segments):
            k = (j + 1) % segments
            bm.faces.new((ring_a[j], ring_a[k], ring_b[k], ring_b[j]))
    if caps:
        for ring, p, t, sign in ((rings[0], path[0], tangents[0], -1), (rings[-1], path[-1], tangents[-1], 1)):
            tip = bm.verts.new(p + t * sign * radius(0 if sign < 0 else 1) * 0.6)
            for j in range(segments):
                bm.faces.new((ring[j], ring[(j + 1) % segments], tip))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return smooth(link(name, bm, mat), angle=180)


def displace(obj, strength, size, kind="CLOUDS", depth=2):
    """Irregularidad orgánica (bultos, arrugas) con una textura de ruido."""
    tex = bpy.data.textures.new(f"{obj.name}_ruido", kind)
    if hasattr(tex, "noise_scale"):
        tex.noise_scale = size
    if hasattr(tex, "noise_depth"):
        tex.noise_depth = depth
    mod = obj.modifiers.new("Displace", "DISPLACE")
    mod.texture = tex
    mod.strength = strength
    mod.mid_level = 0.5
    mod.texture_coords = "OBJECT"
    return obj


def subdivide(obj, levels=1):
    mod = obj.modifiers.new("Subsurf", "SUBSURF")
    mod.levels = levels
    mod.render_levels = levels
    return obj


def apply_modifiers(obj):
    """Aplica todos los modificadores (sin depender del contexto de la interfaz)."""
    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated = obj.evaluated_get(depsgraph)
    mesh = bpy.data.meshes.new_from_object(evaluated, preserve_all_data_layers=True, depsgraph=depsgraph)
    obj.modifiers.clear()
    old = obj.data
    obj.data = mesh
    bpy.data.meshes.remove(old)
    return obj


def boolean(obj, cutter, operation="DIFFERENCE"):
    """Booleana exacta; las caras nuevas heredan el material del cortador."""
    mod = obj.modifiers.new("Bool", "BOOLEAN")
    mod.operation = operation
    mod.object = cutter
    mod.solver = "EXACT"
    mod.material_mode = "TRANSFER"
    apply_modifiers(obj)
    bpy.data.objects.remove(cutter, do_unlink=True)
    return obj


def slot(obj, mat):
    """Índice del material en el objeto (lo añade si no está)."""
    for i, m in enumerate(obj.data.materials):
        if m == mat:
            return i
    obj.data.materials.append(mat)
    return len(obj.data.materials) - 1


def assign_faces(obj, mat, predicate):
    """Asigna `mat` a las caras cuyo centro/normal cumplen `predicate(center, normal)`."""
    index = slot(obj, mat)
    for poly in obj.data.polygons:
        if predicate(poly.center, poly.normal):
            poly.material_index = index


def inset_material(obj, mat, rim_mat, thickness):
    """Reborde: encoge las caras de `mat` y pinta con `rim_mat` el anillo resultante."""
    inner = slot(obj, mat)
    rim = slot(obj, rim_mat)
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    faces = [f for f in bm.faces if f.material_index == inner]
    if faces:
        result = bmesh.ops.inset_region(bm, faces=faces, thickness=thickness, depth=0.0, use_even_offset=True)
        for f in result["faces"]:
            f.material_index = rim
    bm.to_mesh(obj.data)
    bm.free()
    return obj


def join(objects, name):
    """Une varios objetos en uno (con sus materiales) y aplica transformaciones."""
    for obj in objects:
        apply_modifiers(obj)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    if len(objects) > 1:
        bpy.ops.object.join()
    result = bpy.context.view_layer.objects.active
    result.name = name
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return result


# ── Materiales procedurales (nodos) ───────────────────────────────────────────


class Shader:
    """Pequeño constructor de árboles de nodos para materiales procedurales."""

    def __init__(self, name):
        self.mat = bpy.data.materials.new(name)
        if self.mat.node_tree is None:
            self.mat.use_nodes = True
        self.nt = self.mat.node_tree
        for node in list(self.nt.nodes):
            self.nt.nodes.remove(node)
        out = self.nt.nodes.new("ShaderNodeOutputMaterial")
        self.bsdf = self.nt.nodes.new("ShaderNodeBsdfPrincipled")
        self.nt.links.new(self.bsdf.outputs["BSDF"], out.inputs["Surface"])
        self._coords = None

    def node(self, kind):
        return self.nt.nodes.new(kind)

    def link(self, value, socket):
        if hasattr(value, "is_output"):
            self.nt.links.new(value, socket)
        else:
            socket.default_value = value

    def coords(self):
        """Coordenadas de objeto: los patrones quedan a escala real (metros)."""
        if self._coords is None:
            self._coords = self.node("ShaderNodeTexCoord").outputs["Object"]
        return self._coords

    def scaled(self, sx, sy, sz):
        """Coordenadas de objeto escaladas por eje (patrones alargados, fibras…)."""
        mapping = self.node("ShaderNodeMapping")
        self.link(self.coords(), mapping.inputs["Vector"])
        mapping.inputs["Scale"].default_value = (sx, sy, sz)
        return mapping.outputs["Vector"]

    def noise(self, scale, detail=4.0, roughness=0.55, distortion=0.0, vector=None):
        n = self.node("ShaderNodeTexNoise")
        n.inputs["Scale"].default_value = scale
        n.inputs["Detail"].default_value = detail
        n.inputs["Roughness"].default_value = roughness
        n.inputs["Distortion"].default_value = distortion
        self.link(vector or self.coords(), n.inputs["Vector"])
        return n.outputs["Fac"]

    def voronoi(self, scale, feature="F1", randomness=1.0, output="Distance", vector=None):
        n = self.node("ShaderNodeTexVoronoi")
        n.feature = feature
        n.inputs["Scale"].default_value = scale
        n.inputs["Randomness"].default_value = randomness
        self.link(vector or self.coords(), n.inputs["Vector"])
        return n.outputs[output]

    def wave(self, scale, distortion=0.0, detail=2.0, direction="X", profile="SIN", vector=None):
        n = self.node("ShaderNodeTexWave")
        n.wave_type = "BANDS"
        n.bands_direction = direction
        n.wave_profile = profile
        n.inputs["Scale"].default_value = scale
        n.inputs["Distortion"].default_value = distortion
        n.inputs["Detail"].default_value = detail
        self.link(vector or self.coords(), n.inputs["Vector"])
        return n.outputs["Fac"]

    def ramp(self, fac, stops):
        """Rampa de color: stops = [(posición, '#rrggbb' | valor gris 0–1)]."""
        n = self.node("ShaderNodeValToRGB")
        elements = n.color_ramp.elements
        while len(elements) < len(stops):
            elements.new(0.5)
        for element, (pos, color) in zip(elements, stops):
            element.position = pos
            element.color = srgb(color) if isinstance(color, str) else (color, color, color, 1)
        self.link(fac, n.inputs["Fac"])
        return n.outputs["Color"]

    def math(self, operation, a, b=0.0):
        n = self.node("ShaderNodeMath")
        n.operation = operation
        self.link(a, n.inputs[0])
        self.link(b, n.inputs[1])
        return n.outputs[0]

    def mix(self, factor, a, b):
        n = self.node("ShaderNodeMix")
        n.data_type = "RGBA"
        sockets = {s.identifier: s for s in n.inputs}
        self.link(factor, sockets["Factor_Float"])
        self.link(srgb(a) if isinstance(a, str) else a, sockets["A_Color"])
        self.link(srgb(b) if isinstance(b, str) else b, sockets["B_Color"])
        return {s.identifier: s for s in n.outputs}["Result_Color"]

    def bump(self, height, strength, distance=0.001, normal=None):
        n = self.node("ShaderNodeBump")
        n.inputs["Strength"].default_value = strength
        n.inputs["Distance"].default_value = distance
        self.link(height, n.inputs["Height"])
        if normal is not None:
            self.link(normal, n.inputs["Normal"])
        return n.outputs["Normal"]

    def up_facing(self, threshold=0.7):
        """1 en caras que miran arriba/abajo (tapas), 0 en los costados."""
        geometry = self.node("ShaderNodeNewGeometry")
        split = self.node("ShaderNodeSeparateXYZ")
        self.link(geometry.outputs["Normal"], split.inputs["Vector"])
        return self.math("GREATER_THAN", self.math("ABSOLUTE", split.outputs["Z"]), threshold)

    def set(self, name, value):
        socket = self.bsdf.inputs[name]
        if isinstance(value, str):
            value = srgb(value)
        self.link(value, socket)
        return self


# ── Horneado ──────────────────────────────────────────────────────────────────


def setup_cycles(samples=4):
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = samples
    try:
        prefs = bpy.context.preferences.addons["cycles"].preferences
        prefs.compute_device_type = "METAL"
        prefs.refresh_devices()
        for device in prefs.devices:
            device.use = True
        scene.cycles.device = "GPU"
    except Exception:  # noqa: BLE001 — sin GPU compatible, Cycles en CPU
        scene.cycles.device = "CPU"


def bake_to_textures(obj, name, size, texture_dir, ao_strength=0.6):
    """
    Hornea los materiales procedurales de `obj` en tres texturas (color, rugosidad y
    relieve) sobre un único atlas de UV y los sustituye por un solo material PBR.
    La oclusión ambiental se hornea aparte y oscurece el color en pliegues y juntas.
    Resultado: una malla con un material → instanciable en el visor.
    """
    import numpy as np

    setup_cycles()
    scene = bpy.context.scene
    if scene.world is None:
        scene.world = bpy.data.worlds.new("mundo")
    # Radio de la oclusión proporcional a la pieza: pliegues de una croqueta o de un jamón.
    # Las piezas grandes con relieve fino (muro de musgo) fijan el suyo en obj["ao_distance"].
    scene.world.light_settings.distance = obj.get("ao_distance", max(obj.dimensions) * 0.12)
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.004)
    bpy.ops.object.mode_set(mode="OBJECT")

    images = {}
    for kind in ("color", "roughness", "normal", "ao"):
        image = bpy.data.images.new(f"{name}_{kind}", size, size, alpha=False)
        if kind != "color":
            image.colorspace_settings.name = "Non-Color"
        images[kind] = image

    targets = []
    for mat in obj.data.materials:
        node = mat.node_tree.nodes.new("ShaderNodeTexImage")
        targets.append((mat, node))

    def bake(kind, bake_type, **options):
        for mat, node in targets:
            node.image = images[kind]
            mat.node_tree.nodes.active = node
        bpy.ops.object.bake(type=bake_type, margin=8, use_clear=True, **options)

    bake("color", "DIFFUSE", pass_filter={"COLOR"})
    bake("roughness", "ROUGHNESS")
    bake("normal", "NORMAL", normal_space="TANGENT")
    scene.cycles.samples = 64
    bake("ao", "AO")
    scene.cycles.samples = 4

    # color × mezcla(1, oclusión): sombras de contacto horneadas en el albedo.
    pixels = size * size * 4
    color = np.empty(pixels, dtype=np.float32)
    occlusion = np.empty(pixels, dtype=np.float32)
    images["color"].pixels.foreach_get(color)
    images["ao"].pixels.foreach_get(occlusion)
    color = color.reshape(-1, 4)
    factor = (1 - ao_strength) + ao_strength * occlusion.reshape(-1, 4)[:, :1]
    color[:, :3] *= factor
    images["color"].pixels.foreach_set(color.ravel())
    images["color"].update()
    del images["ao"]

    os.makedirs(texture_dir, exist_ok=True)
    for kind, image in images.items():
        image.filepath_raw = os.path.join(texture_dir, f"{name}_{kind}.png")
        image.file_format = "PNG"
        image.save()

    final = bpy.data.materials.new(f"producto_{name}")
    if final.node_tree is None:
        final.use_nodes = True
    nodes, links = final.node_tree.nodes, final.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    color = nodes.new("ShaderNodeTexImage")
    color.image = images["color"]
    rough = nodes.new("ShaderNodeTexImage")
    rough.image = images["roughness"]
    normal_tex = nodes.new("ShaderNodeTexImage")
    normal_tex.image = images["normal"]
    normal_map = nodes.new("ShaderNodeNormalMap")
    links.new(color.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(rough.outputs["Color"], bsdf.inputs["Roughness"])
    links.new(normal_tex.outputs["Color"], normal_map.inputs["Color"])
    links.new(normal_map.outputs["Normal"], bsdf.inputs["Normal"])

    obj.data.materials.clear()
    obj.data.materials.append(final)
    for poly in obj.data.polygons:
        poly.material_index = 0
    return obj


def ground(obj):
    """Origen en el centro de la base (apoyado en el suelo)."""
    xs = [v.co.x for v in obj.data.vertices]
    ys = [v.co.y for v in obj.data.vertices]
    zs = [v.co.z for v in obj.data.vertices]
    offset = Vector(((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, min(zs)))
    obj.data.transform(Matrix.Translation(-offset))
    return offset


def dimensions(obj):
    """Tamaño del objeto en coordenadas del visor (Y arriba): [x, z, y] de Blender."""
    d = obj.dimensions
    return [round(d.x, 4), round(d.z, 4), round(d.y, 4)]


def to_three(v):
    """Punto de Blender (Z arriba) → visor three.js (Y arriba): [x, z, −y]."""
    return [round(v[0], 4), round(v[2], 4), round(-v[1], 4)]
