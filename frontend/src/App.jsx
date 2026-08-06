import { useState, useEffect } from 'react'
import { Typography, Space } from 'antd'
import { ThunderboltOutlined, StarOutlined } from '@ant-design/icons'
import InputPanel from './components/InputPanel'
import ResultPanel from './components/ResultPanel'
import LogViewer from './components/LogViewer'

const { Title, Text } = Typography

/**
 * Root App Component
 * Layout: Header → Two-column (Input | Result) → Log Viewer
 */
function App() {
  const [result, setResult] = useState(null)      // { imageBase64, mimeType, latency }
  const [loading, setLoading] = useState(false)
  const [userName, setUserName] = useState('')

  // Listen for regenerate event from ResultPanel
  useEffect(() => {
    const handler = () => {
      setResult(null)
    }
    window.addEventListener('regenerate', handler)
    return () => window.removeEventListener('regenerate', handler)
  }, [])

  const handleResult = (data, name) => {
    setResult(data)
    if (name) setUserName(name)
  }

  return (
    <div className="min-h-screen bg-dots" style={{ paddingBottom: 60 }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50"
        style={{
          background: 'rgba(15,15,26,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(124,58,237,0.2)',
          boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo + Title */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center animate-float"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                boxShadow: '0 0 20px rgba(124,58,237,0.5)',
              }}
            >
              <ThunderboltOutlined style={{ color: 'white', fontSize: 20 }} />
            </div>
            <div>
              <Title
                level={4}
                style={{ margin: 0, fontFamily: "'Orbitron', sans-serif", letterSpacing: 2 }}
                className="gradient-text"
              >
                SUPERHERO GENERATOR
              </Title>
              <Text style={{ color: '#6b7280', fontSize: 11, letterSpacing: 1 }}>
                POWERED BY GOOGLE GEMINI AI
              </Text>
            </div>
          </div>

          {/* Badge */}
          <Space>
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: 'rgba(124,58,237,0.15)',
                border: '1px solid rgba(124,58,237,0.3)',
                color: '#a78bfa',
              }}
            >
              <StarOutlined />
              iFAgent Intern Challenge
            </div>
          </Space>
        </div>
      </header>

      {/* ── Hero Section ───────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pt-10 pb-6 text-center">
        <div
          className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-4"
          style={{
            background: 'rgba(6,182,212,0.1)',
            border: '1px solid rgba(6,182,212,0.3)',
            color: '#06b6d4',
            letterSpacing: 2,
          }}
        >
          ✨ AI-POWERED TRANSFORMATION
        </div>
        <h1
          className="text-4xl md:text-5xl font-black gradient-text mb-3"
          style={{ fontFamily: "'Orbitron', sans-serif", lineHeight: 1.2 }}
        >
          Biến bạn thành
          <br />
          Siêu Anh Hùng
        </h1>
        <p className="text-gray-400 text-base max-w-xl mx-auto">
          Tải ảnh của bạn lên, nhập tên, và để Gemini AI biến bạn thành siêu anh hùng
          trong phong cách Marvel — giữ nguyên khuôn mặt của bạn!
        </p>
      </section>

      {/* ── Main Content: Two-column layout ────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Left: Input Panel */}
          <InputPanel
            onResult={handleResult}
            onLoading={setLoading}
          />

          {/* Right: Result Panel */}
          <ResultPanel
            result={result}
            loading={loading}
            userName={userName}
          />
        </div>

        {/* ── Log Viewer ──────────────────────────────────────────────── */}
        <div>
          <LogViewer />
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="text-center mt-12 py-6" style={{ borderTop: '1px solid rgba(124,58,237,0.1)' }}>
        <Text style={{ color: '#374151', fontSize: 12 }}>
          🦸 Superhero Generator · iFAgent Technical Challenge · Built with React + Ant Design + Gemini AI
        </Text>
      </footer>
    </div>
  )
}

export default App
