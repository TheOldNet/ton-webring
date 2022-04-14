/** TheOldNet WebRing */
(function () {
  if (!fetch) return;
  var link = document.querySelector("#theoldnet-webring-href");
  var img = document.querySelector("#theoldnet-webring-href img");
  var id = link.dataset.websiteId;

  fetch("http://webring.theoldnet.com/widget/" + id)
    .then((response) => response.json())
    .then((website) => {
      link.href = website.url;
      img.src = img.src + "?cacheBuster=" + Math.floor(Math.random() * 9999);
    });
})();
