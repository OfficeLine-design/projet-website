(function () {
  "use strict";

  /* ==========================================================================
     Quote form → real email delivery via Formspree (no backend required)
     ==========================================================================
     Setup (one-time, ~2 minutes):
       1. Create a free account at https://formspree.io
       2. Create a new form, copy its endpoint (looks like
          https://formspree.io/f/xxxxabcd)
       3. Paste it below as FORMSPREE_ENDPOINT
       4. Rebuild the site (python3 build.py) — done, quotes now arrive by email.

     If you prefer not to use Formspree, swap the fetch() call below for any
     other endpoint (your own backend, EmailJS, Netlify Forms, etc.) — the
     rest of the validation/UX logic stays the same.
  ========================================================================== */
  var FORMSPREE_ENDPOINT = "https://formspree.io/f/YOUR_FORM_ID"; // <-- replace with your real Formspree form ID

  var messages = {
    fr: {
      success: "Merci ! Votre demande a bien été envoyée, notre équipe commerciale vous recontactera rapidement.",
      error: "Merci de remplir tous les champs obligatoires et d'accepter la politique de confidentialité.",
      sending: "Envoi en cours...",
      networkError: "Une erreur est survenue lors de l'envoi. Merci de réessayer, ou de nous contacter directement par téléphone.",
      notConfigured: "Le formulaire n'est pas encore connecté à un service d'envoi (voir static/js/form.js). Votre demande n'a pas été transmise.",
      loginNote: "Cet espace nécessite une connexion au serveur distributeur (voir dossier /server)."
    },
    en: {
      success: "Thank you! Your request has been sent, our sales team will get back to you shortly.",
      error: "Please fill in all required fields and accept the privacy policy.",
      sending: "Sending...",
      networkError: "Something went wrong while sending. Please try again, or contact us directly by phone.",
      notConfigured: "The form is not yet connected to a sending service (see static/js/form.js). Your request was not sent.",
      loginNote: "This area requires a connection to the distributor server (see /server folder)."
    },
    ar: {
      success: "شكراً لكم! تم إرسال طلبكم بنجاح، سيتواصل معكم فريقنا التجاري في أقرب وقت.",
      error: "يرجى ملء جميع الحقول المطلوبة والموافقة على سياسة الخصوصية.",
      sending: "جارٍ الإرسال...",
      networkError: "حدث خطأ أثناء الإرسال. يرجى المحاولة مجدداً أو الاتصال بنا مباشرة عبر الهاتف.",
      notConfigured: "لم يتم ربط النموذج بعد بخدمة إرسال (راجع static/js/form.js). لم يتم إرسال طلبكم.",
      loginNote: "يتطلب هذا الفضاء الاتصال بخادم الموزعين (راجع مجلد /server)."
    }
  };

  function lang() {
    return document.documentElement.lang || "fr";
  }

  var quoteForm = document.getElementById("quoteForm");
  if (quoteForm) {
    var feedback = document.getElementById("formFeedback");
    var submitBtn = quoteForm.querySelector('button[type="submit"]');

    quoteForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = messages[lang()] || messages.fr;
      var valid = quoteForm.checkValidity();
      if (!valid) {
        feedback.textContent = msg.error;
        feedback.className = "form-feedback error";
        return;
      }

      if (!FORMSPREE_ENDPOINT || FORMSPREE_ENDPOINT.indexOf("YOUR_FORM_ID") !== -1) {
        /* Not configured yet — tell the site owner clearly instead of
           silently pretending the email was sent. */
        feedback.textContent = msg.notConfigured;
        feedback.className = "form-feedback error";
        return;
      }

      var data = new FormData(quoteForm);
      data.append("_language", lang());
      data.append("_page", "contact");

      if (submitBtn) { submitBtn.disabled = true; }
      feedback.textContent = msg.sending;
      feedback.className = "form-feedback";

      fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" }
      })
        .then(function (response) {
          if (response.ok) {
            feedback.textContent = msg.success;
            feedback.className = "form-feedback success";
            quoteForm.reset();
          } else {
            feedback.textContent = msg.networkError;
            feedback.className = "form-feedback error";
          }
        })
        .catch(function () {
          feedback.textContent = msg.networkError;
          feedback.className = "form-feedback error";
        })
        .finally(function () {
          if (submitBtn) { submitBtn.disabled = false; }
        });
    });
  }

  /* ==========================================================================
     Distributor login → real authentication against /server API
     ========================================================================== */
  var API_BASE_URL = "http://localhost:4000"; // <-- replace with your deployed server URL

  var distributorForm = document.getElementById("distributorForm");
  if (distributorForm) {
    var loginFeedback = document.getElementById("loginFeedback");
    var loginBtn = distributorForm.querySelector('button[type="submit"]');

    distributorForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = messages[lang()] || messages.fr;
      var username = distributorForm.username.value.trim();
      var password = distributorForm.password.value;

      if (!username || !password) {
        loginFeedback.textContent = msg.error;
        loginFeedback.className = "form-feedback error";
        return;
      }

      if (loginBtn) { loginBtn.disabled = true; }
      loginFeedback.textContent = msg.sending;
      loginFeedback.className = "form-feedback";

      fetch(API_BASE_URL + "/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username, password: password })
      })
        .then(function (res) { return res.json().then(function (body) { return { ok: res.ok, body: body }; }); })
        .then(function (result) {
          if (result.ok && result.body.token) {
            sessionStorage.setItem("ol_token", result.body.token);
            sessionStorage.setItem("ol_distributor", JSON.stringify(result.body.distributor || {}));
            renderDistributorPanel(result.body.distributor);
            loginFeedback.textContent = "";
          } else {
            loginFeedback.textContent = result.body.error || msg.error;
            loginFeedback.className = "form-feedback error";
          }
        })
        .catch(function () {
          loginFeedback.textContent = msg.networkError;
          loginFeedback.className = "form-feedback error";
        })
        .finally(function () {
          if (loginBtn) { loginBtn.disabled = false; }
        });
    });

    /* Restore session if already logged in during this browser session */
    var existingToken = sessionStorage.getItem("ol_token");
    if (existingToken) {
      var existingDist = sessionStorage.getItem("ol_distributor");
      try { renderDistributorPanel(JSON.parse(existingDist || "{}")); } catch (e) { /* ignore */ }
    }
  }

  function renderDistributorPanel(distributor) {
    var panel = document.getElementById("distributorPanel");
    var loginCard = document.getElementById("distributorLoginCard");
    if (!panel) return;
    if (loginCard) loginCard.hidden = true;
    panel.hidden = false;
    var nameEl = panel.querySelector("[data-distributor-name]");
    if (nameEl) nameEl.textContent = (distributor && distributor.company) || (distributor && distributor.username) || "";

    var logoutBtn = panel.querySelector("[data-logout]");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function () {
        sessionStorage.removeItem("ol_token");
        sessionStorage.removeItem("ol_distributor");
        window.location.reload();
      });
    }

    panel.querySelectorAll("[data-download-family]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var token = sessionStorage.getItem("ol_token");
        var family = btn.getAttribute("data-download-family");
        window.open(API_BASE_URL + "/api/catalog-download?family=" + encodeURIComponent(family) + "&token=" + encodeURIComponent(token), "_blank");
      });
    });
  }
})();

