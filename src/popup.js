document.addEventListener("DOMContentLoaded", function () {
  const button = document.getElementById("myButton");
  button.addEventListener("click", async function () {
    chrome.storage.local.get('response', (response) => {
      if (response && response.response) {
        alert(`Response: ${response.response}`);
      } else {
        chrome.runtime.sendMessage({ action: 'generateResponse' });
      }
    });
  });
});