#!/bin/sh
# Печать версии в js/version.js. Запускать перед каждой публикацией артефакта.
# Аргумент — номер версии артефакта (то, что вернул инструмент Artifact).
VER="${1:-?}"
DATE=$(date "+%Y-%m-%d %H:%M")
cat > js/version.js <<INNER
/* Печатается скриптом tools/stamp.sh при публикации. Руками не править. */
window.APP_VERSION = "v$VER · $DATE";
INNER
tail -1 js/version.js
