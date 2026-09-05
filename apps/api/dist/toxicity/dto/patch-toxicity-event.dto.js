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
exports.PatchToxicityEventDto = void 0;
const class_validator_1 = require("class-validator");
const LOCK_STATUSES = ['DRAFT', 'SUBMITTED', 'LOCKED'];
class PatchToxicityEventDto {
    treatmentSessionId;
    // null is meaningful here: clears a previously-set date rather than being ignored.
    onsetDate;
    toxicityType;
    ctcaeGrade;
    reildGrade;
    outcome;
    resolvedDate;
    notes;
    lockStatus;
    version;
}
exports.PatchToxicityEventDto = PatchToxicityEventDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PatchToxicityEventDto.prototype, "treatmentSessionId", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], PatchToxicityEventDto.prototype, "onsetDate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PatchToxicityEventDto.prototype, "toxicityType", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], PatchToxicityEventDto.prototype, "ctcaeGrade", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PatchToxicityEventDto.prototype, "reildGrade", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PatchToxicityEventDto.prototype, "outcome", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], PatchToxicityEventDto.prototype, "resolvedDate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PatchToxicityEventDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsIn)(LOCK_STATUSES),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], PatchToxicityEventDto.prototype, "lockStatus", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PatchToxicityEventDto.prototype, "version", void 0);
