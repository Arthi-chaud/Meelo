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

import { Scrobbler as ScrobblerEnum } from "src/prisma/generated/client";

export type ScrobbleData = {
	artistName: string;
	songName: string;
	playedAt: Date;
	duration: number | null;
};

interface Scrobbler<T = object> {
	name: ScrobblerEnum;

	// Scrobbles will be sorted by play date.
	// The list will never be empty
	//
	// The return value should be the play date of the last successfully
	// submitted scrobble. It should throw if no scrobbles were pushed
	pushScrobbles(scrobbles: ScrobbleData[], userSetting: T): Promise<Date>;
}

export default Scrobbler;
