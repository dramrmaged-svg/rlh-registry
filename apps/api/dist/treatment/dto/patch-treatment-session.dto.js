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
exports.PatchTreatmentSessionDto = void 0;
const class_validator_1 = require("class-validator");
const LOCK_STATUSES = ['DRAFT', 'SUBMITTED', 'LOCKED'];
class PatchTreatmentSessionDto {
    dosimetryPlanId;
    sessionDate;
    status;
    accessRoute;
    accessSite;
    catheterType;
    fluoroTimeMin;
    dapGyCm2;
    contrastVolumeMl;
    embolicMaterial;
    particleProduct;
    administeredActivityGbq;
    maaBalanceCheckedAtDelivery;
    complications;
    operatorUserId;
    lockStatus;
    version;
}
exports.PatchTreatmentSessionDto = PatchTreatmentSessionDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PatchTreatmentSessionDto.prototype, "dosimetryPlanId", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PatchTreatmentSessionDto.prototype, "sessionDate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PatchTreatmentSessionDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PatchTreatmentSessionDto.prototype, "accessRoute", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PatchTreatmentSessionDto.prototype, "accessSite", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PatchTreatmentSessionDto.prototype, "catheterType", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], PatchTreatmentSessionDto.prototype, "fluoroTimeMin", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], PatchTreatmentSessionDto.prototype, "dapGyCm2", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], PatchTreatmentSessionDto.prototype, "contrastVolumeMl", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PatchTreatmentSessionDto.prototype, "embolicMaterial", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PatchTreatmentSessionDto.prototype, "particleProduct", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], PatchTreatmentSessionDto.prototype, "administeredActivityGbq", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], PatchTreatmentSessionDto.prototype, "maaBalanceCheckedAtDelivery", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PatchTreatmentSessionDto.prototype, "complications", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PatchTreatmentSessionDto.prototype, "operatorUserId", void 0);
__decorate([
    (0, class_validator_1.IsIn)(LOCK_STATUSES),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], PatchTreatmentSessionDto.prototype, "lockStatus", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PatchTreatmentSessionDto.prototype, "version", void 0);
