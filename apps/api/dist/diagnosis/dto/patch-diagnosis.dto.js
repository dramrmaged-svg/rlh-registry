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
exports.PatchDiagnosisDto = void 0;
const class_validator_1 = require("class-validator");
const BCLC_STAGES = ['STAGE_0', 'STAGE_A', 'STAGE_B', 'STAGE_C', 'STAGE_D'];
const CP_GRADES = ['A', 'B', 'C'];
class PatchDiagnosisDto {
    tumourType;
    aetiology;
    // null clears a previously-set diagnosis date — see PatchEpisodeDto.referralDate for why this must stay nullable.
    diagnosisDate;
    histologyConfirmed;
    confirmedBclcStage;
    bclcOverrideReason;
    confirmedTStage;
    confirmedNStage;
    confirmedMStage;
    tnmOverrideReason;
    confirmedCpGrade;
    cpOverrideReason;
    meldOverrideReason;
    albiOverrideReason;
    version;
}
exports.PatchDiagnosisDto = PatchDiagnosisDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PatchDiagnosisDto.prototype, "tumourType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PatchDiagnosisDto.prototype, "aetiology", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], PatchDiagnosisDto.prototype, "diagnosisDate", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], PatchDiagnosisDto.prototype, "histologyConfirmed", void 0);
__decorate([
    (0, class_validator_1.IsIn)(BCLC_STAGES),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], PatchDiagnosisDto.prototype, "confirmedBclcStage", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PatchDiagnosisDto.prototype, "bclcOverrideReason", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PatchDiagnosisDto.prototype, "confirmedTStage", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PatchDiagnosisDto.prototype, "confirmedNStage", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PatchDiagnosisDto.prototype, "confirmedMStage", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PatchDiagnosisDto.prototype, "tnmOverrideReason", void 0);
__decorate([
    (0, class_validator_1.IsIn)(CP_GRADES),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], PatchDiagnosisDto.prototype, "confirmedCpGrade", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PatchDiagnosisDto.prototype, "cpOverrideReason", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PatchDiagnosisDto.prototype, "meldOverrideReason", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PatchDiagnosisDto.prototype, "albiOverrideReason", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PatchDiagnosisDto.prototype, "version", void 0);
