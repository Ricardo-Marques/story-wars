import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import { Button, PageWrap, Subtitle } from '../components/Button';
import { TopicSelector } from '../components/TopicSelector';
import { gameStore } from '../stores/GameStore';
import { hostAction } from '../engine/HostEngine';
import { sendAction } from '../engine/ClientEngine';
import { LeaveGameButton } from '../components/LeaveGameButton';
import { useReaction, useLocalObservable } from '../utils/mobx';

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
  accent-color: ${theme.colors.primaryLight};
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
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

export const SetupPage = observer(function SetupPage() {
  const navigate = useNavigate();
  const { isLeader, isHost, config, players } = gameStore;

  const local = useLocalObservable(() => ({
    selectedTopics: config.topicIds as string[],
    storiesPerPrompt: config.storiesPerPrompt,
    voteTimer: config.voteTimerSeconds,
  }));

  useReaction(
    () => gameStore.phase,
    (p) => { if (p === 'WRITING') navigate('/writing'); },
  );

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
    local.selectedTopics = ids;
    sendConfig(ids, local.storiesPerPrompt, local.voteTimer);
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

        <TopicSelector selected={config.topicIds} readOnly />

        <Controls>
          <SliderRow>
            <Label>Stories per topic</Label>
            <Value>{config.storiesPerPrompt}</Value>
          </SliderRow>
          <SliderRow>
            <Label>Vote timer</Label>
            <Value>{formatTime(config.voteTimerSeconds)}</Value>
          </SliderRow>
        </Controls>

        <Info>{config.topicIds.length} topic{config.topicIds.length !== 1 ? 's' : ''} selected</Info>

        <LeaveGameButton />
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <Subtitle>Pick topics for this round</Subtitle>

      <TopicSelector selected={local.selectedTopics} onChange={handleTopicsChange} />

      <Controls>
        <SliderRow>
          <Label>Stories per topic</Label>
          <Slider
            type="range"
            min={1}
            max={players.length}
            value={local.storiesPerPrompt}
            onChange={(e) => {
              const v = Number(e.target.value);
              local.storiesPerPrompt = v;
              sendConfig(local.selectedTopics, v, local.voteTimer);
            }}
          />
          <Value>{local.storiesPerPrompt}</Value>
        </SliderRow>

        <SliderRow>
          <Label>Vote timer</Label>
          <Slider
            type="range"
            min={10}
            max={600}
            step={10}
            value={local.voteTimer}
            onChange={(e) => {
              const v = Number(e.target.value);
              local.voteTimer = v;
              sendConfig(local.selectedTopics, local.storiesPerPrompt, v);
            }}
          />
          <Value>{formatTime(local.voteTimer)}</Value>
        </SliderRow>
      </Controls>

      <Button onClick={handleStartWriting} disabled={local.selectedTopics.length === 0}>
        {local.selectedTopics.length === 0 ? 'Select at least 1 topic' : 'Start Writing!'}
      </Button>

      <LeaveGameButton />
    </PageWrap>
  );
});
