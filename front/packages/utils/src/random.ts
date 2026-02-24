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

export const getRandomNumber = () => {
	return Math.floor(Math.random() * 10000);
};

// Stolen from https://stackoverflow.com/questions/16801687/javascript-random-ordering-with-seed

export function shuffle<T>(array: T[], seed?: number) {
	seed ??= getRandomNumber();
	let m = array.length;
	while (m) {
		const i = Math.floor(random(seed) * m--);
		const t = array[m];
		array[m] = array[i];
		array[i] = t;
		++seed;
	}

	return array;
}

function random(seed: number) {
	const x = Math.sin(seed++) * 10000;
	return x - Math.floor(x);
}
