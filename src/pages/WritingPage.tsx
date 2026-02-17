import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import { Button, TextArea, PageWrap, Subtitle } from '../components/Button';
import { TOPICS } from '../data/topics';
import { gameStore } from '../stores/GameStore';
import { hostAction } from '../engine/HostEngine';
import { sendAction } from '../engine/ClientEngine';
import { LeaveGameButton } from '../components/LeaveGameButton';
import { useReaction, useLocalObservable } from '../utils/mobx';

const TopicHeader = styled.div`
  text-align: center;
`;

const TopicEmoji = styled.div`
  font-size: 2rem;
`;

const TopicText = styled.h3`
  font-size: 1.1rem;
  margin-top: ${theme.space.xs};
`;

const Progress = styled.div`
  color: ${theme.colors.textMuted};
  font-size: 0.85rem;
  text-align: center;
`;

const WaitingList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.space.xs};
  justify-content: center;
`;

const WaitingName = styled.span`
  background: ${theme.colors.bgCard};
  border: 1px solid ${theme.colors.textMuted}11;
  padding: ${theme.space.xs} ${theme.space.sm};
  border-radius: ${theme.radii.md};
  font-size: 0.85rem;
  color: ${theme.colors.textMuted};
`;

export const WritingPage = observer(function WritingPage() {
  const navigate = useNavigate();
  const { config, isHost, isLeader, allWritingDone } = gameStore;
  const topicIds = config.topicIds;

  const local = useLocalObservable(() => {
    const myId = gameStore.myPlayerId;
    const submitted = new Set(
      gameStore.stories.filter((s) => s.authorId === myId).map((s) => s.topicId),
    );
    const firstMissing = topicIds.findIndex((id) => !submitted.has(id));
    return {
      currentIdx: firstMissing >= 0 ? firstMissing : topicIds.length - 1,
      drafts: {} as Record<string, string>,
      done: topicIds.length > 0 && topicIds.every((id) => submitted.has(id)),
    };
  });

  useReaction(
    () => gameStore.phase,
    (p) => { if (p === 'PLAYING') navigate('/play'); },
  );

  const currentTopicId = topicIds[local.currentIdx];
  const topic = TOPICS.find((t) => t.id === currentTopicId);

  function dispatch(msg: Parameters<typeof hostAction>[0]) {
    if (isHost) hostAction(msg);
    else sendAction(msg);
  }

  function handleSubmit() {
    const text = local.drafts[currentTopicId]?.trim();
    if (!text) return;

    dispatch({ type: 'SUBMIT_STORY', topicId: currentTopicId, text });
    if (local.currentIdx < topicIds.length - 1) {
      local.currentIdx += 1;
    } else {
      local.done = true;
      dispatch({ type: 'DONE_WRITING' });
    }
  }

  function handleStartGame() {
    dispatch({ type: 'START_GAME' });
  }

  const waitingPlayers = gameStore.players.filter(
    (p) => p.connected && !gameStore.state.writingDone.includes(p.id),
  );

  if (local.done) {
    return (
      <PageWrap>
        <Subtitle>All stories submitted!</Subtitle>
        {waitingPlayers.length > 0 ? (
          <>
            <Progress>Waiting for:</Progress>
            <WaitingList>
              {waitingPlayers.map((p) => (
                <WaitingName key={p.id}>{p.name}</WaitingName>
              ))}
            </WaitingList>
          </>
        ) : (
          <Progress>Everyone is done! Starting soon...</Progress>
        )}
        {isLeader && (
          <Button onClick={handleStartGame} disabled={!allWritingDone}>
            {allWritingDone ? 'Start the Game!' : 'Waiting for others...'}
          </Button>
        )}

        {!isLeader && <Progress>Waiting for the leader...</Progress>}

        <LeaveGameButton />
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <Progress>
        Topic {local.currentIdx + 1} of {topicIds.length}
      </Progress>

      {topic && (
        <TopicHeader>
          <TopicEmoji>{topic.emoji}</TopicEmoji>
          <TopicText>{topic.text}</TopicText>
        </TopicHeader>
      )}

      <TextArea
        placeholder="Write your story..."
        value={local.drafts[currentTopicId] ?? ''}
        onChange={(e) => (local.drafts[currentTopicId] = e.target.value)}
        maxLength={500}
      />

      <Button onClick={handleSubmit} disabled={!local.drafts[currentTopicId]?.trim()}>
        {local.currentIdx < topicIds.length - 1 ? 'Submit & Next' : 'Submit & Done'}
      </Button>

      <LeaveGameButton />
    </PageWrap>
  );
});
