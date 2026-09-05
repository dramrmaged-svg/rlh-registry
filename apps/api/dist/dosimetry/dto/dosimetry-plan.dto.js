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
exports.DosimetryPlanDto = void 0;
const class_transformer_1 = require("class-transformer");
class DosimetryPlanDto {
    id;
    episodeId;
    mappingSessionId;
    planDate;
    planningModel;
    particleProduct;
    targetLiverVolumeCm3;
    treatedLiverVolumePercent;
    tumourLiverVolumeRatio;
    calculatedPrescribedActivityGbq;
    confirmedPrescribedActivityGbq;
    prescribedActivityOverrideReason;
    particleDensityCalc;
    lockStatus;
    approvedAt;
    approvedById;
    version;
    createdAt;
    updatedAt;
}
exports.DosimetryPlanDto = DosimetryPlanDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], DosimetryPlanDto.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], DosimetryPlanDto.prototype, "episodeId", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], DosimetryPlanDto.prototype, "mappingSessionId", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], DosimetryPlanDto.prototype, "planDate", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], DosimetryPlanDto.prototype, "planningModel", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], DosimetryPlanDto.prototype, "particleProduct", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], DosimetryPlanDto.prototype, "targetLiverVolumeCm3", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], DosimetryPlanDto.prototype, "treatedLiverVolumePercent", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], DosimetryPlanDto.prototype, "tumourLiverVolumeRatio", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], DosimetryPlanDto.prototype, "calculatedPrescribedActivityGbq", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], DosimetryPlanDto.prototype, "confirmedPrescribedActivityGbq", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], DosimetryPlanDto.prototype, "prescribedActivityOverrideReason", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], DosimetryPlanDto.prototype, "particleDensityCalc", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], DosimetryPlanDto.prototype, "lockStatus", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], DosimetryPlanDto.prototype, "approvedAt", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], DosimetryPlanDto.prototype, "approvedById", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], DosimetryPlanDto.prototype, "version", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], DosimetryPlanDto.prototype, "createdAt", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], DosimetryPlanDto.prototype, "updatedAt", void 0);
