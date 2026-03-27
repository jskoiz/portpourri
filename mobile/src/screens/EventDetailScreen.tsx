import type { RootStackScreenProps } from '../core/navigation/types';
import { EventDetailView } from '../features/events/components/EventDetailView';
import { useEventDetailScreenController } from '../features/events/hooks/useEventDetailScreenController';

export default function EventDetailScreen({
  route,
  navigation,
}: RootStackScreenProps<'EventDetail'>) {
  const eventId = route.params?.eventId;
  const eventDetailScreenState = useEventDetailScreenController({
    eventId,
    onBack: () => navigation.goBack(),
  });
  const event = eventDetailScreenState.event ?? route.params?.event ?? null;

  return (
    <EventDetailView
      errorMessage={eventDetailScreenState.errorMessage}
      event={event}
      isJoining={eventDetailScreenState.isJoining}
      isLoading={eventDetailScreenState.isLoading}
      onBack={eventDetailScreenState.onBack}
      onJoin={eventDetailScreenState.onJoin}
      onPressHost={() => {
        if (!event?.host) return;
        navigation.navigate('ProfileDetail', { user: event.host, userId: event.host.id });
      }}
      onRefresh={eventDetailScreenState.onRefresh}
    />
  );
}

export type { EventDetailViewProps } from '../features/events/components/EventDetailView';
export { EventDetailView };
