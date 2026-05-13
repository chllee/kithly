import { Link, useLocation } from 'react-router-dom'
import styled from 'styled-components'
import { Home, Images, Users, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const Bar = styled.nav`
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${({ theme }) => theme.spacing.xl};
  height: 64px;
  background: ${({ theme }) => theme.glass.background};
  backdrop-filter: ${({ theme }) => theme.glass.backdrop};
  -webkit-backdrop-filter: ${({ theme }) => theme.glass.backdrop};
  border-bottom: ${({ theme }) => theme.glass.border};
  box-shadow: 0 4px 16px rgba(90, 20, 10, 0.15);
`

const Wordmark = styled(Link)`
  font-size: ${({ theme }) => theme.font.sizeXl};
  font-weight: ${({ theme }) => theme.font.weightExtrabold};
  color: ${({ theme }) => theme.colors.textLight};
  letter-spacing: -0.5px;
  text-shadow: 0 2px 8px rgba(90, 20, 10, 0.3);
`

const NavLinks = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`

const NavLink = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 14px;
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.font.sizeXs};
  font-weight: ${({ theme }) => theme.font.weightSemibold};
  transition: ${({ theme }) => theme.transition};
  background: ${({ $active, theme }) => $active ? theme.glass.backgroundStrong : 'transparent'};
  border: ${({ $active, theme }) => $active ? theme.glass.border : '1px solid transparent'};

  &:hover {
    background: ${({ theme }) => theme.glass.backgroundStrong};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`

const UserArea = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.textLight};
  font-weight: ${({ theme }) => theme.font.weightSemibold};
  font-size: ${({ theme }) => theme.font.sizeSm};
`

const SignOutButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.font.sizeSm};
  font-weight: ${({ theme }) => theme.font.weightSemibold};
  background: ${({ theme }) => theme.glass.background};
  border: ${({ theme }) => theme.glass.border};
  transition: ${({ theme }) => theme.transition};

  &:hover {
    background: ${({ theme }) => theme.glass.backgroundStrong};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`

export default function Nav() {
  const { session } = useAuth()
  const location = useLocation()

  return (
    <Bar>
      <Wordmark to="/">Kithly</Wordmark>

      <NavLinks>
        <NavLink to="/" $active={location.pathname === '/'}>
          <Home />
          Events
        </NavLink>
        <NavLink to="/feed" $active={location.pathname === '/feed'}>
          <Images />
          Feed
        </NavLink>
        <NavLink to="/groups" $active={location.pathname === '/groups'}>
          <Users />
          Groups
        </NavLink>
      </NavLinks>

      <UserArea>
        <span>{session.user.user_metadata.first_name}</span>
        <SignOutButton onClick={() => supabase.auth.signOut()}>
          <LogOut />
          Sign out
        </SignOutButton>
      </UserArea>
    </Bar>
  )
}
