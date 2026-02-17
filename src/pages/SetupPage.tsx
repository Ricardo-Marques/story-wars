import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import { Button, PageWrap, Subtitle } from '../components/Button';
import { TopicSelector } from '../components/TopicSelector';
import { gameStore } from '../stores/GameStore';
import { hostAction } from '../engine/HostEngine';
import { sendAction } from '../engine/ClientEngine';

const Controls = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.space.md};
  width: 100%;
`;

const SliderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.space.md};
`;

const Label = styled.span`
  font-size: 0.9rem;
  color: ${theme.colors.textMuted};
  min-width: 120px;
  flex-shrink: 0;
`;

const Value = styled.span`
  font-weight: 700;
  min-width: 56px;
  text-align: right;
  flex-shrink: 0;
`;

const Slider = styled.input`
  flex: 1;
  accent-color: ${theme.colors.primary};
`;

const Info = styled.p`
  color: ${theme.colors.textMuted};
  font-size: 0.85rem;
  text-align: center;
`;

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export const SetupPage = observer(function SetupPage() {
  const navigate = useNavigate();
  const { phase, isLeader, isHost, config, players } = gameStore;

  const [selectedTopics, setSelectedTopics] = useState<string[]>(config.topicIds);
  const [storiesPerPrompt, setStoriesPerPrompt] = useState(config.storiesPerPrompt);
  const [voteTimer, setVoteTimer] = useState(config.voteTimerSeconds);

  useEffect(() => {
    if (phase === 'WRITING') navigate('/writing');
  }, [phase, navigate]);

  function sendConfig(topics: string[], spp: number, vt: number) {
    const msg = {
      type: 'SET_CONFIG' as const,
      topicIds: topics,
      storiesPerPrompt: spp,
      voteTimerSeconds: vt,
    };
    if (isHost) {
      hostAction(msg);
    } else {
      sendAction(msg);
    }
  }

  function handleTopicsChange(ids: string[]) {
    setSelectedTopics(ids);
    sendConfig(ids, storiesPerPrompt, voteTimer);
  }

  function handleStartWriting() {
    const msg = { type: 'START_WRITING' as const };
    if (isHost) {
      hostAction(msg);
    } else {
      sendAction(msg);
    }
  }

  if (!isLeader) {
    return (
      <PageWrap>
        <Subtitle>Leader is picking topics...</Subtitle>
        <Info>{config.topicIds.length} topics selected</Info>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <Subtitle>Pick topics for this round</Subtitle>

      <TopicSelector selected={selectedTopics} onChange={handleTopicsChange} />

      <Controls>
        <SliderRow>
          <Label>Stories per topic</Label>
          <Slider
            type="range"
            min={1}
            max={players.length}
            value={storiesPerPrompt}
            onChange={(e) => {
              const v = Number(e.target.value);
              setStoriesPerPrompt(v);
              sendConfig(selectedTopics, v, voteTimer);
            }}
          />
          <Value>{storiesPerPrompt}</Value>
        </SliderRow>

        <SliderRow>
          <Label>Vote timer</Label>
          <Slider
            type="range"
            min={10}
            max={600}
            step={10}
            value={voteTimer}
            onChange={(e) => {
              const v = Number(e.target.value);
              setVoteTimer(v);
              sendConfig(selectedTopics, storiesPerPrompt, v);
            }}
          />
          <Value>{formatTime(voteTimer)}</Value>
        </SliderRow>
      </Controls>

      <Button onClick={handleStartWriting} disabled={selectedTopics.length === 0}>
        {selectedTopics.length === 0 ? 'Select at least 1 topic' : 'Start Writing!'}
      </Button>
    </PageWrap>
  );
});
