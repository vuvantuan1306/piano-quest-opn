import { useState } from 'react'
import './App.css'

const notes = [
  { note: 'C', key: 'A', frequency: 261.63 },
  { note: 'D', key: 'S', frequency: 293.66 },
  { note: 'E', key: 'E', frequency: 329.63 },
  { note: 'F', key: 'F', frequency: 349.23 },
  { note: 'G', key: 'G', frequency: 392.0 },
  { note: 'A', key: 'H', frequency: 440.0 },
  { note: 'B', key: 'J', frequency: 493.88 },
]

function App() {
  const [score, setScore] = useState(0)
  const [lastNote, setLastNote] = useState('None')
  const [account, setAccount] = useState('')

  const shortAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask, Rabby, or another Web3 wallet.')
      return
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      setAccount(accounts[0])
    } catch (error) {
      console.error(error)
      alert('Wallet connection was cancelled.')
    }
  }

  const playTone = (frequency) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)

    gainNode.gain.setValueAtTime(0.25, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + 0.8
    )

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.8)
  }

  const playNote = (item) => {
    playTone(item.frequency)
    setLastNote(item.note)
    setScore((currentScore) => currentScore + 10)
  }

  return (
    <main className="page">
      <section className="hero-card">
        <div className="badge">Built for OPN Builders Season 1</div>

        <button className="wallet-button" onClick={connectWallet}>
          {account ? `Connected: ${shortAddress(account)}` : 'Connect Wallet'}
        </button>

        <h1>Piano Quest</h1>

        <p className="subtitle">
          Play musical notes, connect your wallet, and explore the rhythm of
          digital sovereignty on OPN Chain.
        </p>

        <p className="iopn-text">
          Inspired by IOPn, the Internet of People, Piano Quest turns blockchain
          interaction into a simple musical experience.
        </p>

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

        <div className="piano">
          {notes.map((item) => (
            <button
              key={item.note}
              className="piano-key"
              onClick={() => playNote(item)}
            >
              <span>{item.note}</span>
              <small>{item.key}</small>
            </button>
          ))}
        </div>

        <p className="instruction">
          Click any piano key to hear the correct note tone, earn points, and
          try the first demo version of Piano Quest.
        </p>

        <div className="links">
          <a href="https://iopn.io/" target="_blank" rel="noreferrer">
            Explore IOPn
          </a>

          <a href="https://faucet.iopn.tech/" target="_blank" rel="noreferrer">
            OPN Testnet Faucet
          </a>
        </div>
      </section>
    </main>
  )
}

export default App