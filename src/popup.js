document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("scanPage");
  const status = document.getElementById("status");

  button.addEventListener("click", async () => {
    status.textContent = "Adding field assistants...";
    button.disabled = true;

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const response = await chrome.runtime.sendMessage({
        action: "injectAssistant",
        tabId: tab?.id
      });

      if (!response?.ok) {
        throw new Error(response?.error || "Could not inject assistant.");
      }

      status.textContent = "AI buttons added to supported fields.";
    } catch (error) {
      status.textContent = error.message || String(error);
    } finally {
      button.disabled = false;
    }
  });
});
