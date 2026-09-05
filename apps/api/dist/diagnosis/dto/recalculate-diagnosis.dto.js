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
exports.RecalculateDiagnosisDto = void 0;
const class_validator_1 = require("class-validator");
const SEX_VALUES = ['MALE', 'FEMALE', 'INDETERMINATE', 'UNKNOWN'];
/**
 * Transient clinical inputs used only to run the calculation engine — not
 * persisted as raw fields on Diagnosis. Raw labs/ECOG capture belongs to a
 * future LabPanel/ClinicalScore module (out of scope this phase); this
 * endpoint exists so the Phase 1 calculation engine is reachable via the API
 * now rather than staying dormant until that module exists.
 */
class RecalculateDiagnosisDto {
    bilirubinUmolL;
    albuminGL;
    inr;
    creatinineUmolL;
    sodiumMmolL;
    sex;
    onDialysis;
    ascites;
    encephalopathy;
    ecogScore;
    tumourCount;
    largestDiameterCm;
    pvtt;
    extrahepaticSpread;
}
exports.RecalculateDiagnosisDto = RecalculateDiagnosisDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], RecalculateDiagnosisDto.prototype, "bilirubinUmolL", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], RecalculateDiagnosisDto.prototype, "albuminGL", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], RecalculateDiagnosisDto.prototype, "inr", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], RecalculateDiagnosisDto.prototype, "creatinineUmolL", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], RecalculateDiagnosisDto.prototype, "sodiumMmolL", void 0);
__decorate([
    (0, class_validator_1.IsIn)(SEX_VALUES),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], RecalculateDiagnosisDto.prototype, "sex", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], RecalculateDiagnosisDto.prototype, "onDialysis", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RecalculateDiagnosisDto.prototype, "ascites", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RecalculateDiagnosisDto.prototype, "encephalopathy", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], RecalculateDiagnosisDto.prototype, "ecogScore", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], RecalculateDiagnosisDto.prototype, "tumourCount", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], RecalculateDiagnosisDto.prototype, "largestDiameterCm", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RecalculateDiagnosisDto.prototype, "pvtt", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], RecalculateDiagnosisDto.prototype, "extrahepaticSpread", void 0);
