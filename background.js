chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['contentScript.js']
  });
});

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === 'generateResponse') {
    const response = await fetch('https://api.openai.com/v1/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer YOUR_API_KEY`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: `Given the context provided in userContext, generate an AI response to fill in form fields.`,
        max_tokens: 100,
        temperature: 0.7
      })
    });

    const data = await response.json();
    if (data && data.choices && data.choices[0] && data.choices[0].text) {
      chrome.storage.local.set({ response: data.choices[0].text });
    } else {
      sendResponse(null);
    }
  }
});