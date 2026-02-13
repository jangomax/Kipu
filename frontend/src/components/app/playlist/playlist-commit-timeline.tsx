import { useEffect, useState } from 'react';
import {
  Timeline,
  Text,
  Paper,
  Group,
  Badge,
  Stack,
  Box,
  Collapse,
  UnstyledButton,
  HoverCard,
  ActionIcon,
  Button,
  Tooltip,
  Modal,
} from '@mantine/core';
import {
  IconGitCommit,
  IconChevronDown,
  IconChevronRight,
  IconClock,
  IconBookmark,
  IconBookmarkFilled,
  IconFileDiff,
} from '@tabler/icons-react';
import { Commit } from '@/types/commits';
import { useKeepCommit } from '@/hooks/useKeepCommit';
import { useUnkeepCommit } from '@/hooks/useUnkeepCommit';
import { useKeptCommits } from '@/hooks/useKeptCommits';
import { useSpotifyUser } from '@/hooks/useSpotifyUser';
import { useSpotifySongs } from '@/hooks/useSpotifySongs';

interface CommitGroup {
  label: string;
  period: string;
  commits: Commit[];
}

function groupCommitsByPeriod(commits: Commit[]): CommitGroup[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const thisWeek = new Date(today);
  thisWeek.setDate(thisWeek.getDate() - 7);
  const thisMonth = new Date(today);
  thisMonth.setDate(thisMonth.getDate() - 30);

  const groups: CommitGroup[] = [
    { label: 'Today', period: 'today', commits: [] },
    { label: 'Yesterday', period: 'yesterday', commits: [] },
    { label: 'This Week', period: 'week', commits: [] },
    { label: 'This Month', period: 'month', commits: [] },
    { label: 'Older', period: 'older', commits: [] },
  ];

  commits.forEach((commit) => {
    const commitDate = new Date(commit.timestamp);

    if (commitDate >= today) {
      groups[0].commits.push(commit);
    } else if (commitDate >= yesterday) {
      groups[1].commits.push(commit);
    } else if (commitDate >= thisWeek) {
      groups[2].commits.push(commit);
    } else if (commitDate >= thisMonth) {
      groups[3].commits.push(commit);
    } else {
      groups[4].commits.push(commit);
    }
  });

  return groups.filter((group) => group.commits.length > 0);
}

