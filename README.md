# CareBridge

CareBridge turns hospital discharge summaries into plain, friendly language for patients and families. It lays out medicines, diet, activity, warning signs and follow-up visits, writes follow-up reminder messages for WhatsApp (with calendar links), and has an "Ask me anything" chat. It works in English, Hindi, Bengali and Telugu.

## Technology
- One self-contained `index.html` (HTML, CSS and vanilla JavaScript) with no build step
- pdf.js (CDN) reads text from uploaded PDFs
- Google Fonts: Fraunces (headings), DM Sans (body), and Noto Sans Devanagari, Bengali and Telugu for Indian scripts
- AI features use the `window.claude` artifact API when opened inside claude.ai. Everywhere else (including the Netlify site), a small bridge script sends the same requests to Netlify Functions that call Claude through Netlify AI Gateway, so no API key is needed. Requests run as background jobs so long summaries are not cut off by the 30-second limit on normal functions: `/api/ai-job` stores the request in Netlify Blobs and reports the result, and `/api/ai-worker` (a background function) does the AI work. `/api/ai` streams answers directly and is used as a fallback.

## Run locally
Run `npm install`, then `netlify dev` so the AI function runs too. Opening `index.html` directly shows the layout, but the AI features need the function. On Netlify, the site is published from the repository root.
