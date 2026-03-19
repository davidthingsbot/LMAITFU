# LMAITFU

**Let Me AI That For You**

A playful homage to the classic [LMGTFY](https://lmgtfy.app/) (Let Me Google That For You), but for the AI era.

## What It Does

1. You enter a question someone asked you (that they could have easily asked AI)
2. You get a shareable link
3. When they open it, they watch an animation of:
   - The question being typed into an AI chat interface
   - The AI "thinking"
   - The actual AI response appearing

The passive-aggressive way to tell someone: *"You know you could have just asked AI, right?"*

## How It Works

This is a static site that runs entirely in the browser. When viewing a shared link:

1. Choose an AI provider:
   - **🤗 Hugging Face (Free)** — No API key required! Uses Mistral-7B. Rate-limited but works.
   - **OpenAI** — Requires your own API key
   - **Anthropic** — Requires your own API key

2. Watch the animation play while the real API call happens
3. See the actual AI response

### Why Client-Side?

- No backend to maintain
- Free option via Hugging Face Inference API
- Your key (if used) = your cost
- Privacy: queries never touch a third-party server (except the AI provider)

## Usage

### Creating a Link

1. Visit the site
2. Choose provider (Hugging Face is default, no key needed)
3. Type the question
4. Click "Generate Link"
5. Share the link with the person who should have asked AI themselves

### Viewing a Link

1. Open the shared link
2. Choose "Hugging Face (Free)" or use your own API key
3. Watch the animation
4. See the AI's answer
5. Feel appropriately chastised

## Technical Details

- Pure static site (HTML, CSS, JavaScript)
- Hosted on GitHub Pages
- No backend, no database, no cookies (except localStorage for API key)
- Query is encoded in the URL (base64)
- API call happens on the viewer's browser using the creator's embedded (encrypted) key hint or viewer's own key

## Local Development

```bash
# Clone the repo
git clone https://github.com/davidthingsbot/LMAITFU.git
cd LMAITFU

# Serve locally (any static server works)
python -m http.server 8000
# or
npx serve .

# Open http://localhost:8000
```

## Deployment

The site is automatically deployed via GitHub Pages from the `main` branch.

Live at: **https://davidthingsbot.github.io/LMAITFU/**

## Privacy & Security

- API keys are stored in browser localStorage only
- Keys are never transmitted to any server except the AI provider
- Shared links contain the query but NOT your API key
- Recipients need their own API key to see responses (or you can include a one-time key hint)

## Contributing

PRs welcome! Ideas:
- More AI providers (Gemini, local models via Ollama)
- Better animations
- Snarkier messages
- Mobile improvements

## License

MIT — Do whatever you want with it.

## Credits

Inspired by [LMGTFY](https://lmgtfy.app/), which has been teaching people to Google since 2008.

---

*For when "just ask ChatGPT" is too polite.*
