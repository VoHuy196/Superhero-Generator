# 🦸 Superhero Generator — Nano Banana Pro AI

> **A Full-Stack AI Web Application** that transforms any person's photo into an epic Marvel-style Superhero while preserving **100% of their exact facial features**. 
> Powered by **Google Gemini 3 Pro Image ("Nano Banana Pro")**, **React 18**, **Ant Design 5**, **TailwindCSS**, and **Express.js**.

![Superhero Generator Banner](https://img.shields.io/badge/AI-Nano%20Banana%20Pro-purple?style=for-the-badge&logo=google)
![Stack](https://img.shields.io/badge/Stack-React%20%7C%20Express%20%7C%20Ant%20Design-blue?style=for-the-badge)
![Deploy](https://img.shields.io/badge/Deploy-Vercel%20Ready-black?style=for-the-badge&logo=vercel)

---

## ✨ Features

- 🎭 **Face Preservation**: Keeps facial expressions, eye color, jawline, and skin tone 100% identical to the reference photo.
- ⚡ **Nano Banana Pro Model**: Uses Google's latest **Gemini 3 Pro Image (`gemini-3-pro-image`)** for ultra-detailed 8K Marvel concept art generation.
- 🔄 **3-Tier Cascade Fallback**:
  1. `gemini-3-pro-image` (Nano Banana Pro - Primary)
  2. `gemini-2.5-flash-image` (Nano Banana Flash - Secondary)
  3. `Pollinations.ai FLUX` (Emergency Fallback)
- 📸 **Camera & File Upload**: Upload local images or take a live photo directly from your WebCam.
- 🎨 **Canvas Watermark Overlay**: Renders dynamic user name badges onto the final generated artwork using HTML5 Canvas.
- 📊 **Real-time Log Viewer**: Monitored HTTP latency, status code, prompts, and active model providers in a live-updating table.
- 📱 **Cyberpunk / Dark UI**: Crafted with Ant Design 5 & TailwindCSS glassmorphism.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 + Vite
- **UI Library**: Ant Design 5 (Dark Theme, App context)
- **Styling**: TailwindCSS 3 (Glassmorphism & Neon Glow effects)
- **Canvas API**: HTML5 Native Canvas for image watermarking
- **Camera**: HTML5 MediaDevices API (`navigator.mediaDevices.getUserMedia`)

### Backend
- **Runtime**: Node.js
- **API Framework**: Express.js
- **AI SDK**: `@google/genai` (Google Gen AI SDK v1.0)
- **Image Processing**: Base64 & Multipart Uploader
- **Architecture**: REST API + In-Memory Circular Buffer Logger

---

## 🚀 Quick Start Guide (Run Locally)

Follow these simple steps to run the project on your local machine:

### 1. Prerequisites
Make sure you have **Node.js (v18 or higher)** and **npm** installed on your system.

```bash
node -v
npm -v
```

### 2. Clone the Repository
```bash
git clone https://github.com/VoHuy196/Superhero-Generator.git
cd Superhero-Generator
```

### 3. Install Dependencies

#### Install Backend Dependencies
```bash
cd backend
npm install
```

#### Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

---

### 4. Environment Configuration (`.env`)

Create a `.env` file inside the `backend/` directory:

```bash
# Path: backend/.env
PORT=5000

# Google Gemini API Key (Get free key at: https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=your_gemini_api_key_here

# (Optional) Pollinations API Key
POLLINATIONS_API_KEY=sk_kjRaZacOX9AgPJ86FJjXBS4bxn7Cz2kc
```

> 💡 **Tip**: Get a free Gemini API Key at [Google AI Studio](https://aistudio.google.com/app/apikey).

---

### 5. Run the Application

#### Step A: Start Backend Server
```bash
cd backend
npm start
# Server runs on: http://localhost:5000
```

#### Step B: Start Frontend Development Server (Open a new terminal)
```bash
cd frontend
npm run dev
# Frontend runs on: http://localhost:5173
```

🎉 Open your browser and navigate to **[http://localhost:5173](http://localhost:5173)** to start creating your superheroes!

---

## ☁️ Deploy to Vercel (One-Click / Manual)

This project is fully configured for Vercel deployment via `vercel.json` (Serverless Functions for Express API + Static build for Vite React).

1. Push your code to GitHub (already done!).
2. Log in to [Vercel Dashboard](https://vercel.com/dashboard) ➔ Click **Add New Project**.
3. Import the repository **`VoHuy196/Superhero-Generator`**.
4. Add **Environment Variable**:
   - `GEMINI_API_KEY` = `your_gemini_api_key`
5. Click **Deploy**. Vercel will handle building both frontend and backend automatically!

---

## 📁 Repository Structure

```text
Superhero-Generator/
├── backend/
│   ├── routes/
│   │   ├── generate.js     # Nano Banana Pro AI image generation route
│   │   └── logs.js         # Real-time log monitoring route
│   ├── utils/
│   │   ├── logger.js       # In-memory circular buffer logger
│   │   └── uploader.js     # Temp public image host uploader
│   ├── index.js            # Express application entrypoint
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── InputPanel.jsx     # Photo upload & form panel
│   │   │   ├── CameraCapture.jsx  # WebCam live capture modal
│   │   │   ├── ResultPanel.jsx   # Result display & Canvas watermark
│   │   │   └── LogViewer.jsx     # Real-time API log table
│   │   ├── App.jsx                # Main layout component
│   │   └── main.jsx               # React entry point
│   ├── index.html
│   ├── tailwind.config.js
│   └── package.json
├── vercel.json                    # Vercel deployment configuration
└── README.md                      # Project documentation
```

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

Developed for **iFAgent Intern Challenge** by **VoHuy196**.
