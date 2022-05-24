import { AutoIncrement, BeforeCreate, BeforeUpdate, BelongsTo, Column, Default, ForeignKey, HasMany, HasOne, Is, Model, Table, Unique } from 'sequelize-typescript';
import { File } from 'src/file/models/file.model';
import buildSlug from 'src/utils/build-slug';

@Table({ tableName: 'libraries' })
export class Library extends Model {
	@BeforeUpdate
	@BeforeCreate
	static setSlug(instance: Library) {
		instance.slug = buildSlug(instance.name);
	}

	@Unique
	@Column({ allowNull: false })
	name: string;

	@Column({ allowNull: false })
	path: string;

	@HasMany(() => File)
	files: File[];

	@Unique
	@Column
	slug: string;
}