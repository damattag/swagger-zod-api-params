import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createZodDto } from '../src/create-zod-dto';

const DECORATORS_API_MODEL_PROPERTIES = 'swagger/apiModelProperties';
const DECORATORS_API_MODEL_PROPERTIES_ARRAY = 'swagger/apiModelPropertiesArray';

describe('createZodDto Nest compatibility', () => {
	it('registers Swagger ApiProperty metadata on class properties', () => {
		const Dto = createZodDto(
			z.object({
				name: z.string().describe('User name'),
				age: z.number().int().default(25).describe('User age'),
				status: z.enum(['active', 'inactive']).nullable().optional(),
			}),
		);

		const instance = new Dto();
		expect(instance).toBeInstanceOf(Dto);

		const nameMetadata = Reflect.getMetadata(
			DECORATORS_API_MODEL_PROPERTIES,
			Dto.prototype,
			'name',
		);

		expect(nameMetadata).toBeDefined();
		expect(nameMetadata).toMatchObject({
			type: 'string',
			description: 'User name',
			required: true,
		});

		const ageMetadata = Reflect.getMetadata(
			DECORATORS_API_MODEL_PROPERTIES,
			Dto.prototype,
			'age',
		);

		expect(ageMetadata).toBeDefined();
		expect(ageMetadata).toMatchObject({
			type: 'integer',
			description: 'User age',
			default: 25,
			required: false,
		});

		const statusMetadata = Reflect.getMetadata(
			DECORATORS_API_MODEL_PROPERTIES,
			Dto.prototype,
			'status',
		);

		expect(statusMetadata).toBeDefined();
		expect(statusMetadata).toMatchObject({
			type: 'string',
			nullable: true,
			enum: ['active', 'inactive'],
		});

		const propsArray = Reflect.getMetadata(
			DECORATORS_API_MODEL_PROPERTIES_ARRAY,
			Dto.prototype,
		);

		expect(propsArray).toBeDefined();
		expect(propsArray).toContain(':name');
		expect(propsArray).toContain(':age');
		expect(propsArray).toContain(':status');
	});

	it('produces a class usable as a NestJS DTO type', () => {
		const Dto = createZodDto(
			z.object({
				email: z.string().email(),
				role: z.enum(['admin', 'user']).default('user'),
			}),
		);

		const instance = new Dto();
		expect(instance.email).toBeUndefined();
		expect(instance.role).toBe('user');

		instance.email = 'test@example.com';
		expect(instance.email).toBe('test@example.com');
	});
});
