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
exports.MaaStudyDto = void 0;
const class_transformer_1 = require("class-transformer");
class MaaStudyDto {
    id;
    mappingSessionId;
    studyDate;
    injectedActivityMbq;
    lungShuntFraction;
    calculatedLsfRiskBand;
    extrahepaticUptake;
    extrahepaticUptakeSites;
    maaDistributionMatchesTarget;
    balanceCheckPass;
    calculationVersion;
    createdAt;
}
exports.MaaStudyDto = MaaStudyDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], MaaStudyDto.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], MaaStudyDto.prototype, "mappingSessionId", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], MaaStudyDto.prototype, "studyDate", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], MaaStudyDto.prototype, "injectedActivityMbq", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], MaaStudyDto.prototype, "lungShuntFraction", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], MaaStudyDto.prototype, "calculatedLsfRiskBand", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], MaaStudyDto.prototype, "extrahepaticUptake", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], MaaStudyDto.prototype, "extrahepaticUptakeSites", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], MaaStudyDto.prototype, "maaDistributionMatchesTarget", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], MaaStudyDto.prototype, "balanceCheckPass", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], MaaStudyDto.prototype, "calculationVersion", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], MaaStudyDto.prototype, "createdAt", void 0);
