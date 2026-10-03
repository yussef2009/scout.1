# ScoutAI

ScoutAI is a browser-based sports performance and scouting app designed to turn raw match or training footage into structured, professional-grade player insights. It lets you upload a video, select[...]

This project is intentionally lightweight: it runs entirely in the browser as a static front-end app with HTML, CSS, and vanilla JavaScript. There is no separate backend service, database, or build[...]

## Overview

ScoutAI is built for coaches, scouts, athletes, and analysts who want a fast way to:

- review player performance from video footage
- compare athletes across key metrics
- receive role-specific tactical analysis
- generate strengths, weaknesses, and training recommendations
- track a player's progression over multiple analyses

## Key features

- dark, modern, responsive UI for sports analysis workflows
- drag-and-drop or file-picker video uploads
- local video preview before analysis
- sport-specific evaluation logic across multiple disciplines
- AI-powered player detection and multi-player selection
- role-based analysis and position suitability scoring
- performance metrics, charting, and summary cards
- strengths, weaknesses, and actionable recommendations
- dynamic model fallback logic for Gemini reliability
- browser-based API key setup with local persistence
- downloadable report export for sharing or review

## Supported sports

ScoutAI currently includes tailored metrics and evaluation logic for:

- Football / Soccer
- Basketball
- Tennis
- Swimming
- Athletics
- Volleyball
- Boxing
- Gymnastics
- Cycling
- Baseball

## How it works

1. Select the sport and analysis context.
2. Upload a video clip or match footage.
3. Choose the athlete or athletes to evaluate.
4. Let Gemini analyze the footage and generate a scouting dossier.
5. Review the overall rating, tactical profile, performance chart, strengths, weaknesses, and recommendations.

## Tech stack

- HTML5
- CSS3
- Vanilla JavaScript (ES6+)
- Google Gemini API (`v1beta:generateContent`)
- Gemini Files API for video upload handling
- Chart.js via jsDelivr
- Google Fonts

## Getting started

### Clone the repository

```bash
git clone https://github.com/yussef2009/scout.1.git
cd scout.1
```

## Local setup

Because this is a static frontend app, you can run it from any local web server.

### Option 1: Python

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

### Option 2: Node

```bash
npx serve .
```

## Required configuration

Before using the analysis tools, you must:

- open the app in a browser
- provide a valid Google Gemini API key via the settings modal
- keep an internet connection available for API requests

The app stores the API key in the browser's `localStorage` so it remains available between sessions on the same device/browser.

## Project structure

```text
.
├── index.html
├── style.css
├── app.js
├── README.md
└── assets or generated UI states (runtime-generated)
```

## Notes

- The app is designed for front-end-only local experimentation and demos.
- Analysis depends on external Gemini availability and quota.
- The code includes a fallback and retry strategy for model resolution, so users can continue with alternate models when a preferred model is unavailable.
- The app includes robust parsing logic for model responses, including handling markdown wrappers or partial JSON output.

## Status

The repository contains a complete front-end sports scouting interface with dynamic model resolution and AI analysis flow. It is ready to run locally for browser-based testing and evaluation.

## License

This repository currently does not specify a license file, so usage rights are governed by the repository owner unless otherwise stated.
