export type NotificationType =
  | 'INVITE_RECEIVED'
  | 'INVITE_ACCEPTED'
  | 'EPISODE_SCORED';

export type CardVariant = 'action' | 'info' | 'navigation';

export interface AppNotification {
  id: number;
  type: NotificationType;
  read: boolean;
  createdAt: string;        // UTC ISO string
  groupId: number;
  groupName: string;
  actorUsername?: string;
  episodeTitle?: string;
  episodeNumber?: number;
  invitationId?: number;    // GroupMember id — present for INVITE_RECEIVED
}

export function getCardVariant(type: NotificationType): CardVariant {
  switch (type) {
    case 'INVITE_RECEIVED': return 'action';
    case 'INVITE_ACCEPTED': return 'info';
    case 'EPISODE_SCORED':  return 'navigation';
  }
}

export function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
