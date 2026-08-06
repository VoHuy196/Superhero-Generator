import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider, App as AntdApp, theme } from 'antd'
import App from './App.jsx'
import './index.css'

// Ant Design dark theme configuration
const darkTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#7c3aed',
    colorLink: '#a78bfa',
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#06b6d4',
    colorBgBase: '#0f0f1a',
    colorTextBase: '#e2e8f0',
    borderRadius: 10,
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  components: {
    Button: {
      colorPrimary: '#7c3aed',
      algorithm: true,
    },
    Card: {
      colorBgContainer: 'rgba(26, 26, 46, 0.8)',
    },
    Table: {
      colorBgContainer: 'transparent',
    },
  },
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider theme={darkTheme}>
      <AntdApp>
        <App />
      </AntdApp>
    </ConfigProvider>
  </React.StrictMode>,
)
