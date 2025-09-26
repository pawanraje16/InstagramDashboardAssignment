import { useState } from 'react'
import axios from 'axios'
import LandingPage from './components/LandingPage'
import DashboardPage from './components/DashboardPage'
import { demoUserData } from './data/demoData'

function App() {
  const [currentView, setCurrentView] = useState('landing')
  const [userData, setUserData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleUserSearch = async (username) => {
    setIsLoading(true)

    try {
      if (username === 'demo') {
        setUserData(demoUserData)
        setCurrentView('dashboard')
        return
      }

      const response = await axios.get(`http://localhost:8000/api/user/${username}`)
      console.log('Response data:', response.data)

      if (response.data) {
        setUserData(response.data)
        setCurrentView('dashboard')
      }
    } catch (error) {
      console.error('Error fetching data:', error)

      setUserData(demoUserData)
      setCurrentView('dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToHome = () => {
    setCurrentView('landing')
    setUserData(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Analyzing Instagram profile...</p>
          <p className="text-gray-400 text-sm mt-2">This may take a few moments</p>
        </div>
      </div>
    )
  }

  return (
    <div className="App">
      {currentView === 'landing' ? (
        <LandingPage onUserSearch={handleUserSearch} />
      ) : (
        <DashboardPage
          userData={userData}
          onBackToHome={handleBackToHome}
          onNewSearch={handleUserSearch}
        />
      )}
    </div>
  )
}

export default App
