import { useState } from 'react';
import {
  Timeline,
  Text,
  Paper,
  Group,
  Badge,
  Avatar,
  Stack,
  Box,
  Collapse,
  UnstyledButton,
  HoverCard,
  ActionIcon,
  Code,
} from '@mantine/core';
import {
  IconGitCommit,
  IconChevronDown,
  IconChevronRight,
  IconClock,
  IconCalendar,
} from '@tabler/icons-react';
import { Commit } from '@/types/commits';

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
}

function CommitItem({ commit, isSelected, onSelect }: CommitItemProps) {
  return (
    <UnstyledButton
      onClick={() => onSelect(commit)}
      style={{
        width: '100%',
        padding: '12px',
        borderRadius: '8px',
        border: `2px solid ${isSelected ? '#228be6' : 'transparent'}`,
        backgroundColor: isSelected ? '#f0f7ff' : 'transparent',
        transition: 'all 0.2s ease',
      }}
    >
      <Group gap="sm" wrap="nowrap">
        <Avatar size="sm" radius="xl">
          {commit.userId.charAt(0).toUpperCase()}
        </Avatar>

        <Box style={{ flex: 1, minWidth: 0 }}>
          <Group gap="xs">
            <Code style={{ fontSize: '11px' }}>{commit.commitId}</Code>
            <Text size="sm" c="dimmed">
              by {commit.userId}
            </Text>
          </Group>
          <Text size="xs" c="dimmed" mt={4}>
            {getRelativeTime(commit.timestamp)}
          </Text>
        </Box>
      </Group>
    </UnstyledButton>
  );
}

interface CommitGroupProps {
  group: CommitGroup;
  selectedCommitId: string | null;
  onSelectCommit: (commit: Commit) => void;
}

function CommitGroupSection({ group, selectedCommitId, onSelectCommit }: CommitGroupProps) {
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

          <HoverCard.Dropdown>
            <Stack gap="xs">
              <Group gap="xs">
                <IconCalendar size={16} />
                <Text size="sm" fw={600}>
                  {group.label}
                </Text>
              </Group>
              <Text size="xs" c="dimmed">
                {group.commits.length} commit{group.commits.length !== 1 ? 's' : ''}
              </Text>
              <Box mt="xs">
                {group.commits.slice(0, 3).map((commit) => (
                  <Text key={commit.commitId} size="xs" lineClamp={1} mb={4}>
                    • {commit.commitId} by {commit.userId}
                  </Text>
                ))}
                {group.commits.length > 3 && (
                  <Text size="xs" c="dimmed" fs="italic">
                    and {group.commits.length - 3} more...
                  </Text>
                )}
              </Box>
              <Text size="xs" c="dimmed" fs="italic" mt="xs">
                Click to {isExpanded ? 'collapse' : 'expand'}
              </Text>
            </Stack>
          </HoverCard.Dropdown>
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
}

export function CommitTimeline({
  commits,
  onCommitSelect,
  selectedCommitId = null,
}: CommitTimelineProps) {
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(selectedCommitId);

  const handleCommitSelect = (commit: Commit) => {
    setLocalSelectedId(commit.commitId);
    onCommitSelect?.(commit);
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
          />
        ))}
      </Timeline>
    </Paper>
  );
}

export default CommitTimeline;
