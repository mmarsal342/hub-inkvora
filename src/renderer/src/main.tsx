import { render } from 'preact'
import App from './App'

window.addEventListener('error', (event) => {
  console.error('Renderer Error:', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Renderer Promise Rejection:', event.reason)
})

render(<App />, document.getElementById('app')!)

