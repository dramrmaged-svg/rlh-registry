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
exports.PatchMdtRecordDto = void 0;
const class_validator_1 = require("class-validator");
const MDT_DECISIONS = ['SIRT', 'MWA_ABLATION', 'RFA_ABLATION', 'TACE', 'TAE', 'SYSTEMIC_THERAPY', 'BEST_SUPPORTIVE_CARE', 'SURGICAL_RESECTION', 'TRANSPLANT_ASSESSMENT', 'ACTIVE_SURVEILLANCE', 'RE_DISCUSS', 'DECLINED', 'OTHER'];
class PatchMdtRecordDto {
    diseaseSummary;
    priorTreatmentSummary;
    decision;
    decisionDetail;
    decisionConditions;
    patientFitForProcedure;
    performanceStatusAcceptable;
    liverFunctionAcceptable;
    tumourLoadAcceptable;
    version;
}
exports.PatchMdtRecordDto = PatchMdtRecordDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PatchMdtRecordDto.prototype, "diseaseSummary", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PatchMdtRecordDto.prototype, "priorTreatmentSummary", void 0);
__decorate([
    (0, class_validator_1.IsIn)(MDT_DECISIONS),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], PatchMdtRecordDto.prototype, "decision", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PatchMdtRecordDto.prototype, "decisionDetail", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PatchMdtRecordDto.prototype, "decisionConditions", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], PatchMdtRecordDto.prototype, "patientFitForProcedure", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], PatchMdtRecordDto.prototype, "performanceStatusAcceptable", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], PatchMdtRecordDto.prototype, "liverFunctionAcceptable", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], PatchMdtRecordDto.prototype, "tumourLoadAcceptable", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PatchMdtRecordDto.prototype, "version", void 0);
