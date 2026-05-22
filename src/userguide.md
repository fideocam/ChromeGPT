# ChromeGPT User Guide

ChromeGPT is a local-first Chrome extension for generating AI-assisted text for browser form fields. It uses a locally running Ollama model and asks for approval before inserting generated text into a page.

## Requirements

- Google Chrome or another Chromium-based browser that supports unpacked extensions
- Ollama running locally
- An installed Ollama model, such as `llama3.2`

## Install the Extension

1. Open Chrome and go to `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select the `ChromeGPT` folder.
5. Confirm that ChromeGPT appears in the extensions list.

## Start Ollama

ChromeGPT runs as a browser extension, so Ollama must allow requests from Chrome extension origins. If Ollama is started without this setting, generation can fail with request status `403`.

### Quick Start

```sh
OLLAMA_ORIGINS='chrome-extension://*' ollama serve
```

### macOS Menu Bar App

If the Ollama menu bar app is already running, quit it before starting Ollama from the terminal:

1. Click the Ollama menu bar icon.
2. Choose `Quit Ollama`.
3. Start Ollama with:

```sh
OLLAMA_ORIGINS='chrome-extension://*' ollama serve
```

Leave that terminal window open while using ChromeGPT.

If Ollama keeps rejecting requests, set the origin for macOS-launched apps, then restart Ollama:

```sh
launchctl setenv OLLAMA_ORIGINS 'chrome-extension://*'
```

After running that command:

1. Quit Ollama from the menu bar.
2. Start Ollama again from Applications, Spotlight, or the terminal.
3. Run the curl origin test in the troubleshooting section.

If you want to remove the setting later:

```sh
launchctl unsetenv OLLAMA_ORIGINS
```

### Allow Only This Extension

For a stricter setup, allow only your installed ChromeGPT extension instead of all Chrome extensions:

1. Open `chrome://extensions`.
2. Find ChromeGPT.
3. Copy the extension ID.
4. Start Ollama with your extension ID:

```sh
OLLAMA_ORIGINS='chrome-extension://YOUR_EXTENSION_ID' ollama serve
```

Replace `YOUR_EXTENSION_ID` with the actual ID from Chrome.

Make sure the configured model is available:

```sh
ollama pull llama3.2
```

By default, ChromeGPT connects to:

```text
http://localhost:11434
```

## Configure ChromeGPT

1. Open the Chrome extensions page.
2. Find ChromeGPT.
3. Open the extension details or options page.
4. Set the Ollama host if needed.
5. Set the model name.
6. Paste reusable profile context, such as resume text, professional background, CRM notes, or other reference material.
7. Click `Test Ollama`.
8. Click `Save Settings`.

The profile context is stored in Chrome local storage and is sent only to the configured Ollama host when generating suggestions.

## Use ChromeGPT on a Form

1. Open a page with text fields.
2. Type a prompt, draft, or partial answer into the field.
3. Right-click inside the field.
4. Click `Generate text with ChromeGPT`.
5. Review the generated suggestion in the confirmation dialog.
6. Approve the suggestion to insert it, or cancel to leave the field unchanged.

The text already in the field is used as the prompt or draft. For example, you can type `write a short professional bio for a cloud architect` and then run ChromeGPT from the right-click menu.

## Optional Inline Buttons

1. Open a page with text fields.
2. Click the ChromeGPT extension icon.
3. Click `Add AI Buttons`.
4. Click an inline `AI` button next to a field.

The right-click menu is the primary workflow. Inline buttons are only a fallback for pages where visible controls are useful.

## Use ChromeGPT Chat

1. Click the ChromeGPT extension icon.
2. Click `Open Chat`.
3. Type a message.
4. Click `Send`.

The chat page uses the same Ollama host, model, and saved profile context as the form assistant.

## Supported Fields

ChromeGPT currently supports:

- text inputs
- email inputs
- URL inputs
- search inputs
- textareas

ChromeGPT does not intentionally attach to password fields, hidden fields, checkboxes, radio buttons, file inputs, or submit buttons.

## What ChromeGPT Can Draft

ChromeGPT can generate suggestions for fields such as:

- professional summaries
- cover letters
- job application responses
- technical experience descriptions
- CRM-style notes
- support ticket replies
- general long-form text inputs

## Troubleshooting

If the right-click menu does not appear, reload the page after reloading the unpacked extension from `chrome://extensions`.

If no `AI` buttons appear, use the right-click menu instead or reload the page and click `Add AI Buttons` again.

If generation fails, check that Ollama is running and that the configured model is installed.

You can test Ollama directly with:

```sh
curl http://localhost:11434/api/tags
```

If that command cannot connect, start Ollama with `OLLAMA_ORIGINS='chrome-extension://*' ollama serve`.

If generation fails with request status `403`, Ollama is blocking the Chrome extension origin. Quit the running Ollama server or app, then restart it with:

```sh
OLLAMA_ORIGINS='chrome-extension://*' ollama serve
```

On macOS, if you use the Ollama menu bar app, fully quit Ollama before starting it from the terminal with the command above.

You can test whether Ollama accepts browser-extension origins with:

```sh
curl -i -H 'Origin: chrome-extension://test-extension-id' http://localhost:11434/api/tags
```

If that returns `403`, the Ollama process currently listening on port `11434` was not started with the right `OLLAMA_ORIGINS` setting. Fully quit Ollama and start it again with the quoted command above.

On macOS, if the terminal command still results in `403`, use the `launchctl setenv` command from the macOS section and restart the Ollama app.

If Chrome reports a permissions issue, reload the unpacked extension from `chrome://extensions`.

If the generated text is too generic, add more specific profile context in the ChromeGPT settings page.

## Current Limitations

The following items are not implemented yet:

- file upload parsing
- DOCX or PDF import
- LinkedIn export parsing
- profile normalization into structured JSON
- streaming chat responses
- rich inline review UI beyond the browser confirmation dialog

## Validate the Extension Scripts

From the `ChromeGPT` folder, run:

```sh
npm run validate
```
