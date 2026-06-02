import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const whiteNotes = [
  { note: 'C4', label: 'C', key: 'A', freq: 261.63 },
  { note: 'D4', label: 'D', key: 'S', freq: 293.66 },
  { note: 'E4', label: 'E', key: 'D', freq: 329.63 },
  { note: 'F4', label: 'F', key: 'F', freq: 349.23 },
  { note: 'G4', label: 'G', key: 'G', freq: 392.0 },
  { note: 'A4', label: 'A', key: 'H', freq: 440.0 },
  { note: 'B4', label: 'B', key: 'J', freq: 493.88 },
  { note: 'C5', label: 'C', key: 'K', freq: 523.25 },
]

const blackNotes = [
  { note: 'C#4', label: 'C#', key: 'W', freq: 277.18, left: 9.5 },
  { note: 'D#4', label: 'D#', key: 'E', freq: 311.13, left: 22 },
  { note: 'F#4', label: 'F#', key: 'T', freq: 369.99, left: 47 },
  { note: 'G#4', label: 'G#', key: 'Y', freq: 415.3, left: 59.5 },
  { note: 'A#4', label: 'A#', key: 'U', freq: 466.16, left: 72 },
]

const allNotes = [...whiteNotes, ...blackNotes]

function shortAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function getRandomNote() {
  return allNotes[Math.floor(Math.random() * allNotes.length)]
}

function App() {
  const [wallet, setWallet] = useState('')
  const [score, setScore] = useState(0)
  const [lastNote, setLastNote] = useState('None')
  const [targetNote, setTargetNote] = useState(getRandomNote())
  const [timeLeft, setTimeLeft] = useState(5)
  const [message, setMessage] = useState('Connect your wallet, then play the note shown on screen.')
  const [leaderboard, setLeaderboard] = useState([])
  const [isStarted, setIsStarted] = useState(false)
  const audioContextRef = useRef(null)

  const playerName = useMemo(() => {
    if (!wallet) return 'Guest Player'
    return shortAddress(wallet)
  }, [wallet])

  function playTone(freq) {
    const AudioContext = window.AudioContext || window.webkitAudioContext

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
    }

    const audioContext = audioContextRef.current
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime)

    gainNode.gain.setValueAtTime(0.22, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.6)

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.6)
  }

  function saveLeaderboard(nextScore, name = playerName) {
    const oldBoard = JSON.parse(localStorage.getItem('pianoQuestLeaderboard') || '[]')

    const newBoard = [
      ...oldBoard,
      {
        name,
        score: nextScore,
        date: new Date().toLocaleDateString(),
      },
    ]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    localStorage.setItem('pianoQuestLeaderboard', JSON.stringify(newBoard))
    setLeaderboard(newBoard)
  }

  async function connectWallet() {
    if (!window.ethereum) {
      setMessage('No wallet found. Please install MetaMask or another EVM wallet.')
      return
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      const connectedWallet = accounts[0]
      setWallet(connectedWallet)
      setIsStarted(true)

      const bonusKey = `pianoQuestBonus_${connectedWallet}`
      const hasBonus = localStorage.getItem(bonusKey)

      if (!hasBonus) {
        setScore(200)
        saveLeaderboard(200, shortAddress(connectedWallet))
        localStorage.setItem(bonusKey, 'true')
        setMessage('Wallet connected. Welcome bonus: +200 points.')
      } else {
        setMessage('Wallet connected. Bonus already claimed for this wallet.')
      }
    } catch (error) {
      setMessage('Wallet connection was rejected.')
    }
  }

  function nextRound() {
    setTargetNote(getRandomNote())
    setTimeLeft(5)
  }

  function handlePlay(noteItem) {
    playTone(noteItem.freq)
    setLastNote(noteItem.label)

    if (!isStarted) {
      setMessage('Connect your wallet first to start the quest.')
      return
    }

    let nextScore = score

    if (noteItem.note === targetNote.note) {
      nextScore = score + 10
      setMessage(`Correct note: ${noteItem.label}. You earned +10 points.`)
    } else {
      nextScore = Math.max(0, score - 5)
      setMessage(`Wrong note. You pressed ${noteItem.label}. -5 points.`)
    }

    setScore(nextScore)
    saveLeaderboard(nextScore)
    nextRound()
  }

  useEffect(() => {
    const savedBoard = JSON.parse(localStorage.getItem('pianoQuestLeaderboard') || '[]')
    setLeaderboard(savedBoard)
  }, [])

  useEffect(() => {
    if (!isStarted) return

    if (timeLeft <= 0) {
      const nextScore = Math.max(0, score - 5)
      setScore(nextScore)
      saveLeaderboard(nextScore)
      setMessage(`Time is up. You missed ${targetNote.label}. -5 points.`)
      nextRound()
      return
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [timeLeft, isStarted, score, targetNote])

  useEffect(() => {
    function handleKeyboard(event) {
      const pressedKey = event.key.toUpperCase()
      const noteItem = allNotes.find((item) => item.key === pressedKey)

      if (noteItem) {
        handlePlay(noteItem)
      }
    }

    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  })

  return (
    <main className="page">
      <section className="hero-card">
        <div className="badge">Built for OPN Builders Season 1</div>

        <button className={wallet ? 'wallet-button connected' : 'wallet-button'} onClick={connectWallet}>
          {wallet ? `Connected: ${shortAddress(wallet)}` : 'Connect Wallet'}
        </button>

        <h1>Piano Quest</h1>

        <p className="subtitle">
          A Web3 piano game inspired by IOPn, where every correct note brings your rhythm closer to OPN Chain.
        </p>

        <p className="iopn-text">
          Connect your wallet, follow the target note, play before the timer ends, and climb the leaderboard.
        </p>

        <div className="game-panel">
          <div className="target-box">
            <span>Target note</span>
            <strong>{targetNote.label}</strong>
          </div>

          <div className="target-box timer-box">
            <span>Countdown</span>
            <strong>{isStarted ? `${timeLeft}s` : '5s'}</strong>
          </div>
        </div>

        <div className="stats">
          <div className="stat-box">
            <span>Score</span>
            <strong>{score}</strong>
          </div>

          <div className="stat-box">
            <span>Last note</span>
            <strong>{lastNote}</strong>
          </div>
        </div>

        <div className="piano-wrapper">
          <div className="piano">
            <div className="black-keys">
              {blackNotes.map((item) => (
                <button
                  key={item.note}
                  className="black-key"
                  style={{ left: `${item.left}%` }}
                  onClick={() => handlePlay(item)}
                >
                  <span>{item.label}</span>
                  <small>{item.key}</small>
                </button>
              ))}
            </div>

            <div className="white-keys">
              {whiteNotes.map((item) => (
                <button
                  key={item.note}
                  className="white-key"
                  onClick={() => handlePlay(item)}
                >
                  <span>{item.label}</span>
                  <small>{item.key}</small>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="instruction">{message}</p>

        <div className="links">
          <a href="https://iopn.io/" target="_blank" rel="noreferrer">
            Explore IOPn
          </a>
          <a href="https://faucet.iopn.tech/" target="_blank" rel="noreferrer">
            OPN Testnet Faucet
          </a>
        </div>

        <section className="leaderboard">
          <h2>Leaderboard</h2>

          {leaderboard.length === 0 ? (
            <p className="empty-board">No players yet. Connect wallet and start playing.</p>
          ) : (
            <div className="board-list">
              {leaderboard.map((player, index) => (
                <div className="board-row" key={`${player.name}-${index}`}>
                  <span>#{index + 1}</span>
                  <strong>{player.name}</strong>
                  <em>{player.score} pts</em>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

export default App