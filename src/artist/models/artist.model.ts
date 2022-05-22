import { AutoIncrement, BeforeCreate, BeforeUpdate, BelongsTo, Column, Default, ForeignKey, HasMany, Is, Model, Table, Unique } from 'sequelize-typescript';
import { Album } from 'src/album/models/album.model';
import buildSlug from 'src/utils/build_slug';

@Table({ tableName: 'artists' })
export class Artist extends Model {
	@Column({ allowNull: false })
	name: string;

	@Column
	slug: string;

	@HasMany(() => Album)
	albums: Album[];

	@BeforeCreate
	@BeforeUpdate
	static setSlug(instance: Artist) {
		instance.slug = buildSlug(instance.name);
	}
}