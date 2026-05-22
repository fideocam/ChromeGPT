async function submitForm() {
  const cv = document.getElementById('cv').value;
  const prompt = document.getElementById('prompt').value;

  // Example: Using the system prompt to generate a response
  const response = await ollama.generate(prompt, { input: cv });

  alert(response);
}