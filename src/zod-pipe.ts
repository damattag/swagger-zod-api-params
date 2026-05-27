import {
	type ArgumentMetadata,
	Injectable,
	type PipeTransform,
} from '@nestjs/common';
import type { ZodType } from 'zod';

type ZodDtoLike = {
	schema?: ZodType;
};

@Injectable()
export class ZodValidationPipe implements PipeTransform {
	transform(value: unknown, metadata: ArgumentMetadata) {
		const metatype = metadata.metatype as ZodDtoLike | undefined;

		if (!metatype || this.isPrimitive(metatype)) {
			return value;
		}

		const schema = metatype.schema;

		if (!schema) {
			throw new Error('Schema not found');
		}

		return schema.parse(value);
	}

	private isPrimitive(metatype: unknown): boolean {
		const primitives = [String, Number, Boolean, Array, Object];
		return primitives.includes(metatype as never);
	}
}
