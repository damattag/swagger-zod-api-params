import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createZodDto } from '../src/create-zod-dto';
import { ZodValidationPipe } from '../src/zod-pipe';

describe('ZodValidationPipe', () => {
	const pipe = new ZodValidationPipe();

	it('should validate and return the value when it matches the schema', () => {
		const schema = z.object({
			name: z.string(),
			age: z.number(),
		});

		class TestDto extends createZodDto(schema) {}

		const value = { name: 'John', age: 30 };
		const metadata = { metatype: TestDto, type: 'body' } as any;

		expect(pipe.transform(value, metadata)).toEqual(value);
	});

	it('should throw BadRequestException when validation fails', () => {
		const schema = z.object({
			name: z.string(),
			age: z.number(),
		});

		class TestDto extends createZodDto(schema) {}

		const value = { name: 'John', age: 'invalid' };
		const metadata = { metatype: TestDto, type: 'body' } as any;

		expect(() => pipe.transform(value, metadata)).toThrow(BadRequestException);
	});

	it('should include detailed error messages in BadRequestException', () => {
		const schema = z.object({
			email: z.string().email(),
			count: z.number().min(1),
		});

		class TestDto extends createZodDto(schema) {}

		const value = { email: 'invalid-email', count: 0 };
		const metadata = { metatype: TestDto, type: 'body' } as any;

		try {
			pipe.transform(value, metadata);
		} catch (error: any) {
			expect(error).toBeInstanceOf(BadRequestException);
			const response = error.getResponse();
			expect(response.message).toBe('Validation failed');
			expect(response.errors).toHaveLength(2);
			expect(response.errors[0]).toMatchObject({
				path: 'email',
				code: 'invalid_format',
			});
			expect(response.errors[1]).toMatchObject({
				path: 'count',
				code: 'too_small',
			});
		}
	});

	it('should throw Error when schema is not found on metatype', () => {
		const value = { name: 'John' };
		const metadata = { metatype: class {}, type: 'body' } as any;

		expect(() => pipe.transform(value, metadata)).toThrow('Schema not found');
	});
});
