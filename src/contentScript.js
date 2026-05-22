(() => {
  const ASSISTANT_CLASS = "chromegpt-field-button";
  const SUPPORTED_SELECTOR = [
    "textarea",
    "input:not([type])",
    "input[type='text']",
    "input[type='email']",
    "input[type='search']",
    "input[type='url']",
    "[contenteditable='true']",
    "[role='textbox']"
  ].join(",");
  let contextField = null;
  let lastFocusedField = null;

  if (window.__chromeGptAssistantReady) {
    return;
  }

  window.__chromeGptAssistantReady = true;
  injectStyles();

  document.addEventListener("contextmenu", (event) => {
    contextField = getAssistableField(event.target);
  }, true);

  document.addEventListener("focusin", (event) => {
    lastFocusedField = getAssistableField(event.target);
  }, true);

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message)
      .then(sendResponse)
      .catch((error) => {
        if (!error.chromegptShown) {
          window.alert(`ChromeGPT could not generate text.\n\n${error.message || error}`);
        }
        sendResponse({ ok: false, error: error.message || String(error) });
      });

    return true;
  });

  async function handleMessage(message) {
    if (message?.action === "attachAssistantButtons") {
      attachAssistantButtons();
      return { ok: true };
    }

    if (message?.action === "generateForContextField") {
      const field = contextField || lastFocusedField || getAssistableField(document.activeElement);
      if (!field) {
        throw new Error("ChromeGPT could not find the textbox. Click into the field, then right-click inside it again.");
      }

      await requestSuggestion(field);
      return { ok: true };
    }

    return { ok: false, error: "Unknown action." };
  }

  function attachAssistantButtons() {
    document.querySelectorAll(SUPPORTED_SELECTOR).forEach((field) => {
      if (!isAssistableField(field) || field.dataset.chromegptAttached) {
        return;
      }

      field.dataset.chromegptAttached = "true";
      const button = document.createElement("button");
      button.type = "button";
      button.className = ASSISTANT_CLASS;
      button.textContent = "AI";
      button.title = "Generate a local AI suggestion";
      button.addEventListener("click", () => requestSuggestion(field, button));

      field.insertAdjacentElement("afterend", button);
    });
  }

  function isAssistableField(field) {
    if (!field || field.nodeType !== Node.ELEMENT_NODE) {
      return false;
    }

    if (field.isContentEditable || field.getAttribute("role") === "textbox") {
      return true;
    }

    if (!field.matches?.("input, textarea")) {
      return false;
    }

    const type = (field.getAttribute("type") || "text").toLowerCase();
    return !field.disabled
      && !field.readOnly
      && !["password", "hidden", "checkbox", "radio", "file", "submit"].includes(type);
  }

  function getAssistableField(target) {
    if (!target?.closest) {
      return null;
    }

    const field = target.closest(SUPPORTED_SELECTOR);
    return isAssistableField(field) ? field : null;
  }

  async function requestSuggestion(field, button) {
    const previousText = button?.textContent;
    if (button) {
      button.disabled = true;
      button.textContent = "...";
    }

    try {
      const response = await chrome.runtime.sendMessage({
        action: "generateSuggestion",
        payload: {
          field: describeField(field)
        }
      });

      if (!response?.ok) {
        throw new Error(response?.error || "Suggestion failed.");
      }

      const approved = window.confirm(
        `ChromeGPT suggestion (${response.intent}):\n\n${response.suggestion}\n\nInsert this text?`
      );

      if (approved) {
        insertValue(field, response.suggestion);
      }
    } catch (error) {
      window.alert(`ChromeGPT could not generate a suggestion.\n\n${error.message || error}`);
      error.chromegptShown = true;
      throw error;
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = previousText;
      }
    }
  }

  function describeField(field) {
    return {
      id: field.id || "",
      name: field.name || "",
      label: getLabelText(field),
      placeholder: field.placeholder || "",
      ariaLabel: field.getAttribute("aria-label") || "",
      value: getFieldValue(field)
    };
  }

  function getLabelText(field) {
    if (field.labels?.length) {
      return Array.from(field.labels)
        .map((label) => label.innerText.trim())
        .filter(Boolean)
        .join(" ");
    }

    const labelledBy = field.getAttribute("aria-labelledby");
    if (labelledBy) {
      return labelledBy
        .split(/\s+/)
        .map((id) => document.getElementById(id)?.innerText.trim())
        .filter(Boolean)
        .join(" ");
    }

    return "";
  }

  function insertValue(field, value) {
    if (field.isContentEditable || field.getAttribute("role") === "textbox") {
      field.focus();
      field.textContent = value;
      field.dispatchEvent(new InputEvent("input", {
        bubbles: true,
        inputType: "insertText",
        data: value
      }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }

    const prototype = field instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
    const valueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;

    field.focus();
    if (valueSetter) {
      valueSetter.call(field, value);
    } else {
      field.value = value;
    }

    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function getFieldValue(field) {
    if (field.isContentEditable || field.getAttribute("role") === "textbox") {
      return field.innerText || field.textContent || "";
    }

    return field.value || "";
  }

  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .${ASSISTANT_CLASS} {
        margin-left: 6px;
        padding: 3px 7px;
        border: 1px solid #6b7280;
        border-radius: 4px;
        background: #ffffff;
        color: #111827;
        cursor: pointer;
        font: 12px/1.2 Arial, sans-serif;
        vertical-align: middle;
      }

      .${ASSISTANT_CLASS}:disabled {
        cursor: wait;
        opacity: 0.7;
      }
    `;
    document.documentElement.appendChild(style);
  }
})();
