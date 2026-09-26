"""Render de revisión de modelos GLB (sin navegador): estudio neutro con el HDRI de la feria.

Uso:
    blender -b --factory-startup --python blender/preview.py -- <salida.png> <modelo.glb> [...]

Coloca los modelos en fila (de menor a mayor índice, de izquierda a derecha), encuadra el
conjunto en tres cuartos y renderiza con Cycles. Sirve para revisar forma, proporción y
texturas horneadas antes de llevarlos al visor.
"""

import os
import sys

import bpy
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HDRI = os.path.join(ROOT, "public", "assets", "hdri", "rostock_laage_airport_1k.hdr")


def main():
    argv = sys.argv[sys.argv.index("--") + 1 :]
    out, files = argv[0], argv[1:]
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene

    # Importa y alinea en fila, apoyados en el suelo.
    x = 0.0
    lo, hi = Vector((1e9, 1e9, 1e9)), Vector((-1e9, -1e9, -1e9))
    for path in files:
        before = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=path)
        objs = [o for o in bpy.data.objects if o not in before and o.type == "MESH"]
        bpy.context.view_layer.update()
        corners = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
        mn = Vector((min(c.x for c in corners), min(c.y for c in corners), min(c.z for c in corners)))
        mx = Vector((max(c.x for c in corners), max(c.y for c in corners), max(c.z for c in corners)))
        roots = [o for o in bpy.data.objects if o not in before and o.parent is None]
        shift = Vector((x - mn.x, -(mn.y + mx.y) / 2, -mn.z))
        for r in roots:
            r.location += shift
        lo = Vector((min(lo.x, mn.x + shift.x), min(lo.y, mn.y + shift.y), 0))
        hi = Vector((max(hi.x, mx.x + shift.x), max(hi.y, mx.y + shift.y), max(hi.z, mx.z - mn.z)))
        x += (mx.x - mn.x) + max(0.04, (mx.x - mn.x) * 0.25)

    # Suelo gris claro y mundo con el HDRI de la feria.
    size = max(hi - lo) * 8
    bpy.ops.mesh.primitive_plane_add(size=size, location=((lo.x + hi.x) / 2, 0, 0))
    floor = bpy.context.active_object
    mat = bpy.data.materials.new("suelo")
    mat.use_nodes = True
    mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.5, 0.5, 0.48, 1)
    mat.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.8
    floor.data.materials.append(mat)

    world = bpy.data.worlds.new("estudio")
    scene.world = world
    world.use_nodes = True
    env = world.node_tree.nodes.new("ShaderNodeTexEnvironment")
    env.image = bpy.data.images.load(HDRI)
    world.node_tree.links.new(env.outputs["Color"], world.node_tree.nodes["Background"].inputs["Color"])
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 1.0

    # Luz principal suave desde delante-izquierda para leer volumen.
    extent = max(hi - lo)
    area = bpy.data.lights.new("clave", "AREA")
    area.energy = 60 * extent**2
    area.size = extent * 1.5
    key = bpy.data.objects.new("clave", area)
    scene.collection.objects.link(key)
    center = (lo + hi) / 2
    key.location = center + Vector((-1.2, -1.6, 1.8)) * extent
    key.rotation_euler = (center - key.location).to_track_quat("-Z", "Y").to_euler()

    # Cámara en tres cuartos que encuadra el conjunto.
    cam_data = bpy.data.cameras.new("camara")
    cam_data.lens = 50
    cam = bpy.data.objects.new("camara", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    frame = max(hi.x - lo.x, (hi.z - lo.z) * 1.4, 0.05)
    direction = Vector((0.35, -1.0, 0.45)).normalized()
    cam.location = center + direction * frame * 1.9
    cam.rotation_euler = (center - cam.location).to_track_quat("-Z", "Y").to_euler()

    scene.render.engine = "CYCLES"
    scene.cycles.samples = 64
    scene.cycles.use_denoising = True
    try:
        prefs = bpy.context.preferences.addons["cycles"].preferences
        prefs.compute_device_type = "METAL"
        prefs.refresh_devices()
        for device in prefs.devices:
            device.use = True
        scene.cycles.device = "GPU"
    except Exception:  # noqa: BLE001 — sin GPU compatible, Cycles en CPU
        scene.cycles.device = "CPU"
    scene.view_settings.view_transform = "AgX"
    scene.render.resolution_x, scene.render.resolution_y = 1200, 800
    scene.render.filepath = out
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    bpy.ops.render.render(write_still=True)
    print(f"[preview] {out}")


main()
