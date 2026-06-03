import { useEffect, useMemo, useState } from 'react'
import './App.css'

const whiteKeys = [
  { note: 'C', key: 'A', freq: 261.63 },
  { note: 'D', key: 'S', freq: 293.66 },
  { note: 'E', key: 'D', freq: 329.63 },
  { note: 'F', key: 'F', freq: 349.23 },
  { note: 'G', key: 'G', freq: 392.0 },
  { note: 'A', key: 'H', freq: 440.0 },
  { note: 'B', key: 'J', freq: 493.88 }
]

const blackKeys = [
  { note: 'C#', key: 'W', freq: 277.18, position: 0 },
  { note: 'D#', key: 'E', freq: 311.13, position: 1 },
  { note: 'F#', key: 'T', freq: 369.99, position: 3 },
  { note: 'G#', key: 'Y', freq: 415.3, position: 4 },
  { note: 'A#', key: 'U', freq: 466.16, position: 5 }
]

const levelSettings = [
  {
    level: 1,
    name: 'Easy',
    time: 5,
    notes: whiteKeys,
    description: 'White keys only'
  },
  {
    level: 2,
    name: 'Normal',
    time: 5,
    notes: [...whiteKeys, ...blackKeys],
    description: 'White and black keys'
  },
  {
    level: 3,
    name: 'Hard',
    time: 4,
    notes: [...whiteKeys, ...blackKeys],
    description: 'Faster countdown'
  },
  {
    level: 4,
    name: 'Expert',
    time: 3,
    notes: [...whiteKeys, ...blackKeys],
    description: 'Less time, more pressure'
  },
  {
    level: 5,
    name: 'Master',
    time: 2,
    notes: [...whiteKeys, ...blackKeys],
    description: 'Final rhythm challenge'
  }
]

