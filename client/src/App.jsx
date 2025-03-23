import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

// Language options with their display names and codes
const LANGUAGES = {
  english: { name: 'English', code: 'en' },
  bosnian: { name: 'Bosanski/Srpski/Hrvatski', code: 'bs' },
  german: { name: 'Deutsch', code: 'de' },
  french: { name: 'Français', code: 'fr' },
  spanish: { name: 'Español', code: 'es' },
  italian: { name: 'Italiano', code: 'it' },
  turkish: { name: 'Türkçe', code: 'tr' },
  chinese: { name: '中文', code: 'zh' },
  russian: { name: 'Русский', code: 'ru' },
  arabic: { name: 'العربية', code: 'ar' }
}

// Title animation configuration
const TITLE_VARIANTS = {
  initial: {
    opacity: 0,
    y: -20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: {
      duration: 0.3,
      ease: "easeIn"
    }
  }
}

function App() {
  const [url, setUrl] = useState('')
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [titleText, setTitleText] = useState('AI News Summarizer')
  const [isAnimating, setIsAnimating] = useState(false)
  const [language, setLanguage] = useState('english')
  const [summaryLength, setSummaryLength] = useState('medium')
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first, then system preference, default to true if neither exists
    const stored = localStorage.getItem('darkMode')
    if (stored !== null) return stored === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const [recentSummaries, setRecentSummaries] = useState([])
  const [copySuccess, setCopySuccess] = useState('')

  // Effect to handle dark mode changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
    localStorage.setItem('darkMode', isDarkMode)
  }, [isDarkMode])

  // Load recent summaries from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('recentSummaries')
    if (saved) {
      setRecentSummaries(JSON.parse(saved))
    }
  }, [])

  // Save recent summaries to localStorage
  useEffect(() => {
    localStorage.setItem('recentSummaries', JSON.stringify(recentSummaries))
  }, [recentSummaries])

  // Reset copy success message
  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => setCopySuccess(''), 2000)
      return () => clearTimeout(timer)
    }
  }, [copySuccess])

  // Smooth title animation effect
  useEffect(() => {
    const titles = ['AI News Summarizer', 'Smart Article Summary', 'News Insights AI']
    let currentIndex = 0
    
    const animateTitle = async () => {
      if (isAnimating) return
      
      setIsAnimating(true)
      
      // Wait for 5 seconds before starting the next animation
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      currentIndex = (currentIndex + 1) % titles.length
      setTitleText(titles[currentIndex])
      setIsAnimating(false)
    }

    const intervalId = setInterval(animateTitle, 5500) // Slightly longer than the wait to ensure smooth transitions

    return () => clearInterval(intervalId)
  }, [isAnimating])

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess('Copied to clipboard!')
    } catch (err) {
      setCopySuccess('Failed to copy')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSummary('')
    setCopySuccess('')

    try {
      const response = await fetch('https://ai-news-summarizer-production.up.railway.app/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          language,
          length: summaryLength
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to generate summary')
      }

      setSummary(data.summary)
      
      // Add to recent summaries
      setRecentSummaries(prev => {
        const newSummaries = [
          { 
            url, 
            summary: data.summary, 
            timestamp: new Date().toISOString(),
            language 
          },
          ...prev
        ].slice(0, 5) // Keep only the 5 most recent
        return newSummaries
      })
    } catch (err) {
      setError(err.message || 'Failed to generate summary. Please try again.')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full">
      {/* Fixed Background */}
      <div className={`fixed inset-0 w-full h-full ${
        isDarkMode 
          ? 'bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800' 
          : 'bg-gradient-to-br from-blue-100 via-blue-50 to-blue-200'
      } transition-all duration-300`} />

      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-10">
        <motion.button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`p-3 rounded-full transition-all duration-500 ease-in-out shadow-lg
            ${isDarkMode 
              ? 'bg-blue-800 hover:bg-blue-700' 
              : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
            } transform hover:scale-110`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.span 
            className="block text-xl"
            initial={false}
            animate={{ rotate: isDarkMode ? 0 : 180 }}
            transition={{ duration: 0.5 }}
          >
            {isDarkMode ? '🌙' : '☀️'}
          </motion.span>
        </motion.button>
      </div>

      {/* Main Content */}
      <div className="relative min-h-screen flex items-center justify-center">
        <div className="w-full max-w-4xl mx-auto px-4 ml-[600px] py-16">
          {/* Header with smooth animation */}
          <AnimatePresence mode="wait">
            <motion.h1 
              key={titleText}
              variants={TITLE_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              className={`text-5xl font-bold text-center mb-8 font-poppins
                ${isDarkMode 
                  ? 'text-white' 
                  : 'text-blue-900'}`}
            >
              {titleText}
            </motion.h1>
          </AnimatePresence>
          
          <motion.div
            className={`mb-8 text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-lg">Enter a news article URL and let AI create a concise summary for you.</p>
          </motion.div>

          {/* Main Form */}
          <motion.form 
            onSubmit={handleSubmit} 
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {/* URL Input */}
            <div>
              <label htmlFor="url" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                News Article URL
              </label>
              <div className="mt-1">
                <input
                  type="url"
                  id="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className={`appearance-none block w-full px-4 py-3 border
                    rounded-xl shadow-sm ${isDarkMode 
                      ? 'bg-blue-900/50 border-white/10 text-white placeholder-gray-400' 
                      : 'bg-white/70 border-blue-200 text-gray-900 placeholder-gray-500'
                    } backdrop-blur-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500 
                    focus:border-transparent transition-all duration-200`}
                  placeholder="https://example.com/news-article"
                />
              </div>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Language Selection */}
              <div>
                <label htmlFor="language" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Summary Language
                </label>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className={`mt-1 block w-full px-4 py-3 text-base rounded-xl
                    ${isDarkMode 
                      ? 'bg-blue-900/50 border-white/10 text-white' 
                      : 'bg-white/70 border-blue-200 text-gray-900'
                    } backdrop-blur-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500 
                    focus:border-transparent transition-all duration-200`}
                >
                  {Object.entries(LANGUAGES).map(([key, { name }]) => (
                    <option key={key} value={key} className={isDarkMode ? 'bg-blue-900' : 'bg-white'}>{name}</option>
                  ))}
                </select>
              </div>

              {/* Summary Length */}
              <div>
                <label htmlFor="summaryLength" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Summary Length
                </label>
                <select
                  id="summaryLength"
                  value={summaryLength}
                  onChange={(e) => setSummaryLength(e.target.value)}
                  className={`mt-1 block w-full px-4 py-3 text-base rounded-xl
                    ${isDarkMode 
                      ? 'bg-blue-900/50 border-white/10 text-white' 
                      : 'bg-white/70 border-blue-200 text-gray-900'
                    } backdrop-blur-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500 
                    focus:border-transparent transition-all duration-200`}
                >
                  <option value="short" className={isDarkMode ? 'bg-blue-900' : 'bg-white'}>Short</option>
                  <option value="medium" className={isDarkMode ? 'bg-blue-900' : 'bg-white'}>Medium</option>
                  <option value="detailed" className={isDarkMode ? 'bg-blue-900' : 'bg-white'}>Detailed</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-3 px-6 rounded-xl shadow-lg
                text-base font-medium text-white transition-all duration-300
                ${loading 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : isDarkMode
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600'
                } transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating Summary...
                </div>
              ) : 'Generate Summary'}
            </button>
          </motion.form>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div 
                className={`mt-6 p-4 rounded-xl ${
                  isDarkMode 
                    ? 'bg-red-900/20 border border-red-500/30' 
                    : 'bg-red-50 border border-red-200'
                } backdrop-blur-sm`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-sm text-red-400">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Copy Success Message */}
          <AnimatePresence>
            {copySuccess && (
              <motion.div 
                className={`fixed bottom-4 right-4 p-4 rounded-xl ${
                  isDarkMode 
                    ? 'bg-green-900/20 border border-green-500/30' 
                    : 'bg-green-50 border border-green-200'
                } backdrop-blur-sm`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-sm text-green-400">{copySuccess}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Summary Result */}
          <AnimatePresence>
            {summary && (
              <motion.div 
                className={`mt-8 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Summary ({LANGUAGES[language].name})
                  </h2>
                  <button
                    onClick={() => handleCopy(summary)}
                    className={`px-4 py-2 rounded-lg text-sm ${
                      isDarkMode 
                        ? 'bg-blue-900/50 hover:bg-blue-800/50 text-gray-300 border border-white/10' 
                        : 'bg-white/70 hover:bg-white/80 text-gray-700 border border-blue-200'
                    } backdrop-blur-sm transition-all duration-200 transform hover:scale-105`}
                  >
                    Copy
                  </button>
                </div>
                <div className={`rounded-xl ${
                  isDarkMode 
                    ? 'bg-blue-900/50 border border-white/10' 
                    : 'bg-white/70 border border-blue-200'
                } backdrop-blur-sm shadow-lg overflow-hidden`}>
                  <div className="px-6 py-5">
                    <p className={`leading-relaxed whitespace-pre-line ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {summary}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recent Summaries */}
          {recentSummaries.length > 0 && (
            <motion.div
              className={`mt-12 space-y-6 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-4`}>
                Recent Summaries
              </h2>
              <div className="space-y-4">
                {recentSummaries.map((item, index) => (
                  <div
                    key={index}
                    className={`p-5 rounded-xl ${
                      isDarkMode 
                        ? 'bg-blue-900/50 border border-white/10 hover:bg-blue-800/50' 
                        : 'bg-white/70 border border-blue-200 hover:bg-white/80'
                    } backdrop-blur-sm transition-all duration-300`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {new Date(item.timestamp).toLocaleString()} • {LANGUAGES[item.language]?.name || 'English'}
                      </p>
                      <button
                        onClick={() => handleCopy(item.summary)}
                        className={`px-3 py-1 rounded-lg text-xs ${
                          isDarkMode 
                            ? 'bg-blue-900/50 hover:bg-blue-800/50 text-gray-300 border border-white/10' 
                            : 'bg-white/70 hover:bg-white/80 text-gray-700 border border-blue-200'
                        } backdrop-blur-sm transition-all duration-200`}
                      >
                        Copy
                      </button>
                    </div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm mb-2 block transition-colors duration-200"
                    >
                      {item.url}
                    </a>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {item.summary}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Footer */}
          <footer className={`mt-12 pt-8 border-t ${isDarkMode ? 'border-white/10' : 'border-blue-200'}`}>
            <p className={`text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Made with ❤️ using React, Tailwind & OpenAI API |{' '}
              <a
                href="https://github.com/Halilovic35"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
              >
                @Halilovic35
              </a>
            </p>
          </footer>
        </div>
      </div>
    </div>
  )
}

export default App
