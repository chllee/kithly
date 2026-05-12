import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import EventsPage from './pages/EventsPage'
import EventPage from './pages/EventPage'
import CreateEventPage from './pages/CreateEventPage'
import GroupsPage from './pages/GroupsPage'

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
      <Route path="/" element={<EventsPage />} />
      <Route path="/events/new" element={<CreateEventPage />} />
      <Route path="/events/:id" element={<EventPage />} />
      <Route path="/groups" element={<GroupsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
