const ollama = require('https://cdn.jsdelivr.net/npm/ollama@2.5.3/dist/ollama.min.js');

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('submit').addEventListener('click', async () => {
    const cv = document.getElementById('cv').value;
    const prompt = document.getElementById('prompt').value;

    // Example: Using the system prompt to generate a response
    const response = await ollama.generate(prompt, { input: cv });

    alert(response);
  });
});

