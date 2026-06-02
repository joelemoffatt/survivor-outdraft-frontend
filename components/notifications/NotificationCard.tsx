import { AppNotification, getCardVariant } from '../../types/notifications';
import ActionNotificationCard from './ActionNotificationCard';
import InfoNotificationCard from './InfoNotificationCard';
import NavigationNotificationCard from './NavigationNotificationCard';

interface Props {
  notification: AppNotification;
}

export default function NotificationCard({ notification }: Props) {
  const variant = getCardVariant(notification.type);

  switch (variant) {
    case 'action':
      return <ActionNotificationCard notification={notification} />;
    case 'info':
      return <InfoNotificationCard notification={notification} />;
    case 'navigation':
      return <NavigationNotificationCard notification={notification} />;
  }
}
