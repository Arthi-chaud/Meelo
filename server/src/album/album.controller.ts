import {
	Body, Controller, Get, Inject, Post, Query, forwardRef
} from '@nestjs/common';
import { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import ReleaseQueryParameters from 'src/release/models/release.query-parameters';
import ReleaseService from 'src/release/release.service';
import compilationAlbumArtistKeyword from 'src/constants/compilation';
import AlbumService from './album.service';
import AlbumQueryParameters from './models/album.query-parameters';
import {
	ApiOperation, ApiPropertyOptional, ApiTags, IntersectionType
} from '@nestjs/swagger';
import UpdateAlbumDTO from './models/update-album.dto';
import { AlbumResponseBuilder } from './models/album.response';
import { ReleaseResponseBuilder } from 'src/release/models/release.response';
import RelationIncludeQuery from 'src/relation-include/relation-include-query.decorator';
import Admin from 'src/authentication/roles/admin.decorator';
import IdentifierParam from 'src/identifier/identifier.pipe';
import Response, { ResponseType } from 'src/response/response.decorator';
import GenreService from 'src/genre/genre.service';
import GenreQueryParameters from 'src/genre/models/genre.query-parameters';
import {
	IsEnum, IsNumber, IsOptional, IsPositive
} from 'class-validator';
import { AlbumType } from '@prisma/client';
import ArtistQueryParameters from 'src/artist/models/artist.query-parameters';
import TransformIdentifier from 'src/identifier/identifier.transform';
import ArtistService from 'src/artist/artist.service';
import LibraryQueryParameters from 'src/library/models/library.query-parameters';
import LibraryService from 'src/library/library.service';

class Selector extends IntersectionType(
	AlbumQueryParameters.SortingParameter
) {
	@IsEnum(AlbumType, {
		message: () => `Album Type: Invalid value. Expected one of theses: ${Object.keys(AlbumType)}`
	})
	@IsOptional()
	@ApiPropertyOptional({
		enum: AlbumType,
		description: 'Filter the albums by type'
	})
	type?: AlbumType;

	@IsOptional()
	@ApiPropertyOptional({
		description: `Filter albums by album artist, using their identifier.<br/>
		For compilation albums, use '${compilationAlbumArtistKeyword}'`
	})
	@TransformIdentifier(ArtistService)
	artist?: ArtistQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: `Get albums where an artist appear (i.e. is not their main artist), using their identifier.`
	})
	@TransformIdentifier(ArtistService)
	appearance?: ArtistQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: 'Filter albums by genre'
	})
	@TransformIdentifier(GenreService)
	genre?: GenreQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: 'Search albums using a string token'
	})
	query?: string;

	@IsOptional()
	@ApiPropertyOptional({
		description: 'Filter albums by library'
	})
	@TransformIdentifier(LibraryService)
	library?: LibraryQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: 'Get related albums (i.e. from the same album artist & have at least one song in common)'
	})
	@TransformIdentifier(AlbumService)
	related?: AlbumQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: 'The Seed to Sort the items'
	})
	@IsNumber()
	@IsPositive()
	random?: number;
}

@ApiTags("Albums")
@Controller('albums')
export default class AlbumController {
	constructor(
		@Inject(forwardRef(() => ReleaseService))
		private releaseService: ReleaseService,
		@Inject(forwardRef(() => AlbumService))
		private albumService: AlbumService,
	) {}

	@Get()
	@Response({
		handler: AlbumResponseBuilder,
		type: ResponseType.Page
	})
	@ApiOperation({ summary: 'Get many albums' })
	async getMany(
		@Query() selector: Selector,
		@Query()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(AlbumQueryParameters.AvailableAtomicIncludes)
		include: AlbumQueryParameters.RelationInclude,
	) {
		if (selector.query) {
			return this.albumService.search(
				selector.query,
				selector,
				paginationParameters,
				include,
				selector
			);
		}
		return this.albumService.getMany(
			selector,
			paginationParameters,
			include,
			selector.random || selector
		);
	}

	@ApiOperation({
		summary: 'Get one album'
	})
	@Get(':idOrSlug')
	@Response({ handler: AlbumResponseBuilder })
	async get(
		@RelationIncludeQuery(AlbumQueryParameters.AvailableAtomicIncludes)
		include: AlbumQueryParameters.RelationInclude,
		@IdentifierParam(AlbumService)
		where: AlbumQueryParameters.WhereInput,
	) {
		return this.albumService.get(
			where,
			include
		);
	}

	@ApiOperation({
		summary: 'Get the master release of an album'
	})
	@Response({ handler: ReleaseResponseBuilder })
	@Get(':idOrSlug/master')
	async getAlbumMaster(
		@RelationIncludeQuery(ReleaseQueryParameters.AvailableAtomicIncludes)
		include: ReleaseQueryParameters.RelationInclude,
		@IdentifierParam(AlbumService)
		where: AlbumQueryParameters.WhereInput,
	) {
		return this.releaseService.getMasterRelease(
			where,
			include
		);
	}

	@ApiOperation({
		summary: 'Update the album'
	})
	@Admin()
	@Response({ handler: AlbumResponseBuilder })
	@Post(':idOrSlug')
	async updateAlbum(
		@IdentifierParam(AlbumService)
		where: AlbumQueryParameters.WhereInput,
		@Body() updateDTO: UpdateAlbumDTO
	) {
		let album = await this.albumService.get(where);

		if (updateDTO.artistId !== undefined) {
			album = await this.albumService.reassign(
				{ id: album.id },
				updateDTO.artistId == null
					? { compilationArtist: true }
					: { id: updateDTO.artistId }
			);
			// If only the artistID is to be changed, no need to await an empty update
			if (Object.values(updateDTO).length == 1) {
				return album;
			}
		}
		return this.albumService.update(updateDTO, { id: album.id });
	}
}
