# ChromeGPT

ChromeGPT is a local-first Chrome extension that uses a locally running Ollama model to assist with browser form fields.

The extension detects supported text inputs on the current page, classifies the likely field intent, generates a tailored suggestion with Ollama, and asks for approval before inserting the result.

## Current Functionality

- Adds a right-click context menu action for supported form fields
- Can optionally add inline AI buttons to supported form fields on the active page
- Supports text inputs, email inputs, URL inputs, search inputs, and textareas
- Classifies field intent from labels, names, placeholders, and ARIA metadata
- Generates suggestions through a local Ollama server
- Requires user approval before inserting generated text
- Provides a local chat page for direct conversation with the configured Ollama model
- Stores reusable profile/context text in Chrome local storage
- Lets users configure the Ollama host and model from the extension settings page
- Runs without a cloud dependency when Ollama is available locally

## Local LLM Integration

By default, ChromeGPT sends generation requests to:

```text
http://localhost:11434
```

Default model:

```text
llama3.2
```

You can change the host and model in the extension settings page. Make sure the selected model is installed in Ollama first.

Browser extensions must be explicitly allowed by Ollama. Start Ollama with:

```sh
OLLAMA_ORIGINS='chrome-extension://*' ollama serve
```

## Ollama Extension Limitations

Ollama rejects browser-extension requests unless the extension origin is allowed when the Ollama server starts. When this is not configured, ChromeGPT can reach Ollama but generation fails with `403 Forbidden`.

This is an Ollama server-side security setting. ChromeGPT cannot grant itself access from inside the extension.

Allow all Chrome extensions:

```sh
OLLAMA_ORIGINS='chrome-extension://*' ollama serve
```

Allow only one installed ChromeGPT extension:

```sh
OLLAMA_ORIGINS='chrome-extension://YOUR_EXTENSION_ID' ollama serve
```

On macOS, the Ollama menu bar app may keep running without the terminal environment variable. Fully quit the app before running `ollama serve`, or set the variable for GUI-launched apps:

```sh
launchctl setenv OLLAMA_ORIGINS 'chrome-extension://*'
```

Then quit and restart Ollama.

Test whether Ollama accepts extension origins:

```sh
curl -i -H 'Origin: chrome-extension://test-extension-id' http://localhost:11434/api/tags
```

If that test returns `403`, ChromeGPT will also be rejected. Fix the Ollama startup environment first, then reload the extension and refresh the page.

## Usage

1. Start Ollama locally.
2. Load the `ChromeGPT` folder as an unpacked Chrome extension.
3. Open the extension settings page and add any reusable profile or resume context.
4. Open a page with form fields.
5. Type a prompt, draft, or partial answer into a text field.
6. Right-click inside that field.
7. Click `Generate text with ChromeGPT`.
8. Review and approve the generated suggestion before insertion.

To chat directly with the local model, click the ChromeGPT extension icon and then click `Open Chat`.

The popup also has an optional `Add AI Buttons` action for pages where you prefer visible inline controls.

## Implemented Field Assistance

ChromeGPT can currently draft suggestions for:

- professional summaries
- cover letters and application responses
- technical experience fields
- CRM-style notes
- support ticket replies
- general long-form text inputs

## Privacy Model

- Profile context is stored in `chrome.storage.local`.
- Generation requests are sent to the configured Ollama host.
- The extension does not call a cloud AI provider by default.
- Suggested text is inserted only after user confirmation.

## Roadmap

These items are part of the product vision but are not implemented yet:

- CV, LinkedIn, DOCX, and PDF upload parsing
- Profile normalization into structured JSON
- Rich inline suggestion UI instead of browser confirmation dialogs
- Deeper compatibility handling for complex React, Vue, and Angular controlled fields
- Per-site and per-workflow profile memories
- Streaming chat responses

## Development

Validate the extension scripts:

```sh
npm run validate
```
