import { Column, ForeignKey, Is, Model, Table, Unique } from 'sequelize-typescript';
import { Library } from 'src/library/models/library.model';

/**
 * A file represent the source file from which a track is imported
 */
@Table({ tableName: 'files' })
export class File extends Model {
	/**
	 * The path of the file, relate to the parent library
	 */
	@Unique
	@Column({ allowNull: false })
	path: string;

	/**
	 * The MD5 Checksum of the source file
	 */
	@Is('MD5 Checksum', (value) => RegExp('^[a-f0-9]{32}$').test(value))
	@Column({ allowNull: false })
	md5Checksum: string;

	/**
	 * The date of the file's registration date
	 */
	@Column({ allowNull: false })
	registerDate: Date;

	/**
	 * The parent library
	 */
	@ForeignKey(() => Library)
	library: Library;
}