function getRelativeTime(date: string): string {
  const dateObj = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: dateObj.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

interface CommitItemProps {
  commit: Commit;
  isSelected: boolean;
  onSelect: (commit: Commit) => void;
  isKept: boolean;
  onKeep: (commit: Commit) => void;
  onUnkeep: (commit: Commit, deletePlaylist: boolean) => void;
  onSeeDiff?: (commit: Commit) => void;
  isDiffTarget?: boolean;
}

function CommitItem({
  commit,
  isSelected,
  onSelect,
  isKept,
  onKeep,
  onUnkeep,
  onSeeDiff,
  isDiffTarget = false,
}: CommitItemProps) {
  const [showUnkeepModal, setShowUnkeepModal] = useState(false);

  const addedTrackIds = commit.diff.added.map((t) => t.trackId);
  const { data: tracksData } = useSpotifySongs(
    addedTrackIds.length > 0 ? addedTrackIds : undefined,
  );

  const getChangeDescription = () => {
    const addedCount = commit.diff.added.length;
    const removedCount = commit.diff.removed.length;

    if (addedCount > 0 && removedCount === 0) {
      if (addedCount === 1 && tracksData?.tracks[0]) {
        return `Added ${tracksData.tracks[0].artists[0].name} - "${tracksData.tracks[0].name}"`;
      }
      if (addedCount > 1 && tracksData?.tracks[0]) {
        return `Added "${tracksData.tracks[0].name}" + ${addedCount - 1}`;
      }
      return `Added ${addedCount} ${addedCount === 1 ? 'song' : 'songs'}`;
    }

    if (removedCount > 0 && addedCount === 0) {
      return `Removed ${removedCount} ${removedCount === 1 ? 'song' : 'songs'}`;
    }

    if (addedCount > 0 && removedCount > 0) {
      return `Added ${addedCount}, removed ${removedCount}`;
    }

    return 'No changes';
  };

  return (
    <>
      <Box
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          border: `2px solid ${isSelected ? 'rgba(134, 142, 150, 0.45)' : 'transparent'}`,
          backgroundColor: isSelected ? 'rgba(134, 142, 150, 0.14)' : 'transparent',
          transition: 'all 0.2s ease',
        }}
      >
        <Group gap="sm" wrap="nowrap">
          <UnstyledButton onClick={() => onSelect(commit)} style={{ flex: 1, minWidth: 0 }}>
            <Group gap="sm" wrap="nowrap">
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Group gap="xs">
                  <Text size="sm">{commit.userId}</Text>
                </Group>
                <Text size="xs" c="dimmed" mt={2} lineClamp={1}>
                  {getChangeDescription()}
                </Text>
                <Text size="xs" c="dimmed" mt={2}>
                  {getRelativeTime(commit.timestamp)}
                </Text>
              </Box>
            </Group>
          </UnstyledButton>

          <Tooltip label={isKept ? 'Kept' : 'Keep this commit'}>
            <ActionIcon
              variant={isKept ? 'filled' : 'subtle'}
              color={isKept ? 'blue' : 'gray'}
              onClick={(e) => {
                e.stopPropagation();
                if (isKept) {
                  setShowUnkeepModal(true);
                } else {
                  onKeep(commit);
                }
              }}
            >
              {isKept ? <IconBookmarkFilled size={18} /> : <IconBookmark size={18} />}
            </ActionIcon>
          </Tooltip>
          <Tooltip label={isSelected ? '' : isDiffTarget ? 'Viewing diff target' : 'See diff'}>
            <ActionIcon
              variant={isDiffTarget ? 'filled' : 'subtle'}
              color={isDiffTarget ? 'grape' : 'gray'}
              onClick={(e) => {
                e.stopPropagation();
                if (!isSelected) {
                  onSeeDiff?.(commit);
                }
              }}
              style={{ visibility: isSelected ? 'hidden' : 'visible' }}
              aria-hidden={isSelected}
              tabIndex={isSelected ? -1 : 0}
            >
              <IconFileDiff size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Box>

      <Modal
        opened={showUnkeepModal}
        onClose={() => setShowUnkeepModal(false)}
        title="Remove Keep"
        centered
      >
        <Stack gap="md">
          <Text>Do you want to delete the Spotify playlist as well?</Text>
          <Group gap="sm">
            <Button
              variant="outline"
              onClick={() => {
                onUnkeep(commit, false);
                setShowUnkeepModal(false);
              }}
            >
              Keep Spotify Playlist
            </Button>
            <Button
              color="red"
              onClick={() => {
                onUnkeep(commit, true);
                setShowUnkeepModal(false);
              }}
            >
              Delete Spotify Playlist
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}

interface CommitGroupProps {
  group: CommitGroup;
  selectedCommitId: string | null;
  onSelectCommit: (commit: Commit) => void;
  keptCommitIds: Set<string>;
  onKeep: (commit: Commit) => void;
  onUnkeep: (commit: Commit, deletePlaylist: boolean) => void;
  onSeeDiff?: (commit: Commit) => void;
  compareCommitId?: string | null;
}

