#!/bin/sh
# Печать версии в js/version.js. Запускать перед каждой публикацией артефакта.
# Аргумент — номер версии артефакта (то, что вернул инструмент Artifact).
VER="${1:-?}"
SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "-")
DATE=$(date +%Y-%m-%d\ %H:%M)
cat > js/version.js <<INNER
/* Печатается скриптом tools/stamp.sh при публикации. Руками не править. */
window.APP_VERSION = "v$VER · $DATE · $SHA";
INNER
echo "js/version.js: $(cat js/version.js | tail -1)"
