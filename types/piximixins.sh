# #!/bin/bash

# # Base URL for the raw GitHub content
# BASE_URL="https://raw.githubusercontent.com/pixijs/pixijs/refs/heads/dev"

# # List of files to download
# FILES=(
#     "src/accessibility/AccessibilityMixins.d.ts"
#     "src/app/ApplicationMixins.d.ts"
#     "src/assets/AssetsMixins.d.ts"
#     "src/culling/CullingMixins.d.ts"
#     "src/events/EventsMixins.d.ts"
#     "src/dom/DOMMixins.d.ts"
#     "src/rendering/RenderingMixins.d.ts"
#     "src/scene/SceneMixins.d.ts"
#     "src/scene/graphics/GraphicsMixins.d.ts"
#     "src/scene/mesh/MeshMixins.d.ts"
#     "src/scene/sprite-tiling/TilingSpriteMixins.d.ts"
#     "src/scene/sprite-nine-slice/NineSliceSpriteMixins.d.ts"
#     "src/scene/text/TextMixins.d.ts"
#     "src/scene/text-bitmap/TextBitmapMixins.d.ts"
#     "src/scene/text-html/TextHTMLMixins.d.ts"
#     "src/scene/particle-container/ParticleMixins.d.ts"
#     "src/math-extras/MathExtraMixins.d.ts"
#     "src/filters/FilterMixins.d.ts"
# )

# # Download each file
# for FILE in "${FILES[@]}"; do
#     echo "Downloading $FILE..."
#     curl -O "${BASE_URL}/${FILE}"
# done

# echo "All files downloaded!"
