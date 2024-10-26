/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Injectable } from "@nestjs/common";
import Logger from "src/logger/logger";
import {
	ClientProxy,
	ClientProxyFactory,
	Transport,
} from "@nestjs/microservices";
import { catchError } from "rxjs";

const QueueName = "meelo";

type ResourceCreationEventType = "artist" | "album" | "song";

@Injectable()
export class EventsService {
	private logger: Logger = new Logger(EventsService.name);
	private client: ClientProxy;

	constructor() {
		this.client = ClientProxyFactory.create({
			transport: Transport.RMQ,
			options: {
				urls: [process.env.RABBITMQ_URL!],
				queue: QueueName,
				queueOptions: {
					durable: true,
				},
			},
		});
	}

	publishItemCreationEvent(
		resourceType: ResourceCreationEventType,
		name: string,
		id: number,
	) {
		const dto = {
			event: "created",
			type: resourceType,
			name,
			id,
		};
		this.client.emit("", dto).pipe(
			catchError((e, rest) => {
				this.logger.error(
					"An error occured while publishing message to queue:",
				);
				this.logger.error(e);
				return rest;
			}),
		);
	}
}