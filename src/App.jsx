import { useState } from 'react'
import './App.css'

const notes = [
  { key: 'A', note: 'C' },
  { key: 'S', note: 'D' },
  { key: 'D', note: 'E' },
  { key: 'F', note: 'F' },
  { key: 'G', note: 'G' },
  { key: 'H', note: 'A' },
  { key: 'J', note: 'B' },
]

function App() {
  const [score, setScore] = useState(0)
  const [lastNote, setLastNote] = useState('')

  const playNote = (note) => {
    setLastNote(note)
    setScore(score + 10)
  }

  return (
    <main className="app">
      <section className="hero">
        <p className="badge">Built for OPN Builders Season 1</p>

        <h1>Piano Quest</h1>

        <p className="tagline">
          Play piano notes, complete quests, and build your rhythm on OPN Chain.
        </p>

        <div className="stats">
          <div>
            <span>Score</span>
            <strong>{score}</strong>
          </div>

          <div>
            <span>Last note</span>
            <strong>{lastNote || 'None'}</strong>
          </div>
        </div>

        <div className="piano">
          {notes.map((item) => (
            <button
              key={item.note}
              className="piano-key"
              onClick={() => playNote(item.note)}
            >
              <span>{item.note}</span>
              <small>{item.key}</small>
            </button>
          ))}
        </div>

        <p className="instruction">
          Click any piano key to earn points. This is the first demo version of
          Piano Quest.
        </p>
      </section>
    </main>
  )
}

export default App