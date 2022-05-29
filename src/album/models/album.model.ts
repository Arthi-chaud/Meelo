import { AfterDefine, AutoIncrement, BeforeCreate, BeforeUpdate, BelongsTo, Column, DataType, Default, ForeignKey, HasMany, HasOne, Is, Model, Table, Unique } from 'sequelize-typescript';
import { Artist } from 'src/artist/models/artist.model';
import { Release } from 'src/release/models/release.model';
import { Slug } from 'src/slug/slug';
import { SluggedModel } from 'src/slug/slugged-model';

/**
 * An album is a record of releases.
 */
@Table({ tableName: 'albums' })
export class Album extends SluggedModel {
	/**
	 * The title of the album
	 * It should not include descriptive suffixes like 'Deluxe Edition' of 'Explicit Version' 
	 */
	@Column({ allowNull: false })
	name: string;
	
	/**
	 * The artist of the album
	 * This filed is nullable, as albums may not have an entitled artist, like compilations
	 */
	@ForeignKey(() => Artist)
	artist?: Artist;
	
	/**
	 * The date of the first release of the album
	 */
	@Column
	releaseDate: Date;
	
	/**
	 * Collections of related releases
	 */
	@HasMany(() => Release)
	releases: Release[];

	/**
	 * Describes the type of the album
	 */
	@Column
	type: AlbumType;

	get slugSource(): string {
		return this.name;
	}
}