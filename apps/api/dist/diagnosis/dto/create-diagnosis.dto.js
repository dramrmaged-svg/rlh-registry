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
exports.CreateDiagnosisDto = void 0;
const class_validator_1 = require("class-validator");
const BCLC_STAGES = ['STAGE_0', 'STAGE_A', 'STAGE_B', 'STAGE_C', 'STAGE_D'];
const CP_GRADES = ['A', 'B', 'C'];
class CreateDiagnosisDto {
    tumourType;
    aetiology;
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
}
exports.CreateDiagnosisDto = CreateDiagnosisDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDiagnosisDto.prototype, "tumourType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDiagnosisDto.prototype, "aetiology", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDiagnosisDto.prototype, "diagnosisDate", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateDiagnosisDto.prototype, "histologyConfirmed", void 0);
__decorate([
    (0, class_validator_1.IsIn)(BCLC_STAGES),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateDiagnosisDto.prototype, "confirmedBclcStage", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDiagnosisDto.prototype, "bclcOverrideReason", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDiagnosisDto.prototype, "confirmedTStage", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDiagnosisDto.prototype, "confirmedNStage", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDiagnosisDto.prototype, "confirmedMStage", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDiagnosisDto.prototype, "tnmOverrideReason", void 0);
__decorate([
    (0, class_validator_1.IsIn)(CP_GRADES),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateDiagnosisDto.prototype, "confirmedCpGrade", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDiagnosisDto.prototype, "cpOverrideReason", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDiagnosisDto.prototype, "meldOverrideReason", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDiagnosisDto.prototype, "albiOverrideReason", void 0);
