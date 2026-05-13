import styled from 'styled-components'

export const PageWrapper = styled.div`
  min-height: calc(100vh - 64px);
  padding: ${({ theme }) => theme.spacing.xl};
  max-width: 1100px;
  margin: 0 auto;
`

export const GlassCard = styled.div`
  background: ${({ theme }) => theme.glass.background};
  backdrop-filter: ${({ theme }) => theme.glass.backdrop};
  -webkit-backdrop-filter: ${({ theme }) => theme.glass.backdrop};
  border: ${({ theme }) => theme.glass.border};
  border-radius: ${({ theme }) => theme.glass.borderRadius};
  box-shadow: ${({ theme }) => theme.glass.shadow};
  padding: ${({ theme }) => theme.spacing.lg};
`

export const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.font.sizeXl};
  font-weight: ${({ theme }) => theme.font.weightExtrabold};
  color: ${({ theme }) => theme.colors.textLight};
  text-shadow: 0 2px 8px rgba(90, 20, 10, 0.3);
`

export const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.font.sizeLg};
  font-weight: ${({ theme }) => theme.font.weightBold};
  color: ${({ theme }) => theme.colors.textLight};
`

export const Input = styled.input`
  width: 100%;
  padding: 12px ${({ theme }) => theme.spacing.md};
  background: rgba(255, 248, 230, 0.2);
  border: 1px solid rgba(255, 248, 230, 0.4);
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.font.sizeBase};
  transition: ${({ theme }) => theme.transition};
  outline: none;

  &::placeholder {
    color: rgba(253, 248, 240, 0.5);
  }

  &:focus {
    background: rgba(255, 248, 230, 0.3);
    border-color: rgba(255, 248, 230, 0.65);
  }
`

export const PrimaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.font.sizeBase};
  font-weight: ${({ theme }) => theme.font.weightBold};
  border-radius: ${({ theme }) => theme.radius.md};
  box-shadow: 0 4px 14px rgba(90, 20, 10, 0.3);
  transition: ${({ theme }) => theme.transition};
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primaryHover};
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(90, 20, 10, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`

export const AccentButton = styled(PrimaryButton)`
  background: ${({ theme }) => theme.colors.accent};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.accentHover};
  }
`

export const GhostButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.glass.background};
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.font.sizeSm};
  font-weight: ${({ theme }) => theme.font.weightSemibold};
  border-radius: ${({ theme }) => theme.radius.md};
  border: ${({ theme }) => theme.glass.border};
  transition: ${({ theme }) => theme.transition};
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.glass.backgroundStrong};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`

export const ErrorMsg = styled.p`
  color: ${({ theme }) => theme.colors.error};
  background: ${({ theme }) => theme.colors.errorBg};
  border-radius: ${({ theme }) => theme.radius.sm};
  padding: 10px ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.font.sizeSm};
  font-weight: ${({ theme }) => theme.font.weightSemibold};
`

export const MutedText = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.font.sizeSm};
`

export const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
`

export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: ${({ theme }) => theme.colors.overlay};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: ${({ theme }) => theme.spacing.md};
  backdrop-filter: blur(4px);
`

export const ModalCard = styled(GlassCard)`
  width: 100%;
  max-width: ${({ $wide }) => $wide ? '820px' : '480px'};
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  background: ${({ theme }) => theme.glass.backgroundStrong};
  box-shadow: ${({ theme }) => theme.glass.shadowStrong};
`

export const CloseButton = styled.button`
  position: absolute;
  top: ${({ theme }) => theme.spacing.md};
  right: ${({ theme }) => theme.spacing.md};
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: rgba(255, 248, 230, 0.2);
  border: ${({ theme }) => theme.glass.border};
  color: ${({ theme }) => theme.colors.textLight};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: ${({ theme }) => theme.transition};

  &:hover {
    background: rgba(255, 248, 230, 0.35);
  }
`
