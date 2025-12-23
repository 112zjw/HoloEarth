import { useState } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import './UI.css'

function UI() {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showApiKeyInput, setShowApiKeyInput] = useState(true)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!query.trim() || !apiKey) return

    setLoading(true)
    setResponse('')

    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

      const prompt = `关于地球的问题: ${query}\n\n请提供详细的地理、生态或人文知识相关的回答。`
      const result = await model.generateContent(prompt)
      const text = result.response.text()
      setResponse(text)
    } catch (error) {
      setResponse(`错误: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleApiKeySubmit = (e) => {
    e.preventDefault()
    if (apiKey.trim()) {
      setShowApiKeyInput(false)
    }
  }

  return (
    <div className="ui-container">
      <div className="header">
        <h1>🌍 HoloEarth</h1>
        <p>全息地球探索界面</p>
      </div>

      {showApiKeyInput ? (
        <div className="api-key-panel">
          <h3>配置 Gemini API Key</h3>
          <form onSubmit={handleApiKeySubmit}>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="输入您的 Gemini API Key"
              className="api-key-input"
            />
            <button type="submit" className="submit-btn">
              开始探索
            </button>
          </form>
          <p className="hint">
            获取 API Key: <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a>
          </p>
        </div>
      ) : (
        <div className="query-panel">
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="询问关于地球的任何问题..."
              className="query-input"
              disabled={loading}
            />
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? '思考中...' : '提问'}
            </button>
          </form>
          <button 
            className="reset-api-btn"
            onClick={() => setShowApiKeyInput(true)}
          >
            重新配置 API Key
          </button>
        </div>
      )}

      {response && (
        <div className="response-panel">
          <h3>AI 回答:</h3>
          <div className="response-text">{response}</div>
        </div>
      )}

      <div className="instructions">
        <h3>使用说明:</h3>
        <ul>
          <li>🖱️ 拖动鼠标旋转地球</li>
          <li>🔍 滚轮缩放视图</li>
          <li>💬 输入问题，探索地球知识</li>
        </ul>
      </div>
    </div>
  )
}

export default UI
