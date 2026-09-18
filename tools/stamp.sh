#!/bin/sh
# Печать версии в js/version.js. Запускать перед каждой публикацией артефакта.
# Аргумент — номер версии артефакта (то, что вернул инструмент Artifact).
cat > js/version.js <<INNER
/* Печатается скриптом tools/stamp.sh при публикации. Руками не править. */
window.APP_VERSION = "v${1:-?}";
INNER
tail -1 js/version.js
