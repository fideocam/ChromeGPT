document.addEventListener("DOMContentLoaded", async () => {
  const host = document.getElementById("ollamaHost");
  const model = document.getElementById("model");
  const profileText = document.getElementById("profileText");
  const save = document.getElementById("saveSettings");
  const status = document.getElementById("status");

  const response = await chrome.runtime.sendMessage({ action: "getSettings" });
  if (response?.ok) {
    host.value = response.settings.ollamaHost;
    model.value = response.settings.model;
    profileText.value = response.settings.profileText;
  }

  save.addEventListener("click", async () => {
    status.textContent = "Saving...";

    const result = await chrome.runtime.sendMessage({
      action: "saveSettings",
      settings: {
        ollamaHost: host.value.trim() || "http://localhost:11434",
        model: model.value.trim() || "llama3.2",
        profileText: profileText.value.trim()
      }
    });

    status.textContent = result?.ok ? "Settings saved." : result?.error || "Save failed.";
  });
});
