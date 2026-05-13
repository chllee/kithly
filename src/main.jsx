import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, createGlobalStyle } from 'styled-components'
import { theme } from './theme'
import App from './App.jsx'

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body, #root {
    height: 100%;
  }

  body {
    font-family: ${({ theme }) => theme.font.family};
    font-size: ${({ theme }) => theme.font.sizeBase};
    color: ${({ theme }) => theme.colors.textDark};
    -webkit-font-smoothing: antialiased;
  }

  input, button, textarea, select {
    font-family: inherit;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button {
    cursor: pointer;
    border: none;
    background: none;
  }
`

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <App />
    </ThemeProvider>
  </StrictMode>,
)
