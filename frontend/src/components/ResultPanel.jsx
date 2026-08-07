import { useState, useRef, useEffect } from 'react'
import { Card, Button, Spin, Empty, Typography, Tag, Tooltip, App } from 'antd'
import {
  DownloadOutlined,
  ThunderboltOutlined,
  ReloadOutlined,
  StarOutlined,
} from '@ant-design/icons'

const { Text } = Typography

/**
 * ResultPanel Component
 * Displays the generated superhero image with name watermark overlay
 * Uses Canvas API to draw the user's name on top of the image
 */
function ResultPanel({ result, loading, userName }) {
  const { message } = App.useApp()
  const canvasRef = useRef(null)
  const [canvasReady, setCanvasReady] = useState(false)

  // Draw watermark on canvas whenever result or userName changes
  useEffect(() => {
    if (!result?.imageBase64 || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Set canvas to image dimensions
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight

      // Draw the base image
      ctx.drawImage(img, 0, 0)

      // ── Watermark: Name Overlay ──────────────────────────────────────
      if (userName) {
        const text = `⚡ ${userName.toUpperCase()} ⚡`
        const fontSize = Math.max(28, Math.floor(canvas.width * 0.045))

        ctx.save()

        // Dark translucent banner at bottom
        const bannerH = fontSize * 2.8
        const bannerY = canvas.height - bannerH
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
        ctx.fillRect(0, bannerY, canvas.width, bannerH)

        // Gradient overlay on banner
        const grad = ctx.createLinearGradient(0, bannerY, canvas.width, bannerY)
        grad.addColorStop(0, 'rgba(124, 58, 237, 0.4)')
        grad.addColorStop(0.5, 'rgba(6, 182, 212, 0.2)')
        grad.addColorStop(1, 'rgba(124, 58, 237, 0.4)')
        ctx.fillStyle = grad
        ctx.fillRect(0, bannerY, canvas.width, bannerH)

        // Text settings
        ctx.font = `900 ${fontSize}px 'Orbitron', 'Impact', sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        const textX = canvas.width / 2
        const textY = bannerY + bannerH / 2

        // Outer glow (cyan)
        ctx.shadowColor = '#06b6d4'
        ctx.shadowBlur = 20
        ctx.fillStyle = 'rgba(6, 182, 212, 0.3)'
        ctx.fillText(text, textX, textY)

        // Inner glow (purple)
        ctx.shadowColor = '#a78bfa'
        ctx.shadowBlur = 12
        ctx.fillStyle = '#ffffff'
        ctx.fillText(text, textX, textY)

        // Thin white stroke for crispness
        ctx.shadowBlur = 0
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'
        ctx.lineWidth = 1
        ctx.strokeText(text, textX, textY)

        ctx.restore()
      }

      setCanvasReady(true)
    }

    img.onerror = () => {
      message.error('Không thể tải ảnh kết quả')
    }

    img.src = `data:${result.mimeType};base64,${result.imageBase64}`
  }, [result, userName])

  // Download the canvas as PNG
  const handleDownload = () => {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = `superhero_${userName || 'hero'}_${Date.now()}.png`
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
    message.success('Đã tải xuống ảnh siêu anh hùng!')
  }

  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          <StarOutlined style={{ color: '#f59e0b' }} />
          <span className="gradient-text font-bold text-xl">Kết quả</span>
        </span>
      }
      className="h-full"
      style={{ minHeight: 480 }}
    >
      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center gap-6 py-16">
          <div className="relative">
            <Spin size="large" />
            <div
              className="absolute inset-0 rounded-full animate-ping"
              style={{ background: 'rgba(124,58,237,0.2)', margin: -8 }}
            />
          </div>
          <div className="text-center">
            <Text className="gradient-text text-lg font-semibold block">
              ✨ Đang tạo siêu anh hùng...
            </Text>
            <div className="flex flex-col gap-1 mt-2">
              <Text type="secondary" className="text-xs">
                🍌 Nano Banana Pro (Gemini 3 Pro Image) đang xử lý...
              </Text>
              <Text type="secondary" className="text-xs">
                🎨 Giữ nguyên khuôn mặt &amp; biến đổi thành Superhero...
              </Text>
              <Text style={{ color: '#4b5563', fontSize: 11 }}>
                (Có thể mất 10–30 giây)
              </Text>
            </div>
          </div>

          {/* Shimmer placeholder */}
          <div
            className="w-full rounded-xl shimmer-loading"
            style={{ height: 280, border: '1px solid rgba(124,58,237,0.2)' }}
          />
        </div>
      )}

      {/* Empty state */}
      {!loading && !result && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(124,58,237,0.1)', border: '2px dashed rgba(124,58,237,0.3)' }}
          >
            <ThunderboltOutlined style={{ fontSize: 40, color: 'rgba(124,58,237,0.5)' }} />
          </div>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span className="text-gray-500">
                Nhập tên và chọn ảnh, sau đó nhấn{' '}
                <span className="text-purple-400 font-semibold">Generate Superhero</span>
              </span>
            }
          />
        </div>
      )}

      {/* Result image with canvas watermark */}
      {!loading && result && (
        <div className="flex flex-col gap-4">
          {/* Latency + provider badge */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Tag color="purple" icon={<ThunderboltOutlined />}>
              {result.latency ? `${(result.latency / 1000).toFixed(1)}s` : '–'}
            </Tag>
            <Tag color="success">✅ Tạo thành công</Tag>
            {result.provider && (
              <Tag color="blue" style={{ fontSize: 10, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                🤖 {result.provider}
              </Tag>
            )}
          </div>

          {/* Canvas with watermarked image */}
          <div
            className="relative rounded-xl overflow-hidden"
            style={{
              border: '2px solid rgba(124,58,237,0.4)',
              boxShadow: '0 0 40px rgba(124,58,237,0.3)',
            }}
          >
            <canvas
              ref={canvasRef}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                opacity: canvasReady ? 1 : 0,
                transition: 'opacity 0.5s ease',
              }}
            />
            {!canvasReady && (
              <div className="absolute inset-0 shimmer-loading" style={{ minHeight: 280 }} />
            )}
          </div>

          {/* Download button */}
          <div className="flex gap-3">
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              size="large"
              onClick={handleDownload}
              className="flex-1 h-11 font-semibold"
              disabled={!canvasReady}
            >
              Tải xuống ảnh
            </Button>
            <Tooltip title="Tạo lại">
              <Button
                size="large"
                icon={<ReloadOutlined />}
                className="h-11"
                style={{ color: '#a78bfa', borderColor: 'rgba(124,58,237,0.4)', background: 'rgba(124,58,237,0.1)' }}
                onClick={() => window.dispatchEvent(new CustomEvent('regenerate'))}
              />
            </Tooltip>
          </div>
        </div>
      )}
    </Card>
  )
}

export default ResultPanel
