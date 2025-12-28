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

import * as yup from "yup";

export const ExternalMetadataSource = yup.object({
	url: yup.string().required(),
	providerName: yup.string().required(),
	providerId: yup.number().required(),
	providerIcon: yup.string().required(),
});

export const CommonExternalMetadata = yup.object({
	description: yup.string().required().nullable(),
	sources: yup.array(ExternalMetadataSource.required()).required(),
});

export const ArtistExternalMetadata = CommonExternalMetadata.concat(
	yup.object({
		artistId: yup.number().required(),
	}),
);
export const SongExternalMetadata = CommonExternalMetadata.concat(
	yup.object({
		songId: yup.number().required(),
	}),
);

export const ReleaseExternalMetadata = CommonExternalMetadata.concat(
	yup.object({
		releaseId: yup.number().required(),
	}),
);

export const AlbumExternalMetadata = CommonExternalMetadata.concat(
	yup.object({
		albumId: yup.number().required(),
		rating: yup.number().nullable(),
	}),
);

export type CommonExternalMetadata = yup.InferType<
	typeof CommonExternalMetadata
>;
export type ArtistExternalMetadata = yup.InferType<
	typeof ArtistExternalMetadata
>;
export type AlbumExternalMetadata = yup.InferType<typeof AlbumExternalMetadata>;
export type SongExternalMetadata = yup.InferType<typeof SongExternalMetadata>;
export type ReleaseExternalMetadata = yup.InferType<
	typeof CommonExternalMetadata
>;
export type ExternalMetadataSource = yup.InferType<
	typeof ExternalMetadataSource
>;
