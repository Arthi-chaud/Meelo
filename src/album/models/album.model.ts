import { AutoIncrement, BeforeCreate, BeforeUpdate, BelongsTo, Column, Default, ForeignKey, HasMany, HasOne, Is, Model, Table, Unique } from 'sequelize-typescript';
import { Artist } from 'src/artist/models/artist.model';
import { Release } from 'src/release/models/release.model';

@Table({ tableName: 'albums' })
export class Album extends Model {
	@Column({ allowNull: false })
	name: string;

	@Column({ allowNull: false })
	slug: string;
	
	@ForeignKey(() => Artist)
	artist: Artist;
	
	@Column
	releaseDate: Date;
	
	@HasMany(() => Release)
	releases: Release[];

	@Column
	type: AlbumType;
	
	@BeforeCreate
	@BeforeUpdate
	static setSlug(instance: Album) {
		instance.slug = buildSlug(instance.name);
	}
}