import {
	type ArgumentMetadata,
	BadRequestException,
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
		const schema = metatype?.schema;

		if (!schema) {
			throw new Error('Schema not found');
		}

		const result = schema.safeParse(value);

		if (!result.success) {
			throw new BadRequestException({
				message: 'Validation failed',
				errors: result.error.issues.map((issue) => ({
					path: issue.path.join('.'),
					message: issue.message,
					code: issue.code,
				})),
			});
		}

		return result.data;
	}
}
