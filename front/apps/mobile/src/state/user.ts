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

import { Buffer } from "buffer";
import { atom } from "jotai";
import { at } from "lodash";
import { storage } from "~/utils/storage";

const CurrentInstanceKey = "current-instance";
const OtherInstancesKey = "other-instances";

export type MeeloInstance = {
	url: string;
	accessToken: string;
	// For visual purposes
	username: string;
};

const normalizeInstance = (instance: MeeloInstance): MeeloInstance => {
	return {
		...instance,
		url: instance.url.replace(/\/$/, ""),
	};
};

const removeDuplicates = (instances: MeeloInstance[]): MeeloInstance[] => {
	return instances.filter((instance, idx) => {
		const otherInstanceIndex = instances.findIndex(
			(instance_) =>
				instance_.url === instance.url &&
				instance_.username === instance.username,
		);
		return otherInstanceIndex === idx;
	});
};

const restoreCurrentInstanceFromLocalStorage = () => {
	const currentInstanceStr = storage.getString(CurrentInstanceKey);
	if (currentInstanceStr) {
		const currentInstance = JSON.parse(
			Buffer.from(currentInstanceStr, "base64").toString("utf-8"),
		);
		// TODO Validate
		return currentInstance as MeeloInstance;
	}
	return null;
};

const restoreOtherInstancesFromLocalStorage = () => {
	const otherInstancesStr = storage.getString(OtherInstancesKey);
	if (otherInstancesStr) {
		const otherInstances = JSON.parse(
			Buffer.from(otherInstancesStr, "base64").toString("utf-8"),
		);
		// TODO Validate
		return otherInstances as MeeloInstance[];
	}
	return [];
};

const _currentInstanceAtom = atom<MeeloInstance | null>(
	restoreCurrentInstanceFromLocalStorage(),
);
const _otherInstancesAtom = atom<MeeloInstance[]>(
	restoreOtherInstancesFromLocalStorage(),
);

const serialiseInstance = (i: MeeloInstance | MeeloInstance[]) => {
	return Buffer.from(JSON.stringify(i), "utf-8").toString("base64");
};

export const currentInstanceAtom = atom<
	MeeloInstance | null,
	[MeeloInstance | null],
	void
>(
	(get) => get(_currentInstanceAtom),
	(_, set, data) => {
		if (data) {
			data = normalizeInstance(data);
		}
		set(_currentInstanceAtom, data);
		if (data !== null) {
			storage.set(CurrentInstanceKey, serialiseInstance(data));
		} else {
			storage.remove(CurrentInstanceKey);
		}
	},
);

export const otherInstancesAtom = atom<
	MeeloInstance[],
	[MeeloInstance[]],
	void
>(
	(get) => get(_otherInstancesAtom),
	(_, set, data) => {
		data = removeDuplicates(data.map(normalizeInstance));
		set(_otherInstancesAtom, data);
		storage.set(OtherInstancesKey, serialiseInstance(data));
	},
);

// Move current instance (if any) to the list of other instances
export const popCurrentInstanceAtom = atom(null, (get, set) => {
	const currentInstance = get(currentInstanceAtom);
	const otherInstances = get(otherInstancesAtom);
	if (currentInstance)
		set(otherInstancesAtom, [currentInstance, ...otherInstances]);
	set(currentInstanceAtom, null);
});

export const deleteOtherInstanceAtom = atom(
	null,
	(get, set, instance: MeeloInstance) => {
		const otherInstances = get(otherInstancesAtom);
		set(
			otherInstancesAtom,
			otherInstances.filter((i) => {
				return !(
					i.url === instance.url && i.username === instance.username
				);
			}),
		);
	},
);
