import styled from '@emotion/styled'
import { theme } from '../styles/theme'

export const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.space.md};
  width: 100%;
`

export const Row = styled.div`
  display: flex;
  gap: ${theme.space.sm};
`

export const Divider = styled.div`
  text-align: center;
  color: ${theme.colors.textMuted};
  font-size: 0.85rem;
  margin: ${theme.space.sm} 0;
`

export const ErrorMsg = styled.div`
  color: ${theme.colors.error};
  font-size: 0.85rem;
  text-align: center;
`

export const NoticeMsg = styled.div`
  background: ${theme.colors.warning}22;
  border: 1px solid ${theme.colors.warning}44;
  border-radius: ${theme.radii.md};
  padding: ${theme.space.sm} ${theme.space.md};
  color: ${theme.colors.warning};
  font-size: 0.85rem;
  font-weight: 600;
  text-align: center;
`

export const RoomBadge = styled.div`
  background: ${theme.colors.bgCard};
  border: 2px solid ${theme.colors.primaryLight}44;
  border-radius: ${theme.radii.lg};
  padding: ${theme.space.md} ${theme.space.lg};
  text-align: center;
`

export const RoomCodeLabel = styled.div`
  font-size: 0.8rem;
  color: ${theme.colors.textMuted};
  margin-bottom: ${theme.space.xs};
`

export const RoomCodeValue = styled.div`
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: 4px;
  color: ${theme.colors.primaryLight};
`

export const ResumeBox = styled.div`
  background: ${theme.colors.bgCard};
  border: 2px solid ${theme.colors.warning}44;
  border-radius: ${theme.radii.lg};
  padding: ${theme.space.md};
  display: flex;
  flex-direction: column;
  gap: ${theme.space.sm};
  width: 100%;
  text-align: center;
`

export const ResumeLabel = styled.div`
  font-size: 0.9rem;
  color: ${theme.colors.warning};
  font-weight: 600;
`

export const ResumeCode = styled.span`
  color: ${theme.colors.primaryLight};
  font-weight: 800;
  letter-spacing: 2px;
`

export const RulesLink = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.primaryLight};
  font-size: 0.85rem;
  cursor: pointer;
  text-decoration: underline;
  padding: ${theme.space.xs};
  &:hover {
    color: ${theme.colors.text};
  }
`
