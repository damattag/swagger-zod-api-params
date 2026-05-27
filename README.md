# nest-swagger-zod

[![npm version](https://img.shields.io/npm/v/nest-swagger-zod.svg)](https://www.npmjs.com/package/nest-swagger-zod)
[![license](https://img.shields.io/npm/l/nest-swagger-zod.svg)](./LICENSE)
[![tests](https://img.shields.io/badge/tests-passing-brightgreen)](./tests)
[![coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](./coverage)

A NestJS library that seamlessly integrates Zod with Swagger. Generate type-safe DTOs, automate OpenAPI documentation, and enforce runtime validation with minimal effort.

## Installation

```bash
npm install nest-swagger-zod
```

### Peer Dependencies

Make sure the following packages are installed in your project:

```bash
npm install @nestjs/common @nestjs/swagger zod
```

## Features

### 1. Type-safe DTOs with `createZodDto`

Automatically generate NestJS DTO classes from Zod schemas. These classes are fully compatible with `@nestjs/swagger` and preserve TypeScript types.

```typescript
import { createZodDto } from 'nest-swagger-zod';
import { z } from 'zod';

const CreateUserSchema = z.object({
  name: z.string().describe('User name'),
  email: z.string().email().describe('User email'),
  age: z.number().int().min(18).optional().describe('User age'),
});

export type CreateUserSchema = z.infer<typeof CreateUserSchema>;

export class CreateUserDto extends createZodDto<CreateUserSchema>(CreateUserSchema) {}
```

### 2. Global Validation with `ZodValidationPipe`

Use the `ZodValidationPipe` to automatically validate incoming requests against your Zod DTOs. It can be applied globally, at the controller level, or on specific routes.

**Global Setup:**

```typescript
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nest-swagger-zod';

@Module({
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
```

**Controller Usage:**

```typescript
@Controller('users')
export class UsersController {
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    // body is already validated and typed as CreateUserDto
    return this.usersService.create(createUserDto);
  }
}
```

### 3. Schema Decorators for Raw Schemas

If you prefer using raw OpenAPI/JSON schemas, you can use the provided decorators to automate Swagger documentation.

#### `ApiQueryParams`

```typescript
@Get()
@ApiQueryParams(SearchSchema)
findAll(@Query() query: any) { ... }
```

#### `ApiBodyParams`

```typescript
@Post()
@ApiBodyParams(CreateItemSchema)
create(@Body() body: any) { ... }
```

#### `ApiPathParams`

```typescript
@Get(':id')
@ApiPathParams(PathSchema)
findOne(@Param('id') id: string) { ... }
```

## API Reference

### `createZodDto(schema: ZodType)`

Creates a class that you can extend to create a NestJS DTO. 
- Automatically applies `@ApiProperty()` and `@ApiPropertyOptional()` based on the Zod schema.
- Attaches the original Zod schema to a static `schema` property for use with the validation pipe.

### `ZodValidationPipe`

A NestJS pipe that performs validation using Zod.
- If the target `metatype` is a class created with `createZodDto`, it uses the attached Zod schema to validate the input.
- Throws `ZodError` on validation failure.
- Safely ignores primitive types (String, Number, etc.) when applied globally.

### `ApiQueryParams(schema: OpenApiObjectSchema)`

Method decorator that applies `@ApiQuery` decorators for each property in the provided schema.

### `ApiBodyParams(schema: OpenApiObjectSchema)`

Method decorator that applies the full schema to an `@ApiBody` decorator.

### `ApiPathParams(schema: OpenApiObjectSchema)`

Method decorator that applies `@ApiParam` decorators for each property in the provided schema.

## License

ISC © [Guilherme da Matta](https://github.com/damattag)
