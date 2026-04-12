"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatePatientDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const IDENTIFIER_TYPES = ['NHS_NUMBER', 'MRN_RLH', 'MRN_EXTERNAL', 'EXTERNAL_REFERRAL_ID'];
const SEX_VALUES = ['MALE', 'FEMALE', 'INDETERMINATE', 'UNKNOWN'];
class PrimaryIdentifierDto {
    identifierType;
    value;
    issuingOrg;
}
__decorate([
    (0, class_validator_1.IsIn)(IDENTIFIER_TYPES),
    __metadata("design:type", Object)
], PrimaryIdentifierDto.prototype, "identifierType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], PrimaryIdentifierDto.prototype, "value", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.identifierType === 'MRN_EXTERNAL'),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], PrimaryIdentifierDto.prototype, "issuingOrg", void 0);
class DuplicateConfirmationDto {
    token;
    reviewedMatchCount;
    confirmationNote;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], DuplicateConfirmationDto.prototype, "token", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], DuplicateConfirmationDto.prototype, "reviewedMatchCount", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], DuplicateConfirmationDto.prototype, "confirmationNote", void 0);
class CreatePatientDto {
    firstName;
    lastName;
    dateOfBirth;
    sex;
    ethnicity;
    gpPractice;
    referringHospital;
    primaryIdentifier;
    duplicateConfirmation;
}
exports.CreatePatientDto = CreatePatientDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePatientDto.prototype, "firstName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePatientDto.prototype, "lastName", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreatePatientDto.prototype, "dateOfBirth", void 0);
__decorate([
    (0, class_validator_1.IsIn)(SEX_VALUES),
    __metadata("design:type", Object)
], CreatePatientDto.prototype, "sex", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePatientDto.prototype, "ethnicity", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePatientDto.prototype, "gpPractice", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePatientDto.prototype, "referringHospital", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PrimaryIdentifierDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", PrimaryIdentifierDto)
], CreatePatientDto.prototype, "primaryIdentifier", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => DuplicateConfirmationDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", DuplicateConfirmationDto)
], CreatePatientDto.prototype, "duplicateConfirmation", void 0);
