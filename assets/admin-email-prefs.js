/**
 * Per-browser approval email prefs (Gmail u/N + template).
 * Shared across /admin/email-template and /mailto-form/:id.
 */
(function (global) {
  var STORAGE_KEY = "ton-webring-approval-email";

  function nonempty(s) {
    return typeof s === "string" && s.trim() !== "";
  }

  function applyPlaceholders(text, vars) {
    return String(text || "").replace(/\{\{(\w+)\}\}/g, function (_, key) {
      return vars[key] != null ? String(vars[key]) : "{{" + key + "}}";
    });
  }

  function gmailComposeUrl(index) {
    var n = parseInt(index, 10);
    if (isNaN(n) || n < 0) n = 0;
    return "https://mail.google.com/mail/u/" + n + "/?view=cm";
  }

  function readLocal() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      var idx = parseInt(parsed.gmailUserIndex, 10);
      return {
        gmailUserIndex: isNaN(idx) ? null : idx,
        subject: typeof parsed.subject === "string" ? parsed.subject : null,
        body: typeof parsed.body === "string" ? parsed.body : null,
      };
    } catch (e) {
      return null;
    }
  }

  function writeLocal(prefs) {
    var next = {
      gmailUserIndex: Math.floor(Number(prefs.gmailUserIndex)),
    };
    if (isNaN(next.gmailUserIndex) || next.gmailUserIndex < 0) {
      next.gmailUserIndex = 0;
    }
    // Only persist subject/body when non-empty so we never poison defaults with "".
    if (nonempty(prefs.subject)) next.subject = prefs.subject;
    if (nonempty(prefs.body)) next.body = prefs.body;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  }

  /** Merge into existing local prefs (or create). Omits empty subject/body. */
  function patchLocal(partial) {
    var cur = readLocal() || {};
    var next = {
      gmailUserIndex:
        partial.gmailUserIndex != null
          ? partial.gmailUserIndex
          : cur.gmailUserIndex != null
            ? cur.gmailUserIndex
            : 5,
    };
    if (partial.subject !== undefined) {
      if (nonempty(partial.subject)) next.subject = partial.subject;
    } else if (nonempty(cur.subject)) {
      next.subject = cur.subject;
    }
    if (partial.body !== undefined) {
      if (nonempty(partial.body)) next.body = partial.body;
    } else if (nonempty(cur.body)) {
      next.body = cur.body;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  }

  function fetchDefaults(cb) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/admin/email-template-defaults", true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          cb(null, JSON.parse(xhr.responseText));
          return;
        } catch (e) {
          cb(e);
          return;
        }
      }
      cb(new Error("Failed to load defaults"));
    };
    xhr.send();
  }

  /** localStorage overrides server defaults; empty strings fall back to server. */
  function loadPrefs(cb) {
    fetchDefaults(function (err, defaults) {
      var base = defaults || {
        gmailUserIndex: 5,
        subject: "TheOldNet WebRing Approval",
        body: "",
      };
      var local = readLocal();
      if (!local) {
        cb(null, base, "server");
        return;
      }
      var merged = {
        gmailUserIndex:
          local.gmailUserIndex != null
            ? local.gmailUserIndex
            : base.gmailUserIndex,
        subject: nonempty(local.subject) ? local.subject : base.subject,
        body: nonempty(local.body) ? local.body : base.body,
      };
      // Heal storage poisoned by older builds that saved "".
      if (
        (local.subject != null && !nonempty(local.subject)) ||
        (local.body != null && !nonempty(local.body))
      ) {
        writeLocal(merged);
      }
      cb(
        null,
        merged,
        nonempty(local.subject) || nonempty(local.body) ? "local" : "server"
      );
    });
  }

  function initTemplateEditor() {
    var statusEl = document.getElementById("prefs-status");
    var indexEl = document.getElementById("gmailUserIndex");
    var subjectEl = document.getElementById("subject");
    var bodyEl = document.getElementById("body");
    var saveBtn = document.getElementById("save-prefs");
    var clearBtn = document.getElementById("clear-prefs");

    function setStatus(msg) {
      if (statusEl) statusEl.textContent = msg || "";
    }

    loadPrefs(function (err, prefs, source) {
      indexEl.value = prefs.gmailUserIndex;
      subjectEl.value = prefs.subject;
      bodyEl.value = prefs.body;
      setStatus(
        source === "local"
          ? "Loaded from this browser's local storage."
          : "Using shared defaults (nothing saved in this browser yet)."
      );
    });

    saveBtn.onclick = function () {
      writeLocal({
        gmailUserIndex: indexEl.value,
        subject: subjectEl.value,
        body: bodyEl.value,
      });
      setStatus(
        "Saved to this browser only (local storage). Other admins are unaffected."
      );
    };

    clearBtn.onclick = function () {
      localStorage.removeItem(STORAGE_KEY);
      loadPrefs(function (err, prefs) {
        indexEl.value = prefs.gmailUserIndex;
        subjectEl.value = prefs.subject;
        bodyEl.value = prefs.body;
        setStatus("Cleared local storage; showing shared defaults.");
      });
    };
  }

  function initMailto(site) {
    var form = document.getElementById("gmail-form");
    var indexEl = document.getElementById("gmailUserIndex");
    var subjectEl = document.getElementById("su");
    var bodyEl = document.getElementById("body");
    var statusEl = document.getElementById("prefs-status");

    function setStatus(msg) {
      if (statusEl) statusEl.textContent = msg || "";
    }

    function syncFormAction() {
      form.action = gmailComposeUrl(indexEl.value);
    }

    function persistGmailIndex() {
      patchLocal({ gmailUserIndex: indexEl.value });
      syncFormAction();
      setStatus("Gmail index saved for this browser (local storage).");
    }

    loadPrefs(function (err, prefs, source) {
      indexEl.value = prefs.gmailUserIndex;
      subjectEl.value = applyPlaceholders(prefs.subject, site);
      bodyEl.value = applyPlaceholders(prefs.body, site);
      syncFormAction();
      setStatus(
        source === "local"
          ? "Template & Gmail index from this browser's local storage."
          : "Using shared defaults. Set Gmail index below — it saves in this browser."
      );
    });

    indexEl.addEventListener("change", persistGmailIndex);
    indexEl.addEventListener("blur", persistGmailIndex);

    form.addEventListener("submit", function () {
      patchLocal({ gmailUserIndex: indexEl.value });
    });
  }

  global.TonWebringEmailPrefs = {
    initTemplateEditor: initTemplateEditor,
    initMailto: initMailto,
  };
})(window);
