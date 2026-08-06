# 🦸 Superhero Generator

> **iFAgent Technical Challenge – Intern Developer**  
> Biến ảnh của bạn thành siêu anh hùng với Google Gemini AI

![Tech Stack](https://img.shields.io/badge/React-18-61DAFB?logo=react) ![Ant Design](https://img.shields.io/badge/Ant%20Design-5-0170FE?logo=antdesign) ![TailwindCSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss) ![Gemini](https://img.shields.io/badge/Google%20Gemini-AI-8E75B2?logo=google)

---

## ✨ Tính năng

| Thành phần | Mô tả |
|---|---|
| **A – Input** | Nhập tên + Upload ảnh hoặc chụp trực tiếp từ Camera |
| **B – AI Generation** | Gọi Google Gemini API để biến đổi khuôn mặt thành siêu anh hùng |
| **C – Watermark** | Tên người dùng được render đè lên ảnh bằng Canvas HTML5 |
| **D – Log Viewer** | Real-time logs: timestamp, prompt, HTTP status, latency, errors |

---

## 🛠️ Tech Stack

### Frontend
- **React 18** + **Vite**
- **Ant Design 5** – UI Components
- **TailwindCSS 3** – Utility styling
- **Canvas API** – Image watermark overlay

### Backend
- **Node.js** + **Express**
- **@google/genai** – Google Gemini SDK
- **dotenv**, **cors**

---

## 🚀 Chạy dự án local

### Yêu cầu
- Node.js >= 18
- Gemini API Key từ [Google AI Studio](https://aistudio.google.com/app/apikey)

### 1. Backend

```bash
cd backend
npm install
# Kiểm tra file .env có GEMINI_API_KEY
node index.js
# Server chạy tại http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# App chạy tại http://localhost:5173
```

### 3. Mở trình duyệt

Truy cập: **http://localhost:5173**

---

## 📁 Cấu trúc thư mục

```
IfAgentTest/
├── backend/
│   ├── index.js              # Express server (port 5000)
│   ├── routes/
│   │   ├── generate.js       # POST /api/generate → Gemini API
│   │   └── logs.js           # GET/DELETE /api/logs
│   ├── utils/
│   │   └── logger.js         # In-memory log store
│   └── .env                  # GEMINI_API_KEY
│
└── frontend/
    ├── src/
    │   ├── App.jsx                       # Layout chính
    │   ├── main.jsx                      # Entry + Ant Design theme
    │   ├── index.css                     # Global styles + Tailwind
    │   └── components/
    │       ├── InputPanel.jsx            # Form nhập tên + ảnh
    │       ├── CameraCapture.jsx         # Modal camera live
    │       ├── ResultPanel.jsx           # Hiển thị ảnh + Canvas watermark
    │       └── LogViewer.jsx             # Bảng log real-time
    └── vite.config.js
```

---

## 🔑 Cấu hình API Key

File `backend/.env`:
```env
GEMINI_API_KEY=your_api_key_here
PORT=5000
```

Lấy API key miễn phí tại: https://aistudio.google.com/app/apikey

---

## 📊 API Endpoints

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/generate` | Generate superhero image |
| `GET` | `/api/logs` | Lấy tất cả logs |
| `DELETE` | `/api/logs` | Xóa logs |

### POST /api/generate
**Request body:**
```json
{
  "imageBase64": "base64_string",
  "mimeType": "image/jpeg",
  "name": "Tên người dùng"
}
```

**Response:**
```json
{
  "success": true,
  "imageBase64": "base64_string",
  "mimeType": "image/png",
  "latency": 12345
}
```
