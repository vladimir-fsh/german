/* Рамки рангов: векторные грани остаются чёткими на экране телефона.
   Декорация не перехватывает тап или свайп и не меняет расписание. */
window.VocabFrames = (function () {
  "use strict";
  var sequence = 0;
  var ranks = [
    { id: "bronze" },
    { id: "silver" },
    { id: "gold" },
    { id: "platinum" },
    { id: "legend" }
  ];
  function rank(v) {
    var days = (window.SRS_CONFIG || {}).frameDays || [0, 3, 7, 30, 100];
    var iv = v && (v.learned || v.stage !== "learning") ? v.iv || 0 : 0, index = 0;
    for (var i = 1; i < ranks.length; i++) if (iv >= days[i]) index = i;
    return ranks[index];
  }
  function art(id, tier) {
    var metal = "url(#" + id + "-metal)", gem = "url(#" + id + "-gem)";
    var corners = "";
    ["", "translate(360 0) scale(-1 1)", "translate(0 360) scale(1 -1)", "translate(360 360) scale(-1 -1)"].forEach(function (transform) {
      corners += '<g transform="' + transform + '">' +
        '<path d="M8 60V24L24 8H60L48 18H29L18 29V48Z" fill="' + metal + '" stroke="var(--frame-dark)" stroke-width="1.5"/>' +
        '<path d="M12 45V26L26 12H45" fill="none" stroke="var(--frame-light)" stroke-width="1.5"/>' +
        (tier === "platinum" || tier === "legend"
          ? '<path d="M16 27L27 16L35 25L25 35Z" fill="' + gem + '" stroke="var(--frame-light)"/><path d="M27 16L25 35M16 27L35 25" stroke="var(--frame-light)" opacity=".65"/>' : "") + '</g>';
    });
    var ornament = "";
    if (tier === "gold" || tier === "legend") {
      ["", "translate(360 0) scale(-1 1)"].forEach(function (transform) {
        ornament += '<g transform="' + transform + '" fill="' + metal + '" stroke="var(--frame-dark)" stroke-width="1">' +
          '<path d="M66 350C40 341 27 323 17 298L10 282L10 311L18 323L19 306L32 330L21 324L28 337L44 342L34 330Z"/>' +
          '<path d="M139 8L153 17L168 11L180 2L167 5L157 0L154 9Z"/>' + '</g>';
      });
    }
    if (tier === "platinum") ornament += '<path d="M90 9L107 18L127 9L146 18L166 9M194 9L214 18L234 9L254 18L274 9M90 351L108 342L128 351L146 342M214 342L232 351L252 342L270 351" fill="none" stroke="var(--frame-gem)" stroke-width="2"/>';
    if (tier === "legend") ornament += '<g class="vflame" fill="none" stroke="var(--frame-fire)" stroke-linejoin="round"><path d="M8 100L3 83L9 62L1 48L17 31L23 9L48 12L63 3L82 9M278 9L297 3L312 12L337 9L343 31L359 48L351 62L357 83L352 100" stroke-width="2"/><path d="M148 8L159 0L169 7L180 0L191 7L201 0L212 8" stroke-width="3"/></g>';
    if (tier === "legend") ornament += '<path d="M28 22H332L338 28V332L332 338H28L22 332V28Z" fill="none" stroke="var(--frame-gem)" stroke-width="2"/>' +
      '<path class="vflame" d="M150 10L154 -1L166 3L180 -11L194 3L206 -1L210 10L192 16H168Z" fill="' + metal + '" stroke="var(--frame-fire)" stroke-width="1.5"/>';
    return '<svg viewBox="0 0 360 360" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
      '<defs><linearGradient id="' + id + '-metal" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="var(--frame-light)"/><stop offset=".13" stop-color="var(--frame-mid)"/>' +
      '<stop offset=".28" stop-color="var(--frame-dark)"/><stop offset=".43" stop-color="var(--frame-mid)"/>' +
      '<stop offset=".5" stop-color="var(--frame-light)"/><stop offset=".58" stop-color="var(--frame-mid)"/>' +
      '<stop offset=".77" stop-color="var(--frame-dark)"/><stop offset=".9" stop-color="var(--frame-light)"/>' +
      '<stop offset="1" stop-color="var(--frame-mid)"/></linearGradient>' +
      '<linearGradient id="' + id + '-gem" x2=".8" y2="1"><stop stop-color="var(--frame-light)"/>' +
      '<stop offset=".45" stop-color="var(--frame-gem)"/><stop offset="1" stop-color="var(--frame-dark)"/></linearGradient></defs>' +
      '<path d="M25 9H335L351 25V335L335 351H25L9 335V25Z" fill="none" stroke="var(--frame-dark)" stroke-width="15"/>' +
      '<path d="M25 9H335L351 25V335L335 351H25L9 335V25Z" fill="none" stroke="' + metal + '" stroke-width="11"/>' +
      '<path d="M25 4H335L356 25V335L335 356H25L4 335V25Z" fill="none" stroke="var(--frame-light)" stroke-width="1"/>' +
      '<path d="M28 19H332L341 28V332L332 341H28L19 332V28Z" fill="none" stroke="var(--frame-dark)" stroke-width="2"/>' +
      '<path d="M28 21H332L339 28V332L332 339H28L21 332V28Z" fill="none" stroke="var(--frame-light)" stroke-width="1" opacity=".6"/>' +
      corners + ornament +
      '<path d="M164 9L180 0L196 9L180 22Z" fill="' + metal + '" stroke="var(--frame-dark)"/>' +
      '<path d="M172 9L180 4L188 9L180 16Z" fill="' + gem + '" stroke="var(--frame-light)"/>' +
      '<path d="M161 349L180 334L199 349L180 360Z" fill="' + metal + '" stroke="var(--frame-dark)"/>' +
      '<path d="M170 349L180 341L190 349L180 355Z" fill="' + gem + '" stroke="var(--frame-light)"/>' +
      '</svg>';
  }
  function decorate(face, v) {
    decorateRank(face, rank(v));
  }
  function decorateRank(face, r) {
    var frame = document.createElement("div");
    face.classList.add("vranked", "rank-" + r.id);
    frame.className = "vframe";
    frame.setAttribute("aria-hidden", "true");
    frame.innerHTML = art("vframe-" + (++sequence), r.id);
    face.appendChild(frame);
  }
  function isUpgrade(before, after) {
    return ranks.indexOf(rank(after)) > ranks.indexOf(rank(before));
  }
  function transition(host, before, after, effect) {
    var faces = host.querySelectorAll(".vface"), oldRank = rank(before).id;
    var from = ranks.indexOf(rank(before)), to = ranks.indexOf(rank(after));
    /* Эффект показывает одну соседнюю ступень; сохранённое расписание не меняется. */
    var nextRank = ranks[from + (to > from ? 1 : to < from ? -1 : 0)];
    for (var i = 0; i < faces.length; i++) {
      var face = faces[i], oldFrame = face.querySelector(".vframe");
      if (oldFrame) oldFrame.classList.add("rank-" + oldRank, "vframe-old");
      ranks.forEach(function (r) { face.classList.remove("rank-" + r.id); });
      decorateRank(face, nextRank);
      face.lastChild.classList.add(effect);
    }
  }
  return { rank: rank, decorate: decorate, isUpgrade: isUpgrade, transition: transition };
})();
