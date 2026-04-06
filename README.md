# Aether Ink 🖋️

**The high-performance, flow-state creative writing environment.**

Aether Ink is a minimalist, local-first writing app designed for novelists, screenwriters, and storytellers who value focus and narrative depth. Built with a "Zen-first" philosophy, it combines a high-contrast writing canvas with a sophisticated AI Architect to help you build worlds, refine plots, and master the craft.

![Logo](https://raw.githubusercontent.com/agreablecorgi/aether-ink/main/public/logo.png) *(Placeholder — actual UI used in production)*

## ✨ Core Philosophy

- **Zero Distraction**: No icons, no noise. Only typography and your words.
- **Humane Contrast**: Optimized HSL palettes (Obsidian & Parchment) for healthy, long-duration writing.
- **Narrative Architecture**: Conversations with an AI Architect that understands your specific story context.
- **Local-First**: Your stories stay on your machine, powered by a robust SQLite engine.

## 🚀 Key Features

### 🌖 Obsidian & Parchment
Switch instantly between a deep charcoal "night mode" and a rich, paper-like "light mode." Both themes are meticulously tuned to have a ~10:1 contrast ratio that is comfortable for the eyes.

### 🏛️ The Architect
A dedicated sidecar powered by **OpenRouter**. Unlike generic LLM chat, the Architect is integrated directly into your editor, helping you brainstorm characters, check for plot holes, or expand on descriptions without leaving the flow.

### 🎓 Teacher Mode
A set of AI-guided writing courses. Lessons are generated on-the-fly in any language, followed by exercises that the AI grades with honest, constructive feedback.

### ⌨️ Typewriter & Focus Modes
Keep your current line centered and dim everything else. Aether Ink recreates the focus of a classic typewriter while providing all the power of a modern digital editor.

## 🛠️ Technology Stack

- **Frontend**: Next.js 15 (App Router), Framer Motion, Tailwind CSS (for layout), Lucide.
- **Editor Core**: Tiptap (Headless rich-text).
- **Backend/Persistence**: Better-SQLite3 / Drizzle ORM.
- **AI Integration**: OpenRouter API.

## 📦 Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/agreablecorgi/aether-ink
   cd aether-ink
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Initialize the Database**:
   ```bash
   # Database initializes automatically on first run
   npm run dev
   ```

4. **Add your API Key**:
   Open the **Settings** menu within the app and paste your **OpenRouter API Key**.

## 📖 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

*Crafted with precision by the writers of tomorrow.* 
 [aether-ink.app](https://aether-ink.app) (soon)
