import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import { TOPICS } from '../data/topics';

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${theme.space.sm};
  width: 100%;
  max-height: 400px;
  overflow-y: auto;
`;

const TopicBtn = styled.button<{ selected: boolean; readOnly?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.space.sm};
  padding: ${theme.space.sm} ${theme.space.md};
  border-radius: ${theme.radii.sm};
  background: ${(p) => (p.selected ? theme.colors.primary : theme.colors.bgCard)};
  color: ${theme.colors.text};
  font-size: 0.8rem;
  text-align: left;
  transition: background 0.15s;
  ${(p) => p.readOnly ? `
    cursor: default;
    opacity: ${p.selected ? 1 : 0.6};
  ` : `
    &:hover {
      background: ${p.selected ? theme.colors.primary : theme.colors.bgLight};
    }
  `}
`;

const Emoji = styled.span`
  font-size: 1.2rem;
  flex-shrink: 0;
`;

interface Props {
  selected: string[];
  onChange?: (ids: string[]) => void;
  readOnly?: boolean;
}

export function TopicSelector({ selected, onChange, readOnly }: Props) {
  const toggle = (id: string) => {
    if (readOnly || !onChange) return;
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <Grid>
      {TOPICS.map((t) => (
        <TopicBtn
          key={t.id}
          selected={selected.includes(t.id)}
          readOnly={readOnly}
          onClick={() => toggle(t.id)}
        >
          <Emoji>{t.emoji}</Emoji>
          {t.text}
        </TopicBtn>
      ))}
    </Grid>
  );
}
