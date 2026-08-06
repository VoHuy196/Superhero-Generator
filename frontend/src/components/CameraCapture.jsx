import { useState, useRef, useCallback } from 'react'
import { Modal, Button, App } from 'antd'
import { CameraOutlined, ReloadOutlined, CheckOutlined } from '@ant-design/icons'

/**
 * CameraCapture Component
 * Opens a modal with live camera feed, allows user to take a photo
 * Uses getUserMedia API for browser camera access
 */
function CameraCapture({ open, onCapture, onCancel }) {
  const { message } = App.useApp()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [streaming, setStreaming] = useState(false)
  const [captured, setCaptured] = useState(null) // base64 preview
  const [loading, setLoading] = useState(false)

  // Start camera stream when modal opens
  const startCamera = useCallback(async () => {
    setLoading(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setStreaming(true)
      }
    } catch (err) {
      message.error(`Không thể truy cập camera: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setStreaming(false)
    setCaptured(null)
  }, [])

  // Take a snapshot from video
  const takeSnapshot = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    setCaptured(dataUrl)
    // Pause stream preview but keep it alive
  }, [])

  // Retake - clear captured and go back to live feed
  const retake = useCallback(() => {
    setCaptured(null)
  }, [])

  // Confirm capture and pass base64 back
  const confirmCapture = useCallback(() => {
    if (!captured) return
    onCapture(captured) // pass full data URL
    stopCamera()
    onCancel()
  }, [captured, onCapture, stopCamera, onCancel])

  // Handle modal open/close
  const handleAfterOpen = () => {
    setCaptured(null)
    startCamera()
  }
  const handleCancel = () => {
    stopCamera()
    onCancel()
  }

  return (
    <Modal
      title={
        <span className="flex items-center gap-2 text-purple-300 font-semibold text-lg">
          <CameraOutlined /> Chụp ảnh từ Camera
        </span>
      }
      open={open}
      onCancel={handleCancel}
      afterOpenChange={(visible) => { if (visible) handleAfterOpen() }}
      footer={null}
      width={680}
      centered
      destroyOnHidden
    >
      <div className="flex flex-col items-center gap-4 py-2">
        {/* Camera viewfinder */}
        <div
          className="relative rounded-xl overflow-hidden w-full"
          style={{
            background: '#0a0a12',
            border: '2px solid rgba(124,58,237,0.4)',
            boxShadow: '0 0 30px rgba(124,58,237,0.2)',
            aspectRatio: '4/3',
            maxHeight: 360,
          }}
        >
          {/* Live video feed */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: captured ? 'none' : 'block',
              transform: 'scaleX(-1)', // mirror effect
            }}
          />

          {/* Captured snapshot preview */}
          {captured && (
            <img
              src={captured}
              alt="Captured"
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
              }}
            />
          )}

          {/* Camera loading state */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="text-purple-300 text-center">
                <CameraOutlined style={{ fontSize: 40 }} />
                <p className="mt-2">Đang khởi động camera...</p>
              </div>
            </div>
          )}

          {/* Corner decorators */}
          <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-purple-400 rounded-tl" />
          <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-purple-400 rounded-tr" />
          <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-purple-400 rounded-bl" />
          <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-purple-400 rounded-br" />

          {/* Streaming indicator */}
          {streaming && !captured && (
            <div className="absolute top-3 right-12 flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white text-xs font-semibold">LIVE</span>
            </div>
          )}
        </div>

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Action buttons */}
        <div className="flex gap-3 w-full justify-center">
          {!captured ? (
            <Button
              type="primary"
              size="large"
              icon={<CameraOutlined />}
              onClick={takeSnapshot}
              disabled={!streaming}
              className="flex-1 h-12 text-base font-semibold"
              style={{ maxWidth: 220 }}
            >
              Chụp ảnh
            </Button>
          ) : (
            <>
              <Button
                size="large"
                icon={<ReloadOutlined />}
                onClick={retake}
                className="h-12 font-semibold"
                style={{ color: '#a78bfa', borderColor: 'rgba(124,58,237,0.4)', background: 'rgba(124,58,237,0.1)' }}
              >
                Chụp lại
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<CheckOutlined />}
                onClick={confirmCapture}
                className="flex-1 h-12 text-base font-semibold"
                style={{ maxWidth: 220 }}
              >
                Dùng ảnh này
              </Button>
            </>
          )}
        </div>

        <p className="text-gray-500 text-xs text-center">
          📷 Trình duyệt sẽ yêu cầu quyền truy cập camera. Ảnh chỉ được xử lý cục bộ.
        </p>
      </div>
    </Modal>
  )
}

export default CameraCapture
