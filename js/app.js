(function () {
  const form = document.getElementById("email-form");
  const statusEl = document.getElementById("status");
  const submitBtn = document.getElementById("submit-btn");
  const btnLabel = submitBtn.querySelector(".btn__label");
  const btnSpinner = submitBtn.querySelector(".btn__spinner");

  function resolveApiUrl() {
    if (window.EMAIL_API) return window.EMAIL_API;
    if (window.location.port === "3000") {
      return "/api/send-email";
    }
    return "/.netlify/functions/send-email";
  }

  const apiUrl = resolveApiUrl();

  function setStatus(message, type) {
    statusEl.hidden = false;
    statusEl.textContent = message;
    statusEl.className = "status status--" + type;
  }

  function clearFieldErrors() {
    form.querySelectorAll(".field__error").forEach((el) => {
      el.textContent = "";
    });
  }

  function validate(data) {
    const errors = {};
    if (!data.to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.to)) {
      errors.to = "Unesi ispravnu email adresu.";
    }
    if (!data.subject || data.subject.trim().length < 2) {
      errors.subject = "Naslov mora imati bar 2 karaktera.";
    }
    if (!data.message || data.message.trim().length < 10) {
      errors.message = "Poruka mora imati bar 10 karaktera.";
    }
    return errors;
  }

  function setLoading(loading) {
    submitBtn.disabled = loading;
    btnSpinner.hidden = !loading;
    btnLabel.textContent = loading ? "Šaljem…" : "Pošalji";
  }

  if (window.location.protocol === "file:") {
    setStatus(
      "Otvori preko servera: npm start ili npx netlify dev (ne file://).",
      "error"
    );
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearFieldErrors();
    statusEl.hidden = true;

    if (window.location.protocol === "file:") {
      setStatus("Pokreni npm start ili npx netlify dev.", "error");
      return;
    }

    const data = {
      to: form.to.value.trim(),
      subject: form.subject.value.trim(),
      message: form.message.value.trim(),
    };

    const errors = validate(data);
    if (Object.keys(errors).length) {
      for (const [field, msg] of Object.entries(errors)) {
        const errEl = form.querySelector('[data-error-for="' + field + '"]');
        if (errEl) errEl.textContent = msg;
      }
      setStatus("Proveri označena polja.", "error");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(payload.error || "Slanje nije uspelo.");
      }

      let okMsg = payload.message || "Email je uspešno poslat.";
      if (payload.messageId) {
        okMsg += " ID: " + payload.messageId;
      }
      setStatus(okMsg, "success");
      form.reset();
    } catch (err) {
      setStatus(
        err.message ||
          "Greška — proveri .env (lokalno) ili env varijable na Netlify-u.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  });
})();
