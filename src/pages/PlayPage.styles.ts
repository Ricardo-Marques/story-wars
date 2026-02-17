import styled from '@emotion/styled'
import { theme } from '../styles/theme'

export const RevealBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.space.sm};
  padding: ${theme.space.lg};
  background: ${theme.colors.bgCard};
  border-radius: ${theme.radii.md};
  width: 100%;
`

export const RevealAvatar = styled.img`
  width: 56px;
  height: 56px;
  border-radius: ${theme.radii.full};
`

export const RevealName = styled.span`
  font-size: 1.2rem;
  font-weight: 700;
`

export const ScoreChange = styled.span<{ positive: boolean }>`
  font-size: 0.9rem;
  color: ${(p) => (p.positive ? theme.colors.success : theme.colors.textMuted)};
`

export const TopicProgress = styled.div`
  color: ${theme.colors.textMuted};
  font-size: 0.8rem;
  text-align: center;
`

export const TopicTitle = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  text-align: center;
  color: ${theme.colors.primaryLight};
`

export const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`

export const MuteBtn = styled.button`
  background: ${theme.colors.bgCard};
  border-radius: ${theme.radii.sm};
  padding: ${theme.space.xs} ${theme.space.sm};
  font-size: 1.1rem;
  color: ${theme.colors.textMuted};
  &:hover {
    background: ${theme.colors.bgLight};
  }
`

export const ScoreBoard = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.space.xs};
  width: 100%;
`

export const ScoreRow = styled.div<{ highlighted?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.space.sm};
  padding: ${theme.space.sm} ${theme.space.md};
  background: ${(p) =>
    p.highlighted ? `${theme.colors.primary}22` : theme.colors.bgCard};
  border-radius: ${theme.radii.sm};
  ${(p) => p.highlighted && `border: 1px solid ${theme.colors.primary}44;`}
`

export const ScoreAvatar = styled.img`
  width: 28px;
  height: 28px;
  border-radius: ${theme.radii.full};
`

export const ScorePlayerName = styled.span`
  flex: 1;
  font-size: 0.9rem;
  font-weight: 600;
`

export const ScoreDelta = styled.span`
  font-size: 0.85rem;
  font-weight: 700;
  color: ${theme.colors.success};
  min-width: 28px;
  text-align: right;
`

export const ScoreValues = styled.span`
  font-size: 0.85rem;
  color: ${theme.colors.textMuted};
  min-width: 60px;
  text-align: right;
`
