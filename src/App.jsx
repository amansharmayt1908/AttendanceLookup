import { useState } from 'react'
import './App.css'
import Days from './Components/days'
import SubjectAttendance from './Components/SubjectAttendance'

function App() {
  const [mode, setMode] = useState('daily'); // 'daily' or 'subject'

  return (
    <div className='container'>
      <div className="heading">
        <h1>Attendance Lookup</h1>
        <div className="mode-switch">
          <button 
            className={`mode-button ${mode === 'daily' ? 'active' : ''}`}
            onClick={() => setMode('daily')}
          >
            Daily Attendance
          </button>
          <button 
            className={`mode-button ${mode === 'subject' ? 'active' : ''}`}
            onClick={() => setMode('subject')}
          >
            Subject-wise Attendance
          </button>
        </div>
      </div>
      {mode === 'daily' ? <Days /> : <SubjectAttendance />}
    </div>
  )
}

export default App

