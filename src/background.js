const DEFAULT_SETTINGS = {
  ollamaHost: "http://localhost:11434",
  model: "llama3.2",
  profileText: ""
};
const GENERATE_CONTEXT_MENU_ID = "chromegpt-generate-from-field";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: GENERATE_CONTEXT_MENU_ID,
      title: "Generate text with ChromeGPT",
      contexts: ["editable"]
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== GENERATE_CONTEXT_MENU_ID || !tab?.id) {
    return;
  }

  const frameId = info.frameId || 0;
  const message = { action: "generateForContextField" };
  chrome.tabs.sendMessage(tab.id, message, { frameId }, () => {
    if (!chrome.runtime.lastError) {
      return;
    }

    chrome.scripting.executeScript({
      target: { tabId: tab.id, frameIds: [frameId] },
      files: ["src/contentScript.js"]
    }, () => {
      if (chrome.runtime.lastError) {
        console.error("ChromeGPT injection failed:", chrome.runtime.lastError.message);
        return;
      }

      chrome.tabs.sendMessage(tab.id, message, { frameId }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("ChromeGPT message failed:", chrome.runtime.lastError.message);
          return;
        }

        if (response && !response.ok) {
          console.error("ChromeGPT generation failed:", response.error);
        }
      });
    });
  });
});

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
    case "testOllama":
      return testOllamaConnection(message.settings);
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

  await chrome.tabs.sendMessage(tabId, { action: "attachAssistantButtons" });

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
  const data = await postGenerate(settings.ollamaHost, settings.model, prompt);

  return {
    ok: true,
    intent,
    suggestion: (data.response || "").trim()
  };
}

async function postGenerate(host, model, prompt) {
  const response = await fetch(`${host.replace(/\/$/, "")}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: {
        temperature: 0.4
      }
    })
  });

  if (!response.ok) {
    const body = await response.text();
    if (response.status === 403) {
      throw new Error(getOriginHelpMessage());
    }

    throw new Error(`Ollama request failed with ${response.status}. ${body || "Is Ollama running and is the model installed?"}`);
  }

  return response.json();
}

async function testOllamaConnection(settings = {}) {
  const mergedSettings = { ...DEFAULT_SETTINGS, ...settings };
  const response = await fetch(`${mergedSettings.ollamaHost.replace(/\/$/, "")}/api/tags`);

  if (response.status === 403) {
    throw new Error(getOriginHelpMessage());
  }

  if (!response.ok) {
    throw new Error(`Ollama test failed with ${response.status}.`);
  }

  const data = await response.json();
  const models = Array.isArray(data.models) ? data.models.map((model) => model.name) : [];
  return {
    ok: true,
    models
  };
}

function getOriginHelpMessage() {
  return [
    "Ollama rejected ChromeGPT with 403.",
    "Ollama must be started with browser-extension origins allowed.",
    "Use: OLLAMA_ORIGINS='chrome-extension://*' ollama serve",
    "On macOS with the menu bar app, use: launchctl setenv OLLAMA_ORIGINS 'chrome-extension://*', then restart Ollama."
  ].join(" ");
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
  const existingText = field.value?.trim();

  return [
    "You are ChromeGPT, a local-first AI form assistant.",
    "Generate concise, accurate text for a browser form field.",
    "Treat the current field value as the user's prompt, draft, or partial answer.",
    "If the current value asks for a specific output, follow that instruction.",
    "If the current value is partial text, complete or improve it.",
    "Do not invent facts. Use the provided user context when relevant.",
    "",
    `Intent: ${intent}`,
    `Field label: ${field.label || "unknown"}`,
    `Field name: ${field.name || "unknown"}`,
    `Placeholder: ${field.placeholder || "none"}`,
    `Current field value: ${existingText || "empty"}`,
    "",
    "User context:",
    profileText || "No saved grounding material.",
    "",
    "Return only the text that should be inserted into the field."
  ].join("\n");
}
