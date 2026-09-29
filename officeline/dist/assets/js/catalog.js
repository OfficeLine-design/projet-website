(function () {
  "use strict";

  var searchInput = document.getElementById("catalogSearch");
  var filterBar = document.getElementById("catalogFilters");
  var emptyMsg = document.getElementById("catalogEmpty");
  var blocks = Array.prototype.slice.call(document.querySelectorAll(".family-block"));
  if (!blocks.length) return;

  var activeFilter = "all";
  var activeQuery = "";

  function normalize(str) {
    return (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function applyFilters() {
    var visibleCount = 0;
    blocks.forEach(function (block) {
      var matchesFilter = activeFilter === "all" || block.dataset.family === activeFilter;
      var haystack = normalize(block.dataset.search || block.textContent);
      var matchesQuery = !activeQuery || haystack.indexOf(activeQuery) !== -1;
      var show = matchesFilter && matchesQuery;
      block.classList.toggle("is-filtered-out", !show);
      if (show) visibleCount++;
    });
    if (emptyMsg) emptyMsg.hidden = visibleCount !== 0;
  }

  if (filterBar) {
    filterBar.addEventListener("click", function (e) {
      var chip = e.target.closest(".chip");
      if (!chip) return;
      filterBar.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("is-active"); });
      chip.classList.add("is-active");
      activeFilter = chip.dataset.filter;
      applyFilters();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      activeQuery = normalize(searchInput.value.trim());
      applyFilters();
    });
  }

  /* Catalog PDF download placeholder */
  document.querySelectorAll("[data-catalog-download]").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var lang = document.documentElement.lang || "fr";
      var msg = {
        fr: "Le catalogue PDF complet est réservé à nos distributeurs enregistrés. Connectez-vous à l'espace distributeurs ou demandez un devis.",
        en: "The full PDF catalog is reserved for our registered distributors. Log in to the distributor area or request a quote.",
        ar: "الكتالوج الكامل بصيغة PDF مخصص لموزعينا المسجلين. سجّل الدخول إلى فضاء الموزعين أو اطلب عرض سعر."
      };
      alert(msg[lang] || msg.fr);
    });
  });
})();
