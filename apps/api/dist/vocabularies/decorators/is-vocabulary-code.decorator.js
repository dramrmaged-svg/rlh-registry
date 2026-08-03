"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerVocabularyCacheService = registerVocabularyCacheService;
exports.IsVocabularyCode = IsVocabularyCode;
const class_validator_1 = require("class-validator");
let cacheServiceInstance;
/**
 * Wires the singleton VocabularyCacheService instance into the decorator so
 * `@IsVocabularyCode()` can validate synchronously (class-validator DTO
 * decorators run outside Nest's DI container). Called once from
 * VocabulariesModule's constructor.
 */
function registerVocabularyCacheService(service) {
    cacheServiceInstance = service;
}
/**
 * Validates that a DTO field's value is an active option code within the
 * named vocabulary (looked up from the in-memory VocabularyCacheService).
 */
function IsVocabularyCode(vocabularyKey, validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            name: 'isVocabularyCode',
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [vocabularyKey],
            validator: {
                validate(value, args) {
                    if (value === undefined || value === null)
                        return true; // combine with @IsOptional/@IsNotEmpty as needed
                    if (typeof value !== 'string')
                        return false;
                    const [key] = args.constraints;
                    if (!cacheServiceInstance)
                        return true; // fail-open before bootstrap; DB constraint is not present, so this is advisory only
                    return cacheServiceInstance.isValidCode(key, value);
                },
                defaultMessage(args) {
                    const [key] = args.constraints;
                    return `${args.property} must be a valid, active option code for the '${key}' vocabulary`;
                },
            },
        });
    };
}