function CommitGroupSection({
  group,
  selectedCommitId,
  onSelectCommit,
  keptCommitIds,
  onKeep,
  onUnkeep,
  onSeeDiff,
  compareCommitId,
}: CommitGroupProps) {
  const [isExpanded, setIsExpanded] = useState(group.period === 'today');

  return (
    <Timeline.Item
      bullet={<IconGitCommit size={16} />}
      title={
        <HoverCard width={280} shadow="md" withArrow openDelay={300}>
          <HoverCard.Target>
            <UnstyledButton onClick={() => setIsExpanded(!isExpanded)} style={{ width: '100%' }}>
              <Group gap="sm">
                <ActionIcon size="sm" variant="subtle">
                  {isExpanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
                </ActionIcon>
                <Text fw={600} size="lg">
                  {group.label}
                </Text>
                <Badge size="lg" variant="filled" color="blue">
                  {group.commits.length}
                </Badge>
              </Group>
            </UnstyledButton>
          </HoverCard.Target>
        </HoverCard>
      }
    >
      <Collapse in={isExpanded}>
        <Stack gap="xs" mt="md" mb="xl">
          {group.commits.map((commit) => (
            <CommitItem
              key={commit.commitId}
              commit={commit}
              isSelected={selectedCommitId === commit.commitId}
              onSelect={onSelectCommit}
              isKept={keptCommitIds.has(commit.commitId)}
              onKeep={onKeep}
              onUnkeep={onUnkeep}
              onSeeDiff={onSeeDiff}
              isDiffTarget={compareCommitId === commit.commitId}
            />
          ))}
        </Stack>
      </Collapse>
    </Timeline.Item>
  );
}

interface CommitTimelineProps {
  commits: Commit[];
  onCommitSelect?: (commit: Commit) => void;
  selectedCommitId?: string | null;
  playlistId: string;
  onSeeDiff?: (commit: Commit) => void;
  compareCommitId?: string | null;
}

export function CommitTimeline({
  commits,
  onCommitSelect,
  selectedCommitId = null,
  playlistId,
  onSeeDiff,
  compareCommitId,
}: CommitTimelineProps) {
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(selectedCommitId);
  const { data: user } = useSpotifyUser();
  const userId = user?.id;

  const { data: keptCommitsData } = useKeptCommits(userId, playlistId);
  const keptCommitIds = new Set(keptCommitsData?.keptCommits.map((kc) => kc.commitId) || []);

  const keepMutation = useKeepCommit();
  const unkeepMutation = useUnkeepCommit();

  useEffect(() => {
    setLocalSelectedId(selectedCommitId);
  }, [selectedCommitId]);

  const handleCommitSelect = (commit: Commit) => {
    setLocalSelectedId(commit.commitId);
    onCommitSelect?.(commit);
  };

  const handleKeep = (commit: Commit) => {
    if (!userId) return;
    keepMutation.mutate({
      playlistId,
      commitId: commit.commitId,
      userId,
    });
  };

  const handleUnkeep = (commit: Commit, deletePlaylist: boolean) => {
    if (!userId) return;
    unkeepMutation.mutate({
      playlistId,
      commitId: commit.commitId,
      userId,
      deleteSpotifyPlaylist: deletePlaylist,
    });
  };

  const groupedCommits = groupCommitsByPeriod(commits);

  if (commits.length === 0) {
    return (
      <Paper p="xl" withBorder>
        <Stack align="center" gap="md">
          <IconGitCommit size={48} color="gray" />
          <Text c="dimmed">No commits found</Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper p="md" withBorder>
      <Group gap="xs" mb="lg">
        <IconClock size={20} />
        <Text size="xl" fw={700}>
          Commit Timeline
        </Text>
        <Badge variant="light">{commits.length} total</Badge>
      </Group>

      <Timeline active={groupedCommits.length} bulletSize={24} lineWidth={2}>
        {groupedCommits.map((group) => (
          <CommitGroupSection
            key={group.period}
            group={group}
            selectedCommitId={localSelectedId}
            onSelectCommit={handleCommitSelect}
            keptCommitIds={keptCommitIds}
            onKeep={handleKeep}
            onUnkeep={handleUnkeep}
            onSeeDiff={onSeeDiff}
            compareCommitId={compareCommitId}
          />
        ))}
      </Timeline>
    </Paper>
  );
}

export default CommitTimeline;
