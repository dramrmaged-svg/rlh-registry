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
exports.PatientSummaryDto = void 0;
const class_transformer_1 = require("class-transformer");
class IdentifierSummaryDto {
    identifierType;
    value;
    isActive;
}
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], IdentifierSummaryDto.prototype, "identifierType", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], IdentifierSummaryDto.prototype, "value", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Boolean)
], IdentifierSummaryDto.prototype, "isActive", void 0);
class DiagnosisSummaryDto {
    tumourType;
    baselineBclcStage;
}
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], DiagnosisSummaryDto.prototype, "tumourType", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], DiagnosisSummaryDto.prototype, "baselineBclcStage", void 0);
class PatientSummaryDto {
    id;
    firstName;
    lastName;
    dateOfBirth;
    sex;
    isActive;
    primaryIdentifier;
    primaryDiagnosis;
    lastMdtDecision;
    lastProcedureDate;
}
exports.PatientSummaryDto = PatientSummaryDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], PatientSummaryDto.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], PatientSummaryDto.prototype, "firstName", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], PatientSummaryDto.prototype, "lastName", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], PatientSummaryDto.prototype, "dateOfBirth", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], PatientSummaryDto.prototype, "sex", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Boolean)
], PatientSummaryDto.prototype, "isActive", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => IdentifierSummaryDto),
    __metadata("design:type", Object)
], PatientSummaryDto.prototype, "primaryIdentifier", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => DiagnosisSummaryDto),
    __metadata("design:type", Object)
], PatientSummaryDto.prototype, "primaryDiagnosis", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], PatientSummaryDto.prototype, "lastMdtDecision", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], PatientSummaryDto.prototype, "lastProcedureDate", void 0);
