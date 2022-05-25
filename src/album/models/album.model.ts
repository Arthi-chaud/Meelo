import { AfterDefine, AutoIncrement, BeforeCreate, BeforeUpdate, BelongsTo, Column, DataType, Default, ForeignKey, HasMany, HasOne, Is, Model, Table, Unique } from 'sequelize-typescript';
import { Artist } from 'src/artist/models/artist.model';
import { Release } from 'src/release/models/release.model';
import { Slug } from 'src/slug/slug';
import { SluggedModel } from 'src/slug/slugged-model';

@Table({ tableName: 'albums' })
export class Album extends SluggedModel {
	@Column({ allowNull: false })
	name: string;
	
	@ForeignKey(() => Artist)
	artist: Artist;
	
	@Column
	releaseDate: Date;
	
	@HasMany(() => Release)
	releases: Release[];

	@Column
	type: AlbumType;

	get slugSource(): string {
		return this.name;
	}
}