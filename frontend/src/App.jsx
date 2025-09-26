import { useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [username, setUsername] = useState('')

  const handleRequest = async () => {
    if (!username.trim()) {
      alert('Please enter a username')
      return
    }

    try {
      const response = await axios.get(`http://localhost:8000/api/user/${username}`)
      console.log('Response data:', response.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  return (
    <>
      <h1>Instagram Dashboard</h1>
      <div className="card">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter Instagram username"
          style={{ marginRight: '10px', padding: '8px' }}
        />
        <button onClick={handleRequest}>
          Get User Data
        </button>
      </div>
    </>
  )
}

export default App
