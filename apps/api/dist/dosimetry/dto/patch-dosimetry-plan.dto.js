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
exports.PatchDosimetryPlanDto = void 0;
const class_validator_1 = require("class-validator");
const LOCK_STATUSES = ['DRAFT', 'SUBMITTED', 'LOCKED'];
class PatchDosimetryPlanDto {
    mappingSessionId;
    planDate;
    planningModel;
    particleProduct;
    targetLiverVolumeCm3;
    treatedLiverVolumePercent;
    tumourLiverVolumeRatio;
    confirmedPrescribedActivityGbq;
    prescribedActivityOverrideReason;
    particleDensityCalc;
    lockStatus;
    version;
}
exports.PatchDosimetryPlanDto = PatchDosimetryPlanDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PatchDosimetryPlanDto.prototype, "mappingSessionId", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PatchDosimetryPlanDto.prototype, "planDate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PatchDosimetryPlanDto.prototype, "planningModel", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PatchDosimetryPlanDto.prototype, "particleProduct", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], PatchDosimetryPlanDto.prototype, "targetLiverVolumeCm3", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], PatchDosimetryPlanDto.prototype, "treatedLiverVolumePercent", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], PatchDosimetryPlanDto.prototype, "tumourLiverVolumeRatio", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], PatchDosimetryPlanDto.prototype, "confirmedPrescribedActivityGbq", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PatchDosimetryPlanDto.prototype, "prescribedActivityOverrideReason", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], PatchDosimetryPlanDto.prototype, "particleDensityCalc", void 0);
__decorate([
    (0, class_validator_1.IsIn)(LOCK_STATUSES),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], PatchDosimetryPlanDto.prototype, "lockStatus", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PatchDosimetryPlanDto.prototype, "version", void 0);
