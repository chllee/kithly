import styled from 'styled-components'

export const PageWrapper = styled.div`
  min-height: calc(100vh - 64px);
  padding: ${({ theme }) => theme.spacing.xl};
  max-width: 1100px;
  margin: 0 auto;
`

export const GlassCard = styled.div`
  background: ${({ theme }) => theme.glass.background};
  border: ${({ theme }) => theme.glass.border};
  border-radius: ${({ theme }) => theme.glass.borderRadius};
  box-shadow: ${({ theme }) => theme.glass.shadow};
  padding: ${({ theme }) => theme.spacing.lg};
`

export const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.font.sizeXl};
  font-weight: ${({ theme }) => theme.font.weightBold};
  color: ${({ theme }) => theme.colors.textDark};
  letter-spacing: -0.5px;
`

export const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.font.sizeLg};
  font-weight: ${({ theme }) => theme.font.weightBold};
  color: ${({ theme }) => theme.colors.textDark};
`

export const Input = styled.input`
  width: 100%;
  padding: 10px ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.textDark};
  font-size: ${({ theme }) => theme.font.sizeBase};
  font-family: inherit;
  transition: ${({ theme }) => theme.transition};
  outline: none;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(255, 151, 26, 0.12);
  }
`

export const PrimaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  font-size: ${({ theme }) => theme.font.sizeBase};
  font-weight: ${({ theme }) => theme.font.weightSemibold};
  font-family: inherit;
  border-radius: ${({ theme }) => theme.radius.md};
  border: none;
  transition: ${({ theme }) => theme.transition};
  white-space: nowrap;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primaryHover};
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
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
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.textDark};
  font-size: ${({ theme }) => theme.font.sizeSm};
  font-weight: ${({ theme }) => theme.font.weightSemibold};
  font-family: inherit;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  transition: ${({ theme }) => theme.transition};
  white-space: nowrap;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.bg};
    border-color: #CFC9C2;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  svg {
    width: 15px;
    height: 15px;
    flex-shrink: 0;
  }
`

export const ErrorMsg = styled.p`
  color: ${({ theme }) => theme.colors.errorText};
  background: ${({ theme }) => theme.colors.errorBg};
  border: 1px solid rgba(220, 38, 38, 0.2);
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
`

export const ModalCard = styled(GlassCard)`
  width: 100%;
  max-width: ${({ $wide }) => $wide ? '820px' : '480px'};
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: ${({ theme }) => theme.glass.shadowStrong};
`

export const CloseButton = styled.button`
  position: absolute;
  top: ${({ theme }) => theme.spacing.md};
  right: ${({ theme }) => theme.spacing.md};
  width: 30px;
  height: 30px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.bg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textMid};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  line-height: 1;
  transition: ${({ theme }) => theme.transition};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.textDark};
  }
`

export const PhotoCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.glass.shadow};
  cursor: pointer;
  transition: ${({ theme }) => theme.transition};

  &:hover {
    box-shadow: ${({ theme }) => theme.glass.shadowStrong};
    transform: translateY(-2px);
  }

  img, video {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    display: block;
    transition: transform 0.3s ease;
  }

  &:hover img,
  &:hover video {
    transform: scale(1.04);
  }
`
