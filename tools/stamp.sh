#!/bin/sh
# Старый скрипт метки версии в js/version.js для прежнего артефакта Claude.
# GitHub Pages его не использует. Аргумент - номер прежней версии артефакта.
cat > js/version.js <<INNER
/* Печатается скриптом tools/stamp.sh при публикации. Руками не править. */
window.APP_VERSION = "v${1:-?}";
INNER
tail -1 js/version.js
