import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { VocabularyCacheService } from '../vocabulary-cache.service';

let cacheServiceInstance: VocabularyCacheService | undefined;

/**
 * Wires the singleton VocabularyCacheService instance into the decorator so
 * `@IsVocabularyCode()` can validate synchronously (class-validator DTO
 * decorators run outside Nest's DI container). Called once from
 * VocabulariesModule's constructor.
 */
export function registerVocabularyCacheService(service: VocabularyCacheService): void {
  cacheServiceInstance = service;
}

/**
 * Validates that a DTO field's value is an active option code within the
 * named vocabulary (looked up from the in-memory VocabularyCacheService).
 */
export function IsVocabularyCode(vocabularyKey: string, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isVocabularyCode',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [vocabularyKey],
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          if (value === undefined || value === null) return true; // combine with @IsOptional/@IsNotEmpty as needed
          if (typeof value !== 'string') return false;
          const [key] = args.constraints as [string];
          if (!cacheServiceInstance) return true; // fail-open before bootstrap; DB constraint is not present, so this is advisory only
          return cacheServiceInstance.isValidCode(key, value);
        },
        defaultMessage(args: ValidationArguments) {
          const [key] = args.constraints as [string];
          return `${args.property} must be a valid, active option code for the '${key}' vocabulary`;
        },
      },
    });
  };
}
