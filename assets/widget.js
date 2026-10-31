/** TheOldNet WebRing — modern browsers only (old UAs get an empty script). */
(function () {
  if (typeof fetch !== "function") return;
  var link = document.querySelector("#theoldnet-webring-href");
  var img = link && link.querySelector("img");
  if (!link || !img) return;
  var id = link.getAttribute("data-website-id");
  if (!id) return;

  var script =
    document.currentScript ||
    document.querySelector('script[src*="widget/widget.js"]');
  var base =
    script && script.src
      ? script.src.replace(/\/widget\/widget\.js(\?.*)?$/, "")
      : "";

  // Image request already picked a fresh target into the modern cache.
  // Sync the click target (and banner src) to that same site.
  fetch(base + "/widget/" + encodeURIComponent(id))
    .then(function (response) {
      if (!response.ok) throw new Error("widget lookup failed");
      return response.json();
    })
    .then(function (website) {
      if (website.url) {
        link.href = website.url;
      }
      if (website.bannerSrc) {
        img.src = website.bannerSrc;
      } else if (website.banner) {
        img.src = base + "/assets/banners/" + website.banner;
      }
    })
    .catch(function () {
      /* keep server-side /navigate + /image pairing */
    });
})();
