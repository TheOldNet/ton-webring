/** TheOldNet WebRing — modern browsers only (old UAs get an empty script). */
(function () {
  if (typeof fetch !== "function") return;
  var link = document.querySelector("#theoldnet-webring-href");
  var img = link && link.querySelector("img");
  if (!link || !img) return;
  var memberId = link.getAttribute("data-website-id");
  if (!memberId) return;

  // Ring cursor: advance prev/next from the site currently shown (not the embed owner).
  var cursorId = memberId;

  var script =
    document.currentScript ||
    document.querySelector('script[src*="widget/widget.js"]');
  var base =
    script && script.src
      ? script.src.replace(/\/widget\/widget\.js(\?.*)?$/, "")
      : "";

  /** Resolve banner URL against the webring host (never the embedding page). */
  function resolveBannerSrc(src) {
    if (!src) return "";
    if (/^https?:\/\//i.test(src) || src.indexOf("//") === 0) return src;
    if (src.charAt(0) === "/") return base + src;
    return base + "/assets/banners/" + src;
  }

  function applySite(website) {
    if (!website) return;
    if (website.id) {
      cursorId = website.id;
    }
    // Keep /widget/{id}/navigate so banner clicks hit our server (analytics +
    // cache pairing). Do not point straight at the destination URL.
    link.href =
      base + "/widget/" + encodeURIComponent(memberId) + "/navigate";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    if (website.name) {
      img.alt = website.name;
      link.title = website.name;
    }
    if (website.bannerSrc) {
      img.src = resolveBannerSrc(website.bannerSrc);
    } else if (website.banner) {
      img.src = resolveBannerSrc(website.banner);
    }
  }

  function fetchRelative(action) {
    // Path uses embed owner (analytics + cache key). ?cursor= walks from the
    // site currently shown so prev/next keep moving.
    var url =
      base +
      "/api/member/" +
      encodeURIComponent(memberId) +
      "/" +
      action +
      "?cursor=" +
      encodeURIComponent(cursorId);
    return fetch(url).then(function (response) {
      if (!response.ok) throw new Error("widget " + action + " failed");
      return response.json();
    });
  }

  /**
   * Back-compat: old embeds have no special classes — match by href path.
   * Prefer .theoldnet-webring-nav when present (newer embed HTML).
   */
  function navActionFromAnchor(a) {
    if (!a || !a.getAttribute) return null;
    var marked = a.getAttribute("data-nav");
    if (marked === "previous" || marked === "next" || marked === "random") {
      return marked;
    }
    var href = a.getAttribute("href") || "";
    var enc = encodeURIComponent(memberId);
    var re = new RegExp(
      "/member/" +
        enc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
        "/(previous|next|random)/navigate",
      "i"
    );
    var m = href.match(re);
    return m ? m[1].toLowerCase() : null;
  }

  function findNavAnchors() {
    var found = [];
    var seen = {};
    function add(a) {
      if (!a || seen[a.href + a.textContent]) return;
      var action = navActionFromAnchor(a);
      if (!action) return;
      seen[a.href + a.textContent] = true;
      found.push({ el: a, action: action });
    }
    var marked = document.querySelectorAll("a.theoldnet-webring-nav[data-nav]");
    for (var i = 0; i < marked.length; i++) add(marked[i]);
    var roots = [];
    if (link.parentNode) roots.push(link.parentNode);
    if (link.parentNode && link.parentNode.parentNode) {
      roots.push(link.parentNode.parentNode);
    }
    roots.push(document);
    for (var r = 0; r < roots.length; r++) {
      var anchors = roots[r].querySelectorAll("a[href]");
      for (var j = 0; j < anchors.length; j++) add(anchors[j]);
    }
    return found;
  }

  // Image request already picked a fresh target into the modern cache.
  fetch(base + "/widget/" + encodeURIComponent(memberId))
    .then(function (response) {
      if (!response.ok) throw new Error("widget lookup failed");
      return response.json();
    })
    .then(applySite)
    .catch(function () {
      /* keep server-side /navigate + /image pairing */
    });

  var navs = findNavAnchors();
  for (var n = 0; n < navs.length; n++) {
    (function (item) {
      item.el.addEventListener("click", function (ev) {
        if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
        if (ev.button != null && ev.button !== 0) return;
        ev.preventDefault();
        item.el.setAttribute("aria-busy", "true");
        fetchRelative(item.action)
          .then(applySite)
          .catch(function () {
            window.location.href = item.el.href;
          })
          .then(function () {
            item.el.removeAttribute("aria-busy");
          });
      });
    })(navs[n]);
  }
})();
