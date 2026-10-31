/** TheOldNet WebRing */
(function () {
  if (!fetch) return;
  var link = document.querySelector("#theoldnet-webring-href");
  var img = document.querySelector("#theoldnet-webring-href img");
  if (!link || !img) return;
  var id = link.dataset.websiteId;
  var script =
    document.currentScript ||
    document.querySelector('script[src*="widget/widget.js"]');
  var base = script && script.src
    ? script.src.replace(/\/widget\/widget\.js(\?.*)?$/, "")
    : "";

  fetch(base + "/widget/" + id)
    .then(function (response) {
      return response.json();
    })
    .then(function (website) {
      link.href = website.url;
      img.src = img.src + "?cacheBuster=" + Math.floor(Math.random() * 9999);
    });
})();
