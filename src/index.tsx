import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app'

// Fix: Use createRoot instead of ReactDOM.render
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(<App />)
