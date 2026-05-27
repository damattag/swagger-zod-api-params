import { describe, expect, it } from 'vitest';
import { ZodError, z } from 'zod';
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

	it('should throw ZodError when validation fails', () => {
		const schema = z.object({
			name: z.string(),
			age: z.number(),
		});

		class TestDto extends createZodDto(schema) {}

		const value = { name: 'John', age: 'invalid' };
		const metadata = { metatype: TestDto, type: 'body' } as any;

		expect(() => pipe.transform(value, metadata)).toThrow(ZodError);
	});

	it('should include detailed error messages in ZodError', () => {
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
			expect(error).toBeInstanceOf(ZodError);
			const issues = error.issues;
			expect(issues).toHaveLength(2);
			expect(issues[0]).toMatchObject({
				path: ['email'],
			});
			expect(issues[1]).toMatchObject({
				path: ['count'],
				code: 'too_small',
			});
		}
	});

	it('should throw Error when schema is not found on metatype', () => {
		const value = { name: 'John' };
		const metadata = { metatype: class {}, type: 'body' } as any;

		expect(() => pipe.transform(value, metadata)).toThrow('Schema not found');
	});

	it('should return value when metatype is primitive', () => {
		const value = 'test';
		const metadata = { metatype: String, type: 'body' } as any;

		expect(pipe.transform(value, metadata)).toBe(value);
	});

	it('should return value when metatype is undefined', () => {
		const value = { name: 'John' };
		const metadata = { metatype: undefined, type: 'body' } as any;

		expect(pipe.transform(value, metadata)).toBe(value);
	});
});
