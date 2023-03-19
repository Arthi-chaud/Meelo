import { Prisma } from "@prisma/client";

const eventTypes = ['created', 'updated', 'deleted'] as const;

/**
 * Elements for keys to events related to repositories
 */
namespace RepositoryEvent {
	/**
	 * The type of event from the repository
	 */
	export type EventType = typeof eventTypes[number];
	/**
	 * The reposiory / table that triggered the event
	 */
	export type EventRepository = Prisma.ModelName;
}

export default RepositoryEvent;

