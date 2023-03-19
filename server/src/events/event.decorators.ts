// eslint-disable-next-line no-restricted-imports
import { OnEvent } from '@nestjs/event-emitter';
import RepositoryEvent from '../repository/repository.events';

/**
 * Method decorator for Repository Event Handler
 */
export function OnRepositoryEvent(
	type: RepositoryEvent.EventType,
	repository: RepositoryEvent.EventRepository,
	options?: Parameters<typeof OnEvent>[1]
) {
	return OnEvent([repository, type], options);
}
