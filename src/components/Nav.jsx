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
  background: ${({ theme }) => theme.colors.white};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  @media (max-width: 639px) {
    padding: 0 ${({ theme }) => theme.spacing.md};
  }
`

const Wordmark = styled(Link)`
  font-size: 20px;
  font-weight: ${({ theme }) => theme.font.weightBold};
  color: ${({ theme }) => theme.colors.textDark};
  letter-spacing: -0.5px;
`

const NavLinks = styled.div`
  display: flex;
  gap: 4px;

  @media (max-width: 639px) {
    display: none;
  }
`

const NavLink = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 14px;
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.textMid};
  font-size: ${({ theme }) => theme.font.sizeXs};
  font-weight: ${({ theme }) => theme.font.weightSemibold};
  transition: ${({ theme }) => theme.transition};
  background: ${({ $active }) => $active ? 'rgba(255, 151, 26, 0.08)' : 'transparent'};

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    background: rgba(255, 151, 26, 0.06);
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
  color: ${({ theme }) => theme.colors.textMid};
  font-weight: ${({ theme }) => theme.font.weightSemibold};
  font-size: ${({ theme }) => theme.font.sizeSm};
`

const UserName = styled.span`
  @media (max-width: 639px) {
    display: none;
  }
`

const SignOutButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.textMid};
  font-size: ${({ theme }) => theme.font.sizeSm};
  font-weight: ${({ theme }) => theme.font.weightSemibold};
  background: ${({ theme }) => theme.colors.bg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  transition: ${({ theme }) => theme.transition};

  &:hover {
    background: ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.textDark};
  }

  svg {
    width: 15px;
    height: 15px;
  }
`

const SignOutLabel = styled.span`
  @media (max-width: 639px) {
    display: none;
  }
`

const BottomBar = styled.nav`
  display: none;

  @media (max-width: 639px) {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 50;
    height: 56px;
    padding-bottom: env(safe-area-inset-bottom);
    background: ${({ theme }) => theme.colors.white};
    border-top: 1px solid ${({ theme }) => theme.colors.border};
    justify-content: space-around;
    align-items: stretch;
  }
`

const BottomLink = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  flex: 1;
  color: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.textMuted};
  font-size: ${({ theme }) => theme.font.sizeXs};
  font-weight: ${({ theme }) => theme.font.weightSemibold};
  transition: ${({ theme }) => theme.transition};

  svg {
    width: 22px;
    height: 22px;
  }
`

export default function Nav() {
  const { session } = useAuth()
  const location = useLocation()

  return (
    <>
      <Bar>
        <Wordmark to="/">Kithly</Wordmark>

        <NavLinks>
          <NavLink to="/feed" $active={location.pathname === '/feed'}>
            <Images />
            Feed
          </NavLink>
          <NavLink to="/events" $active={location.pathname.startsWith('/events')}>
            <Home />
            Events
          </NavLink>
          <NavLink to="/groups" $active={location.pathname === '/groups'}>
            <Users />
            Groups
          </NavLink>
        </NavLinks>

        <UserArea>
          <UserName>{session.user.user_metadata.first_name}</UserName>
          <SignOutButton onClick={() => supabase.auth.signOut()}>
            <LogOut />
            <SignOutLabel>Sign out</SignOutLabel>
          </SignOutButton>
        </UserArea>
      </Bar>

      <BottomBar>
        <BottomLink to="/feed" $active={location.pathname === '/feed'}>
          <Images />
          Feed
        </BottomLink>
        <BottomLink to="/events" $active={location.pathname.startsWith('/events')}>
          <Home />
          Events
        </BottomLink>
        <BottomLink to="/groups" $active={location.pathname === '/groups'}>
          <Users />
          Groups
        </BottomLink>
      </BottomBar>
    </>
  )
}