function App() {
  const [account, setAccount] = useState('')
  const [score, setScore] = useState(0)
  const [lastNote, setLastNote] = useState('None')
  const [currentLevel, setCurrentLevel] = useState(1)
  const [question, setQuestion] = useState(1)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [wrongAnswers, setWrongAnswers] = useState(0)
  const [targetNote, setTargetNote] = useState(null)
  const [timeLeft, setTimeLeft] = useState(5)
  const [popup, setPopup] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])

  const levelData = useMemo(() => {
    return levelSettings.find((item) => item.level === currentLevel) || levelSettings[0]
  }, [currentLevel])

  const allKeys = useMemo(() => {
    return [...whiteKeys, ...blackKeys]
  }, [])

  function shortenAddress(address) {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  function playTone(freq) {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return

    const audioContext = new AudioContext()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime)

    gainNode.gain.setValueAtTime(0.25, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.45)

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.45)
  }

  function pickTargetNote() {
    const notes = levelData.notes
    const randomNote = notes[Math.floor(Math.random() * notes.length)]
    setTargetNote(randomNote)
    setTimeLeft(levelData.time)
  }

  function saveLeaderboard(nextScore) {
    const player = account ? shortenAddress(account) : 'Guest player'
    const oldBoard = JSON.parse(localStorage.getItem('pianoQuestLeaderboard') || '[]')

    const filteredBoard = oldBoard.filter((item) => item.player !== player)

    const newBoard = [
      ...filteredBoard,
      {
        player,
        score: nextScore,
        level: currentLevel
      }
    ]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    localStorage.setItem('pianoQuestLeaderboard', JSON.stringify(newBoard))
    setLeaderboard(newBoard)
  }

  function resetSameLevel() {
    setQuestion(1)
    setCorrectAnswers(0)
    setWrongAnswers(0)
    pickTargetNote()
  }

  function goNextLevel() {
    if (currentLevel < levelSettings.length) {
      setCurrentLevel((prev) => prev + 1)
      setQuestion(1)
      setCorrectAnswers(0)
      setWrongAnswers(0)
    } else {
      setQuestion(1)
      setCorrectAnswers(0)
      setWrongAnswers(0)
    }
  }

  function finishLevel(finalCorrect) {
    const passed = finalCorrect > 5

    if (passed) {
      setPopup({
        type: 'win',
        title: 'You Win!',
        message:
          currentLevel < levelSettings.length
            ? `Great job! You passed Level ${currentLevel}. Ready for the next level.`
            : 'Amazing! You completed the hardest level of Piano Quest.'
      })
    } else {
      setPopup({
        type: 'lose',
        title: 'You Lose!',
        message: `You got ${finalCorrect}/10 correct. You need more than 50% to pass this level. Try again.`
      })
    }
  }

  function handleAnswer(noteItem) {
    if (popup || !targetNote) return

    playTone(noteItem.freq)
    setLastNote(noteItem.note)

    const isCorrect = noteItem.note === targetNote.note

    if (isCorrect) {
      setScore((prev) => {
        const nextScore = prev + 10
        saveLeaderboard(nextScore)
        return nextScore
      })

      const nextCorrect = correctAnswers + 1
      setCorrectAnswers(nextCorrect)

      if (question >= 10) {
        finishLevel(nextCorrect)
      } else {
        setQuestion((prev) => prev + 1)
        setTimeout(() => pickTargetNote(), 250)
      }
    } else {
      setScore((prev) => {
        const nextScore = Math.max(0, prev - 5)
        saveLeaderboard(nextScore)
        return nextScore
      })

      setWrongAnswers((prev) => prev + 1)

      if (question >= 10) {
        finishLevel(correctAnswers)
      } else {
        setQuestion((prev) => prev + 1)
        setTimeout(() => pickTargetNote(), 250)
      }
    }
  }

  async function connectWallet() {
    if (!window.ethereum) {
      alert('Please install MetaMask or another EVM wallet first.')
      return
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      const wallet = accounts[0]
      setAccount(wallet)

      const bonusKey = `pianoQuestBonus_${wallet}`

      if (!localStorage.getItem(bonusKey)) {
        const nextScore = score + 200
        setScore(nextScore)
        saveLeaderboard(nextScore)
        localStorage.setItem(bonusKey, 'claimed')
      }
    } catch (error) {
      console.log(error)
    }
  }

  function closePopup() {
    if (!popup) return

    if (popup.type === 'win') {
      setPopup(null)
      goNextLevel()
    } else {
      setPopup(null)
      resetSameLevel()
    }
  }

  useEffect(() => {
    const oldBoard = JSON.parse(localStorage.getItem('pianoQuestLeaderboard') || '[]')
    setLeaderboard(oldBoard)
  }, [])

  useEffect(() => {
    pickTargetNote()
  }, [currentLevel])

  useEffect(() => {
    if (popup) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setScore((oldScore) => {
            const nextScore = Math.max(0, oldScore - 5)
            saveLeaderboard(nextScore)
            return nextScore
          })

          setWrongAnswers((oldWrong) => oldWrong + 1)

          if (question >= 10) {
            finishLevel(correctAnswers)
          } else {
            setQuestion((oldQuestion) => oldQuestion + 1)
            setTimeout(() => pickTargetNote(), 100)
          }

          return levelData.time
        }

        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [popup, question, correctAnswers, levelData])

  useEffect(() => {
    function handleKeyboard(event) {
      const pressedKey = event.key.toUpperCase()
      const foundKey = allKeys.find((item) => item.key === pressedKey)

      if (foundKey) {
        handleAnswer(foundKey)
      }
    }

    window.addEventListener('keydown', handleKeyboard)

    return () => {
      window.removeEventListener('keydown', handleKeyboard)
    }
  })

  return (
    <main className="app">
      <section className="hero-card">
        <div className="badge">Built for OPN Builders Season 1</div>

        <button className={account ? 'wallet connected' : 'wallet'} onClick={connectWallet}>
          {account ? `Connected: ${shortenAddress(account)}` : 'Connect Wallet'}
        </button>

        <h1>Piano Quest</h1>

        <p className="subtitle">
          Play piano notes, complete rhythm quests, connect your wallet, and explore the rhythm of
          digital sovereignty on OPN Chain.
        </p>

        <p className="opn-text">
          Inspired by IOPn, the Internet of People, Piano Quest turns blockchain interaction into a
          simple musical game.
        </p>

        <div className="level-panel">
          <div>
            <span>Level</span>
            <strong>
              {levelData.level} - {levelData.name}
            </strong>
          </div>

          <div>
            <span>Question</span>
            <strong>{question}/10</strong>
          </div>

          <div>
            <span>Correct</span>
            <strong>{correctAnswers}/10</strong>
          </div>

          <div>
            <span>Time</span>
            <strong>{timeLeft}s</strong>
          </div>
        </div>

        <div className="target-box">
          <span>Target note</span>
          <strong>{targetNote ? targetNote.note : '...'}</strong>
          <small>{levelData.description}</small>
        </div>

        <div className="stats">
          <div>
            <span>Score</span>
            <strong>{score}</strong>
          </div>

          <div>
            <span>Last note</span>
            <strong>{lastNote}</strong>
          </div>
        </div>

        <div className="piano-wrapper">
          <div className="piano">
            <div className="black-keys">
              {blackKeys.map((item) => (
                <button
                  key={item.note}
                  className="black-key"
                  style={{ left: `${item.position * 14.3 + 10}%` }}
                  onClick={() => handleAnswer(item)}
                >
                  <span>{item.note}</span>
                  <small>{item.key}</small>
                </button>
              ))}
            </div>

            <div className="white-keys">
              {whiteKeys.map((item) => (
                <button key={item.note} className="white-key" onClick={() => handleAnswer(item)}>
                  <span>{item.note}</span>
                  <small>{item.key}</small>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="instruction">
          Hit the target note before the countdown ends. Correct answer gives +10 points. Wrong
          answer or timeout gives -5 points. More than 50% correct answers unlocks the next level.
        </p>

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
            <p>No players yet. Connect your wallet and start playing.</p>
          ) : (
            leaderboard.map((item, index) => (
              <div className="leaderboard-row" key={`${item.player}-${index}`}>
                <span>#{index + 1}</span>
                <strong>{item.player}</strong>
                <small>{item.score} pts</small>
                <em>Level {item.level}</em>
              </div>
            ))
          )}
        </section>
      </section>

      {popup && (
        <div className="popup-overlay">
          <div className={`popup ${popup.type}`}>
            <h2>{popup.title}</h2>
            <p>{popup.message}</p>

            <button onClick={closePopup}>
              {popup.type === 'win'
                ? currentLevel < levelSettings.length
                  ? 'Go to next level'
                  : 'Play again'
                : 'Restart this level'}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

export default App