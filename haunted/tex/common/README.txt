Shared detail maps (near-white colour + normal, 1024x1024, seamless). The engine's detail pass multiplies one over every
plain-coloured prop, chosen by its colour: detail_wood (browns), detail_stone (greys), detail_metal (metallic), detail_grime
(everything else); detail_cloth is used by E.common('cloth'). Baked in Blender from src/common_tex.py (texbake.py + texlib.py).
