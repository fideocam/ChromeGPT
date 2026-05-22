const DEFAULT_SETTINGS = {
  ollamaHost: "http://localhost:11434",
  model: "llama3.2",
  profileText: ""
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((error) => {
      sendResponse({ ok: false, error: error.message || String(error) });
    });

  return true;
});

async function handleMessage(message, sender) {
  switch (message?.action) {
    case "injectAssistant":
      return injectAssistant(message.tabId);
    case "getSettings":
      return { ok: true, settings: await getSettings() };
    case "saveSettings":
      await chrome.storage.local.set({
        settings: { ...DEFAULT_SETTINGS, ...(message.settings || {}) }
      });
      return { ok: true };
    case "generateSuggestion":
      return generateSuggestion(message.payload || {});
    default:
      return { ok: false, error: "Unknown action." };
  }
}

async function injectAssistant(tabId) {
  if (!tabId) {
    throw new Error("No active tab found.");
  }

  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["src/contentScript.js"]
  });

  return { ok: true };
}

async function getSettings() {
  const { settings } = await chrome.storage.local.get("settings");
  return { ...DEFAULT_SETTINGS, ...(settings || {}) };
}

async function generateSuggestion(payload) {
  const settings = await getSettings();
  const field = payload.field || {};
  const intent = classifyFieldIntent(field);
  const prompt = buildPrompt(settings.profileText, field, intent);
  const response = await fetch(`${settings.ollamaHost.replace(/\/$/, "")}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: settings.model,
      prompt,
      stream: false,
      options: {
        temperature: 0.4
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed with ${response.status}. Is Ollama running?`);
  }

  const data = await response.json();
  return {
    ok: true,
    intent,
    suggestion: (data.response || "").trim()
  };
}

function classifyFieldIntent(field) {
  const text = [
    field.label,
    field.name,
    field.id,
    field.placeholder,
    field.ariaLabel
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/cover|motivation|why.*(role|job|company)|application/.test(text)) {
    return "tailored application response";
  }

  if (/summary|bio|about|profile|introduction/.test(text)) {
    return "professional summary";
  }

  if (/experience|skills|technology|technical|stack|expertise/.test(text)) {
    return "technical experience";
  }

  if (/crm|note|account|customer|client/.test(text)) {
    return "CRM note";
  }

  if (/ticket|support|issue|request|reply|response/.test(text)) {
    return "support ticket draft";
  }

  return "form field response";
}

function buildPrompt(profileText, field, intent) {
  return [
    "You are ChromeGPT, a local-first AI form assistant.",
    "Generate concise, accurate text for a browser form field.",
    "Do not invent facts. Use the provided user context when relevant.",
    "",
    `Intent: ${intent}`,
    `Field label: ${field.label || "unknown"}`,
    `Field name: ${field.name || "unknown"}`,
    `Placeholder: ${field.placeholder || "none"}`,
    `Current value: ${field.value || "empty"}`,
    "",
    "User context:",
    profileText || "No saved profile context.",
    "",
    "Return only the text that should be inserted into the field."
  ].join("\n");
}
