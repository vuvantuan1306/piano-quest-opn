import { useState } from 'react'
import './App.css'

const notes = [
  { key: 'A', note: 'C' },
  { key: 'S', note: 'D' },
  { key: 'E', note: 'E' },
  { key: 'F', note: 'F' },
  { key: 'G', note: 'G' },
  { key: 'H', note: 'A' },
  { key: 'J', note: 'B' },
]

function App() {
  const [score, setScore] = useState(0)
  const [lastNote, setLastNote] = useState('')
  const [wallet, setWallet] = useState('')
  const [walletError, setWalletError] = useState('')

  const connectWallet = async () => {
    setWalletError('')

    if (!window.ethereum) {
      setWalletError('Please install MetaMask or another Web3 wallet.')
      return
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      setWallet(accounts[0])
    } catch (error) {
      setWalletError('Wallet connection was rejected.')
    }
  }

  const playNote = (note) => {
    setLastNote(note)
    setScore(score + 10)
  }

  const shortAddress = wallet
    ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
    : ''

  return (
    <main className="app">
      <section className="hero">
        <p className="badge">Built for OPN Builders Season 1</p>

        <div className="wallet-box">
          {wallet ? (
            <div className="wallet-connected">
              Connected: <strong>{shortAddress}</strong>
            </div>
          ) : (
            <button className="wallet-button" onClick={connectWallet}>
              Connect Wallet
            </button>
          )}

          {walletError && <p className="wallet-error">{walletError}</p>}
        </div>

        <h1>Piano Quest</h1>

        <p className="tagline">
          Play piano notes, complete quests, connect your wallet, and build your
          rhythm on OPN Chain.
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
          Connect your wallet, click piano keys, earn points, and try the first
          demo version of Piano Quest.
        </p>
      </section>
    </main>
  )
}

export default App