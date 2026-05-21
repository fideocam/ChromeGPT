# ChromeGPT
Extension for Chrome browser that lets you use locally run large language model to fill in form fields

# What is an AI Form Assistant

Local-first Chrome extension that uses Ollama to intelligently assist with form filling, job applications, CRM workflows, and long-form text inputs while preserving privacy and avoiding interference with browser autofill/password managers.

---

# Vision

AI Form Assistant is designed to act as a semantic copilot for forms.

Instead of blindly autofilling fields, the extension:

- understands field intent
- retrieves relevant user context
- generates tailored responses
- allows human approval before insertion
- runs entirely locally using Ollama

The system is privacy-first and enterprise-friendly.

---

# Core Goals

## Functional Goals

- Detect and analyze form fields
- Classify field intent semantically
- Use local AI (Ollama) for generation
- Support contextual profile memory
- Assist with job applications and enterprise workflows
- Provide inline AI suggestions
- Support user approval before insertion

---

## Non-Functional Goals

- Local-first
- Privacy-preserving
- No cloud dependency required
- Non-invasive DOM behavior
- Compatible with:
  - browser autofill
  - password managers
  - React/Vue/Angular apps
  - accessibility tooling

---

# Key Features

## AI Field Assistance

Supports:
- professional summaries
- cover letters
- technical experience
- CRM notes
- support ticket drafting
- executive bios
- tailored application responses

---

## Local LLM Integration

Uses local Ollama instance:

http://localhost:11434

Supported models:
- llama3
- qwen2.5
- mistral
- phi4
- gemma

---

## Structured User Context

User can upload:
- CV/resume
- LinkedIn export
- Markdown profile
- DOCX/PDF

Profile is normalized into structured JSON.

Example:

```json
{
  "name": "John Doe",
  "title": "Technology Strategist",
  "skills": [
    "AI",
    "Cloud",
    "Enterprise Architecture"
  ],
  "experience": [
    {
      "role": "CTO",
      "summary": "Led enterprise AI initiatives."
    }
  ]
}
