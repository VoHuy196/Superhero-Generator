import { useState, useCallback } from 'react'
import {
  Card, Form, Input, Button, Upload, Space, Typography, Divider, Tooltip, App,
} from 'antd'
import {
  UserOutlined,
  UploadOutlined,
  CameraOutlined,
  ThunderboltOutlined,
  InboxOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import CameraCapture from './CameraCapture'

const { Dragger } = Upload
const { Text } = Typography
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : '')

/**
 * Convert File to base64 string (without data URL prefix)
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      // Strip "data:image/xxx;base64," prefix
      const base64 = reader.result.split(',')[1]
      resolve({ base64, mimeType: file.type })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Convert data URL to base64 + mimeType
 */
function dataUrlToBase64(dataUrl) {
  const [header, base64] = dataUrl.split(',')
  const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg'
  return { base64, mimeType }
}

/**
 * InputPanel Component
 * Form for name input + image selection (upload or camera)
 * Handles API call to backend and returns result to parent
 */
function InputPanel({ onResult, onLoading }) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [imagePreview, setImagePreview] = useState(null) // data URL for preview
  const [imageData, setImageData] = useState(null)       // { base64, mimeType }
  const [cameraOpen, setCameraOpen] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Handle file upload via Dragger
  const handleUpload = useCallback(async (file) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      message.error('Chỉ hỗ trợ file ảnh (JPG, PNG, WEBP)')
      return false
    }
    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      message.error('Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 10MB')
      return false
    }

    try {
      const { base64, mimeType } = await fileToBase64(file)
      setImageData({ base64, mimeType })
      setImagePreview(URL.createObjectURL(file))
      message.success(`Đã tải lên: ${file.name}`)
    } catch {
      message.error('Không thể đọc file ảnh')
    }
    return false // prevent default upload behavior
  }, [])

  // Handle camera capture result
  const handleCameraCapture = useCallback((dataUrl) => {
    const { base64, mimeType } = dataUrlToBase64(dataUrl)
    setImageData({ base64, mimeType })
    setImagePreview(dataUrl)
    setCameraOpen(false)
    message.success('Đã chụp ảnh từ camera!')
  }, [])

  // Clear selected image
  const clearImage = useCallback(() => {
    setImageData(null)
    setImagePreview(null)
  }, [])

  // Submit: call backend API
  const handleGenerate = async () => {
    try {
      await form.validateFields()
    } catch {
      return // form validation failed
    }

    if (!imageData) {
      message.warning('Vui lòng chọn hoặc chụp ảnh trước!')
      return
    }

    const name = form.getFieldValue('name')?.trim()
    setGenerating(true)
    onLoading(true)

    try {
      message.loading({ content: 'Đang gửi lên Gemini AI...', key: 'generate', duration: 0 })

      const res = await fetch(`${BACKEND_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageData.base64,
          mimeType: imageData.mimeType,
          name,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || `HTTP Error ${res.status}`)
      }

      message.success({ content: '🦸 Siêu anh hùng đã được tạo!', key: 'generate', duration: 3 })
      onResult(data, name)

    } catch (err) {
      message.error({ content: `Lỗi: ${err.message}`, key: 'generate', duration: 5 })
      onResult(null, name)
    } finally {
      setGenerating(false)
      onLoading(false)
    }
  }

  return (
    <>
      <Card
        title={
          <span className="flex items-center gap-2">
            <ThunderboltOutlined style={{ color: '#f59e0b' }} />
            <span className="gradient-text font-bold text-xl">Tạo Siêu Anh Hùng</span>
          </span>
        }
        style={{ minHeight: 480 }}
      >
        <Form form={form} layout="vertical" requiredMark={false}>

          {/* Name field */}
          <Form.Item
            name="name"
            label="Tên của bạn"
            rules={[
              { required: true, message: 'Vui lòng nhập tên!' },
              { min: 2, message: 'Tên phải có ít nhất 2 ký tự' },
              { max: 30, message: 'Tên tối đa 30 ký tự' },
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#7c3aed' }} />}
              placeholder="Nhập tên của bạn..."
              size="large"
              maxLength={30}
              showCount
            />
          </Form.Item>

          {/* Image selection */}
          <Form.Item label="Ảnh đại diện">
            {imagePreview ? (
              /* Image preview state */
              <div className="relative">
                  <div
                    className="relative rounded-xl overflow-hidden flex items-center justify-center p-2"
                    style={{
                      background: '#0a0a16',
                      border: '2px solid rgba(124,58,237,0.4)',
                      boxShadow: '0 0 20px rgba(124,58,237,0.2)',
                      minHeight: 200,
                      maxHeight: 360,
                    }}
                  >
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-full max-h-[340px] w-auto h-auto object-contain rounded-lg"
                    />
                    {/* Success badge */}
                    <div className="absolute top-2 left-2 z-10">
                      <span
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md"
                        style={{ background: 'rgba(16,185,129,0.25)', border: '1px solid #10b981', color: '#10b981' }}
                      >
                        <CheckCircleOutlined /> Ảnh đã chọn
                      </span>
                    </div>
                  </div>
                <Button
                  icon={<CloseCircleOutlined />}
                  onClick={clearImage}
                  size="small"
                  danger
                  className="mt-2 w-full"
                  style={{ borderRadius: 8 }}
                >
                  Xóa ảnh và chọn lại
                </Button>
              </div>
            ) : (
              /* Upload / Camera selection */
              <div className="flex flex-col gap-3">
                {/* Dragger upload */}
                <Dragger
                  accept="image/*"
                  beforeUpload={handleUpload}
                  showUploadList={false}
                  multiple={false}
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined style={{ fontSize: 36 }} />
                  </p>
                  <p className="ant-upload-text text-base">
                    Kéo thả ảnh vào đây
                  </p>
                  <p className="ant-upload-hint">
                    Hỗ trợ JPG, PNG, WEBP (tối đa 10MB)
                  </p>
                </Dragger>

                <Divider style={{ borderColor: 'rgba(124,58,237,0.2)', margin: '4px 0' }}>
                  <Text style={{ color: '#6b7280', fontSize: 12 }}>hoặc</Text>
                </Divider>

                {/* Camera button */}
                <Button
                  size="large"
                  icon={<CameraOutlined />}
                  onClick={() => setCameraOpen(true)}
                  className="w-full h-12 font-semibold"
                  style={{
                    background: 'rgba(124,58,237,0.1)',
                    border: '1px solid rgba(124,58,237,0.4)',
                    color: '#a78bfa',
                    borderRadius: 10,
                  }}
                >
                  📷 Bật Camera &amp; Chụp ảnh
                </Button>
              </div>
            )}
          </Form.Item>

          {/* Generate button */}
          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Tooltip
              title={!imagePreview ? 'Cần chọn ảnh trước' : ''}
              placement="top"
            >
              <Button
                type="primary"
                size="large"
                icon={<ThunderboltOutlined />}
                onClick={handleGenerate}
                loading={generating}
                disabled={generating}
                className={`w-full h-14 text-lg font-bold ${!generating ? 'btn-generate' : ''}`}
                style={{ borderRadius: 12, letterSpacing: 1 }}
              >
                {generating ? 'Đang tạo siêu anh hùng...' : '⚡ Generate Superhero'}
              </Button>
            </Tooltip>
          </Form.Item>

          {/* Hint text */}
          <div className="mt-3 text-center">
            <Text style={{ color: '#4b5563', fontSize: 12 }}>
              🤖 Powered by Gemini 2.5 Flash Image (&quot;Nano Banana&quot;) · Giữ nguyên khuôn mặt
            </Text>
          </div>
        </Form>
      </Card>

      {/* Camera modal */}
      <CameraCapture
        open={cameraOpen}
        onCapture={handleCameraCapture}
        onCancel={() => setCameraOpen(false)}
      />
    </>
  )
}

export default InputPanel
