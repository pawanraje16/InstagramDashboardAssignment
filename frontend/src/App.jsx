import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import LandingPage from './components/LandingPage'
import DashboardPage from './components/DashboardPage'
import { fetchUserDashboard, clearUserData } from './store/slices/userSlice'

function App() {
  const [currentView, setCurrentView] = useState('landing')
  const dispatch = useDispatch()
  const { loading, error, currentUser } = useSelector((state) => state.user)

  const handleUserSearch = async (username) => {
    try {
      console.log('🔍 App: Starting search for:', username);
      const result = await dispatch(fetchUserDashboard(username)).unwrap();
      console.log('🔍 App: Search completed, result:', result);
      setCurrentView('dashboard');
    } catch (error) {
      console.error('❌ App: Error fetching user data:', error);
      // You can show error message here or stay on landing page
    }
  }

  const handleBackToHome = () => {
    setCurrentView('landing')
    dispatch(clearUserData())
  }

  if (loading) {
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
        <LandingPage
          onUserSearch={handleUserSearch}
          error={error}
        />
      ) : (
        <DashboardPage
          onBackToHome={handleBackToHome}
          onNewSearch={handleUserSearch}
        />
      )}
    </div>
  )
}

export default App
