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
exports.CalculationSummaryDto = exports.DiagnosisDto = void 0;
const class_transformer_1 = require("class-transformer");
class DiagnosisDto {
    id;
    episodeId;
    tumourType;
    aetiology;
    diagnosisDate;
    histologyConfirmed;
    calculatedBclcStage;
    confirmedBclcStage;
    bclcOverrideReason;
    calculatedTStage;
    calculatedNStage;
    calculatedMStage;
    confirmedTStage;
    confirmedNStage;
    confirmedMStage;
    tnmOverrideReason;
    calculatedCpScore;
    calculatedCpGrade;
    confirmedCpGrade;
    cpOverrideReason;
    calculatedMeld3Score;
    calculatedMeldNaScore;
    meldOverrideReason;
    calculatedAlbiScore;
    calculatedAlbiGrade;
    albiOverrideReason;
    calculationVersion;
    version;
    createdAt;
    updatedAt;
}
exports.DiagnosisDto = DiagnosisDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], DiagnosisDto.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], DiagnosisDto.prototype, "episodeId", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], DiagnosisDto.prototype, "tumourType", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], DiagnosisDto.prototype, "aetiology", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], DiagnosisDto.prototype, "diagnosisDate", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], DiagnosisDto.prototype, "histologyConfirmed", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], DiagnosisDto.prototype, "calculatedBclcStage", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], DiagnosisDto.prototype, "confirmedBclcStage", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], DiagnosisDto.prototype, "bclcOverrideReason", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], DiagnosisDto.prototype, "calculatedTStage", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], DiagnosisDto.prototype, "calculatedNStage", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], DiagnosisDto.prototype, "calculatedMStage", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], DiagnosisDto.prototype, "confirmedTStage", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], DiagnosisDto.prototype, "confirmedNStage", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], DiagnosisDto.prototype, "confirmedMStage", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], DiagnosisDto.prototype, "tnmOverrideReason", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], DiagnosisDto.prototype, "calculatedCpScore", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], DiagnosisDto.prototype, "calculatedCpGrade", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], DiagnosisDto.prototype, "confirmedCpGrade", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], DiagnosisDto.prototype, "cpOverrideReason", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], DiagnosisDto.prototype, "calculatedMeld3Score", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], DiagnosisDto.prototype, "calculatedMeldNaScore", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], DiagnosisDto.prototype, "meldOverrideReason", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], DiagnosisDto.prototype, "calculatedAlbiScore", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], DiagnosisDto.prototype, "calculatedAlbiGrade", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], DiagnosisDto.prototype, "albiOverrideReason", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], DiagnosisDto.prototype, "calculationVersion", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], DiagnosisDto.prototype, "version", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], DiagnosisDto.prototype, "createdAt", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], DiagnosisDto.prototype, "updatedAt", void 0);
class CalculationSummaryDto {
    formulaId;
    status;
    explanation;
    missingFields;
}
exports.CalculationSummaryDto = CalculationSummaryDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], CalculationSummaryDto.prototype, "formulaId", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], CalculationSummaryDto.prototype, "status", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], CalculationSummaryDto.prototype, "explanation", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Array)
], CalculationSummaryDto.prototype, "missingFields", void 0);
