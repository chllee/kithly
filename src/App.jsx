import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import styled from 'styled-components'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import EventsPage from './pages/EventsPage'
import EventPage from './pages/EventPage'
import CreateEventPage from './pages/CreateEventPage'
import GroupsPage from './pages/GroupsPage'
import FeedPage from './pages/FeedPage'

const AppBackground = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.bg};
`

function AuthRoutes() {
  const [showSignUp, setShowSignUp] = useState(false)
  if (showSignUp) return <SignUp onSwitch={() => setShowSignUp(false)} />
  return <SignIn onSwitch={() => setShowSignUp(true)} />
}

function AppRoutes() {
  const { session } = useAuth()

  if (!session) return <AuthRoutes />

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/feed" replace />} />
      <Route path="/feed" element={<FeedPage />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/events/new" element={<CreateEventPage />} />
      <Route path="/events/:id" element={<EventPage />} />
      <Route path="/groups" element={<GroupsPage />} />
      <Route path="*" element={<Navigate to="/feed" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppBackground>
          <AppRoutes />
        </AppBackground>
      </AuthProvider>
    </BrowserRouter>
  )
}
