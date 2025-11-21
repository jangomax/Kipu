import { useMemo } from 'react';
import { Button, Group, Loader, Modal, Stack, Text } from '@mantine/core';
import type { SpotifyTrack } from '@/types/spotify';
import { PendingDiff, summarizeDiff } from '@/util/playlistDiff';

interface UncommittedChangesModalProps {
  opened: boolean;
  pendingDiff: PendingDiff | null;
  trackInfoMap: Map<string, SpotifyTrack | undefined>;
  isLoadingRemovedDetails?: boolean;
  onClose: () => void;
  onCommit: () => void;
  isCommitPending?: boolean;
}

export const UncommittedChangesModal = ({
  opened,
  pendingDiff,
  trackInfoMap,
  isLoadingRemovedDetails,
  onClose,
  onCommit,
  isCommitPending,
}: UncommittedChangesModalProps) => {
  const addedSummary = useMemo(
    () => summarizeDiff(pendingDiff?.addedTrackIds ?? [], trackInfoMap),
    [pendingDiff?.addedTrackIds, trackInfoMap],
  );

  const removedSummary = useMemo(
    () => summarizeDiff(pendingDiff?.removedTrackIds ?? [], trackInfoMap),
    [pendingDiff?.removedTrackIds, trackInfoMap],
  );

  return (
    <Modal opened={opened} onClose={onClose} title="Uncommitted changes" centered>
      <Stack gap="sm">
        <Text size="sm">
          We spotted changes to this playlist since the last commit. Would you like to commit the
          following changes?
        </Text>

        <Stack gap={6}>
          <Text fw={600} size="sm">
            Added
          </Text>
          {addedSummary.length === 0 ? (
            <Text size="sm" c="dimmed">
              No additions
            </Text>
          ) : (
            addedSummary.map((item) => (
              <Text key={`added-${item.trackId}`} size="sm">
                {item.label} {item.count > 1 ? `×${item.count}` : ''}
              </Text>
            ))
          )}
        </Stack>

        <Stack gap={6}>
          <Text fw={600} size="sm">
            Removed
          </Text>
          {isLoadingRemovedDetails && removedSummary.length > 0 ? (
            <Group gap="xs">
              <Loader size="xs" />
              <Text size="sm" c="dimmed">
                Loading removed track details...
              </Text>
            </Group>
          ) : removedSummary.length === 0 ? (
            <Text size="sm" c="dimmed">
              No removals
            </Text>
          ) : (
            removedSummary.map((item) => (
              <Text key={`removed-${item.trackId}`} size="sm">
                {item.label} {item.count > 1 ? `×${item.count}` : ''}
              </Text>
            ))
          )}
        </Stack>

        <Group justify="flex-end" mt="xs">
          <Button variant="default" onClick={onClose} disabled={isCommitPending}>
            Not now
          </Button>
          <Button onClick={onCommit} loading={isCommitPending}>
            Commit changes
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
