const DEFAULT_SETTINGS = {
  ollamaHost: "http://localhost:11434",
  model: "llama3.2",
  profileText: ""
};

const messages = [];

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("chatForm");
  const prompt = document.getElementById("prompt");
  const send = document.getElementById("send");
  const status = document.getElementById("status");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const userText = prompt.value.trim();
    if (!userText) {
      return;
    }

    prompt.value = "";
    send.disabled = true;
    status.textContent = "Thinking...";
    appendMessage("user", userText);
    messages.push({ role: "user", content: userText });

    try {
      const settings = await getSettings();
      const assistantText = await sendChat(settings);
      messages.push({ role: "assistant", content: assistantText });
      appendMessage("assistant", assistantText);
      status.textContent = `Using ${settings.model} at ${settings.ollamaHost}`;
    } catch (error) {
      status.textContent = error.message || String(error);
    } finally {
      send.disabled = false;
      prompt.focus();
    }
  });
});

async function getSettings() {
  const response = await chrome.runtime.sendMessage({ action: "getSettings" });
  if (!response?.ok) {
    throw new Error(response?.error || "Could not load settings.");
  }

  return { ...DEFAULT_SETTINGS, ...response.settings };
}

async function sendChat(settings) {
  const normalizedHost = settings.ollamaHost.replace(/\/$/, "");
  const response = await fetch(`${normalizedHost}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: settings.model,
      stream: false,
      messages: buildMessages(settings.profileText)
    })
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error(
        "Ollama rejected ChromeGPT with 403. Start Ollama with OLLAMA_ORIGINS='chrome-extension://*' ollama serve."
      );
    }

    throw new Error(`Ollama request failed with ${response.status}.`);
  }

  const data = await response.json();
  return (data.message?.content || "").trim();
}

function buildMessages(profileText) {
  const systemPrompt = [
    "You are ChromeGPT, a local-first assistant running through Ollama.",
    "Answer clearly and concisely.",
    profileText ? `Use this saved user context when relevant:\n${profileText}` : ""
  ].filter(Boolean).join("\n\n");

  return [
    { role: "system", content: systemPrompt },
    ...messages
  ];
}

function appendMessage(role, content) {
  const message = document.createElement("div");
  message.className = `message ${role}`;
  message.textContent = content;
  document.getElementById("messages").appendChild(message);
  message.scrollIntoView({ block: "end" });
}
