---
name: Gemini model availability
description: Selecting Gemini models compatible with a user's own Google API key.
---

When the app uses a user's own Gemini API key, verify model availability with that key. A model supported by the SDK or Replit's managed proxy may still be retired or unavailable through the direct Google API.

**Why:** On November 17, 2026, this key returned 404 for `gemini-2.5-flash` with a notice that it was unavailable to new users. `gemini-3.5-flash-lite` was listed and successfully streamed text and image replies.

**How to apply:** Check the live model list when changing models, never log or display the API key, and keep provider retries bounded.
