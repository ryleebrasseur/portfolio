import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('main.tsx loaded')

const container = document.getElementById('root')!
console.log('Root container found:', container)

const root = createRoot(container)
console.log('React root created')

try {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
  console.log('App rendered successfully')
} catch (error) {
  console.error('Error rendering App:', error)
}