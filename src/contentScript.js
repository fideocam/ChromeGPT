(() => {
  const ASSISTANT_CLASS = "chromegpt-field-button";
  const SUPPORTED_SELECTOR = [
    "textarea",
    "input:not([type])",
    "input[type='text']",
    "input[type='email']",
    "input[type='search']",
    "input[type='url']"
  ].join(",");

  if (window.__chromeGptAssistantReady) {
    attachAssistantButtons();
    return;
  }

  window.__chromeGptAssistantReady = true;
  injectStyles();
  attachAssistantButtons();

  const observer = new MutationObserver(() => attachAssistantButtons());
  observer.observe(document.documentElement, { childList: true, subtree: true });

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
    const type = (field.getAttribute("type") || "text").toLowerCase();
    return !field.disabled
      && !field.readOnly
      && !["password", "hidden", "checkbox", "radio", "file", "submit"].includes(type);
  }

  async function requestSuggestion(field, button) {
    const previousText = button.textContent;
    button.disabled = true;
    button.textContent = "...";

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
    } finally {
      button.disabled = false;
      button.textContent = previousText;
    }
  }

  function describeField(field) {
    return {
      id: field.id || "",
      name: field.name || "",
      label: getLabelText(field),
      placeholder: field.placeholder || "",
      ariaLabel: field.getAttribute("aria-label") || "",
      value: field.value || ""
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
