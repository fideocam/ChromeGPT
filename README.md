# ChromeGPT

ChromeGPT is a local-first Chrome extension that uses a locally running Ollama model to assist with browser form fields.

The extension detects supported text inputs on the current page, classifies the likely field intent, generates a tailored suggestion with Ollama, and asks for approval before inserting the result.

## Current Functionality

- Adds inline AI buttons to supported form fields on the active page
- Supports text inputs, email inputs, URL inputs, search inputs, and textareas
- Classifies field intent from labels, names, placeholders, and ARIA metadata
- Generates suggestions through a local Ollama server
- Requires user approval before inserting generated text
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

## Usage

1. Start Ollama locally.
2. Load the `ChromeGPT` folder as an unpacked Chrome extension.
3. Open the extension settings page and add any reusable profile or resume context.
4. Open a page with form fields.
5. Click the ChromeGPT extension icon.
6. Click `Add AI Buttons`.
7. Click an inline `AI` button next to a field.
8. Review and approve the generated suggestion before insertion.

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
- Dedicated chat UI

## Development

Validate the extension scripts:

```sh
npm run validate
```
