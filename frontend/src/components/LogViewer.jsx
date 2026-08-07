import { useState, useEffect, useCallback } from 'react'
import { Card, Table, Tag, Button, Tooltip, Typography, Badge, Space, App } from 'antd'
import {
  ReloadOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons'


const { Text, Paragraph } = Typography
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : '')

/**
 * LogViewer Component
 * Displays all API request/response logs in a real-time updating table
 * Polls the /api/logs endpoint every 3 seconds
 */
function LogViewer() {
  const { message } = App.useApp()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  // Fetch logs from backend
  const fetchLogs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/logs`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setLogs(data.logs || [])
      setLastUpdated(new Date())
    } catch (err) {
      // Silently fail on polling errors (backend might not be up yet)
      if (!silent) message.warning('Không thể tải logs: ' + err.message)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  // Clear all logs
  const clearLogs = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/logs`, { method: 'DELETE' })
      setLogs([])
      message.success('Đã xóa tất cả logs')
    } catch {
      message.error('Không thể xóa logs')
    }
  }

  // Initial fetch + polling
  useEffect(() => {
    fetchLogs()
    if (!autoRefresh) return
    const interval = setInterval(() => fetchLogs(true), 3000)
    return () => clearInterval(interval)
  }, [fetchLogs, autoRefresh])

  // Table columns
  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 170,
      render: (val) => {
        const d = new Date(val)
        return (
          <Space direction="vertical" size={0}>
            <Text style={{ color: '#a78bfa', fontSize: 12, fontFamily: 'monospace' }}>
              {d.toLocaleDateString('vi-VN')}
            </Text>
            <Text style={{ color: '#6b7280', fontSize: 11, fontFamily: 'monospace' }}>
              {d.toLocaleTimeString('vi-VN')}
            </Text>
          </Space>
        )
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'httpStatus',
      key: 'httpStatus',
      width: 110,
      render: (status, record) => {
        const isSuccess = status >= 200 && status < 300
        return (
          <Space direction="vertical" size={2} align="center">
            <Tag
              icon={isSuccess ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
              color={isSuccess ? 'success' : 'error'}
              style={{ fontSize: 12, fontWeight: 700 }}
            >
              {status}
            </Tag>
            {record.error && (
              <Badge color="red" text={<Text style={{ color: '#ef4444', fontSize: 10 }}>Error</Text>} />
            )}
          </Space>
        )
      },
    },
    {
      title: 'Latency',
      dataIndex: 'latency',
      key: 'latency',
      width: 100,
      render: (ms) => {
        const secs = (ms / 1000).toFixed(1)
        const color = ms < 5000 ? '#10b981' : ms < 15000 ? '#f59e0b' : '#ef4444'
        return (
          <Text style={{ color, fontFamily: 'monospace', fontWeight: 600 }}>
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            {secs}s
          </Text>
        )
      },
    },
    {
      title: 'Prompt gửi API',
      dataIndex: 'prompt',
      key: 'prompt',
      render: (prompt) => (
        <Tooltip
          title={<pre style={{ whiteSpace: 'pre-wrap', maxWidth: 500, color: '#e2e8f0', margin: 0, fontSize: 12 }}>{prompt}</pre>}
          color="#1a1a2e"
        >
          <Text
            style={{ color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}
            ellipsis={{ tooltip: false }}
          >
            <FileTextOutlined style={{ marginRight: 4, color: '#7c3aed' }} />
            {prompt?.substring(0, 80)}...
          </Text>
        </Tooltip>
      ),
    },
    {
      title: 'Lỗi',
      dataIndex: 'error',
      key: 'error',
      width: 200,
      render: (err) =>
        err ? (
          <Tooltip title={err} color="#1a1a2e">
            <Text style={{ color: '#ef4444', fontSize: 12 }} ellipsis>
              ⚠️ {err.substring(0, 50)}{err.length > 50 ? '...' : ''}
            </Text>
          </Tooltip>
        ) : (
          <Text style={{ color: '#10b981', fontSize: 12 }}>–</Text>
        ),
    },
  ]

  return (
    <Card
      title={
        <div className="flex items-center justify-between w-full">
          <span className="flex items-center gap-2">
            <span className="gradient-text font-bold text-lg">📋 System Logs</span>
            <Badge
              count={logs.length}
              style={{ backgroundColor: '#7c3aed' }}
              showZero
            />
            {autoRefresh && (
              <Badge
                color="green"
                text={<span style={{ color: '#10b981', fontSize: 11 }}>live</span>}
              />
            )}
          </span>
          <Space>
            {lastUpdated && (
              <Text style={{ color: '#6b7280', fontSize: 11 }}>
                Cập nhật: {lastUpdated.toLocaleTimeString('vi-VN')}
              </Text>
            )}
            <Tooltip title={autoRefresh ? 'Tắt auto-refresh' : 'Bật auto-refresh'}>
              <Button
                size="small"
                type={autoRefresh ? 'primary' : 'default'}
                icon={<ReloadOutlined spin={autoRefresh} />}
                onClick={() => setAutoRefresh(v => !v)}
                style={autoRefresh ? {} : { color: '#6b7280', borderColor: 'rgba(124,58,237,0.3)' }}
              />
            </Tooltip>
            <Tooltip title="Refresh ngay">
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={() => fetchLogs()}
                loading={loading}
                style={{ color: '#a78bfa', borderColor: 'rgba(124,58,237,0.4)', background: 'rgba(124,58,237,0.1)' }}
              />
            </Tooltip>
            <Tooltip title="Xóa tất cả logs">
              <Button
                size="small"
                icon={<DeleteOutlined />}
                onClick={clearLogs}
                danger
                disabled={logs.length === 0}
              />
            </Tooltip>
          </Space>
        </div>
      }
    >
      <Table
        dataSource={logs}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 8,
          showSizeChanger: false,
          showTotal: (total) => (
            <span style={{ color: '#6b7280' }}>{total} request{total !== 1 ? 's' : ''}</span>
          ),
        }}
        size="small"
        locale={{
          emptyText: (
            <div className="py-8 text-center" style={{ color: '#6b7280' }}>
              <ClockCircleOutlined style={{ fontSize: 32, marginBottom: 8, display: 'block' }} />
              Chưa có logs. Thử generate một ảnh để xem logs xuất hiện ở đây.
            </div>
          ),
        }}
        scroll={{ x: 700 }}
      />
    </Card>
  )
}

export default LogViewer
