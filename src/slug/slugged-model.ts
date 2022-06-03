import { Logger } from "@nestjs/common";
import { BeforeCreate, BeforeUpdate, Column, DataType, Default, Length, Unique } from "sequelize-typescript";
import { Slug } from "./slug";
import { Model } from "src/model";

/**
 * Sequelize Model with a slug
 * The model that extends this class must call its constructor with a getter for the slug's source
 */
export abstract class SluggedModel extends Model {
	abstract get slugSource(): string;

	@Length({ min: 1 })
	@Column({ allowNull: false })
	slug: string;

	buildSlugIfNull(): string {
		if (this.slug == null) {
			this.slug = new Slug(this.slugSource).toString();
		}
		return this.slug;
	}
}