import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

const { apiPropertyMock, apiPropertyOptionalMock } = vi.hoisted(() => ({
	apiPropertyMock: vi.fn((_options: unknown) => {
		return (_target: unknown, _propertyKey: string) => {};
	}),
	apiPropertyOptionalMock: vi.fn((_options: unknown) => {
		return (_target: unknown, _propertyKey: string) => {};
	}),
}));

vi.mock('@nestjs/swagger', () => ({
	ApiProperty: apiPropertyMock,
	ApiPropertyOptional: apiPropertyOptionalMock,
}));

import { createZodDto } from '../src/create-zod-dto';

describe('createZodDto', () => {
	beforeEach(() => {
		apiPropertyMock.mockClear();
		apiPropertyOptionalMock.mockClear();
	});

	it('creates a class with ApiProperty decorators from an OpenAPI schema', () => {
		const Dto = createZodDto(
			z.object({
				name: z.string().describe('User name'),
				age: z.number().int().describe('User age').optional(),
			}),
		);

		expect(apiPropertyMock).toHaveBeenCalledTimes(1);
		expect(apiPropertyMock).toHaveBeenCalledWith({
			type: 'string',
			description: 'User name',
			required: true,
		});

		expect(apiPropertyOptionalMock).toHaveBeenCalledTimes(1);
		expect(apiPropertyOptionalMock).toHaveBeenCalledWith({
			type: 'integer',
			description: 'User age',
			required: false,
		});

		const instance = new Dto();
		expect(instance).toHaveProperty('name');
		expect(instance).toHaveProperty('age');
	});

	it('creates a class with default values', () => {
		const Dto = createZodDto(
			z.object({
				name: z.string(),
				status: z.string().default('active'),
			}),
		);

		expect(apiPropertyMock).toHaveBeenCalledTimes(1);
		expect(apiPropertyMock).toHaveBeenCalledWith({
			type: 'string',
			required: true,
		});

		expect(apiPropertyOptionalMock).toHaveBeenCalledTimes(1);
		expect(apiPropertyOptionalMock).toHaveBeenCalledWith({
			type: 'string',
			default: 'active',
			required: false,
		});

		const instance = new Dto();
		expect(instance.status).toBe('active');
	});

	it('handles nullable types correctly', () => {
		createZodDto(
			z.object({
				value: z.string().uuid().nullable(),
			}),
		);

		expect(apiPropertyMock).toHaveBeenCalledTimes(1);
		expect(apiPropertyMock).toHaveBeenCalledWith({
			type: 'string',
			format: 'uuid',
			nullable: true,
			required: true,
		});
	});

	it('handles enum properties', () => {
		createZodDto(
			z.object({
				role: z
					.enum(['admin', 'user', 'guest'])
					.describe('User role')
					.optional(),
			}),
		);

		expect(apiPropertyOptionalMock).toHaveBeenCalledTimes(1);
		expect(apiPropertyOptionalMock).toHaveBeenCalledWith({
			type: 'string',
			enum: ['admin', 'user', 'guest'],
			description: 'User role',
			required: false,
		});
	});

	it('throws when a property schema is boolean', () => {
		expect(() => createZodDto({} as any)).toThrow();
	});

	it('returns an instantiable class', () => {
		const Dto = createZodDto(
			z.object({
				name: z.string(),
				age: z.number().int().default(25),
			}),
		);

		const instance = new Dto();
		expect(instance).toBeInstanceOf(Dto);
		expect(instance.name).toBeUndefined();
		expect(instance.age).toBe(25);
	});

	describe('Zod compatibility', () => {
		it('accepts a Zod generated JSON schema', () => {
			const zodSchema = z.object({
				name: z.string().min(1).describe('Name'),
				email: z.string().email().describe('Email address'),
				status: z
					.enum(['active', 'inactive'])
					.describe('User status')
					.optional(),
				page: z.number().int().default(1).describe('Page number'),
			});

			const Dto = createZodDto(zodSchema);

			const instance = new Dto();
			expect(instance).toBeInstanceOf(Dto);

			expect(apiPropertyMock).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'string',
					description: 'Name',
					required: true,
				}),
			);

			expect(apiPropertyMock).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'string',
					description: 'Email address',
					required: true,
				}),
			);

			expect(apiPropertyOptionalMock).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'string',
					description: 'User status',
					enum: ['active', 'inactive'],
					required: false,
				}),
			);

			expect(apiPropertyOptionalMock).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'integer',
					description: 'Page number',
					default: 1,
					required: false,
				}),
			);
		});

		it('handles Zod nullable fields', () => {
			const zodSchema = z.object({
				bio: z.string().nullable().describe('User bio'),
			});

			createZodDto(zodSchema);

			expect(apiPropertyMock).toHaveBeenCalledWith(
				expect.objectContaining({
					description: 'User bio',
					nullable: true,
					required: true,
				}),
			);
		});
	});
});
