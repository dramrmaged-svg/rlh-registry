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
exports.EpisodeDetailDto = void 0;
const class_transformer_1 = require("class-transformer");
class DiagnosisSummaryDto {
    id;
    tumourType;
    aetiology;
    confirmedBclcStage;
    confirmedCpGrade;
}
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], DiagnosisSummaryDto.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], DiagnosisSummaryDto.prototype, "tumourType", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], DiagnosisSummaryDto.prototype, "aetiology", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], DiagnosisSummaryDto.prototype, "confirmedBclcStage", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], DiagnosisSummaryDto.prototype, "confirmedCpGrade", void 0);
class EpisodeCompletenessDto {
    hasDiagnosis;
    mdtRecordCount;
    lesionCount;
    mappingSessionCount;
    dosimetryPlanCount;
    treatmentSessionCount;
    followUpCount;
    toxicityEventCount;
}
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Boolean)
], EpisodeCompletenessDto.prototype, "hasDiagnosis", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], EpisodeCompletenessDto.prototype, "mdtRecordCount", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], EpisodeCompletenessDto.prototype, "lesionCount", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], EpisodeCompletenessDto.prototype, "mappingSessionCount", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], EpisodeCompletenessDto.prototype, "dosimetryPlanCount", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], EpisodeCompletenessDto.prototype, "treatmentSessionCount", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], EpisodeCompletenessDto.prototype, "followUpCount", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], EpisodeCompletenessDto.prototype, "toxicityEventCount", void 0);
class EpisodeDetailDto {
    id;
    patientId;
    episodeNumber;
    firstOrRepeat;
    previousEpisodeId;
    status;
    deferredFromStatus;
    availableActions;
    referralDate;
    referralSource;
    referringClinicianOverride;
    statusChangedAt;
    diagnosis;
    completeness;
    version;
    createdAt;
    updatedAt;
}
exports.EpisodeDetailDto = EpisodeDetailDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], EpisodeDetailDto.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], EpisodeDetailDto.prototype, "patientId", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], EpisodeDetailDto.prototype, "episodeNumber", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], EpisodeDetailDto.prototype, "firstOrRepeat", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], EpisodeDetailDto.prototype, "previousEpisodeId", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], EpisodeDetailDto.prototype, "status", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], EpisodeDetailDto.prototype, "deferredFromStatus", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Array)
], EpisodeDetailDto.prototype, "availableActions", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], EpisodeDetailDto.prototype, "referralDate", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], EpisodeDetailDto.prototype, "referralSource", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], EpisodeDetailDto.prototype, "referringClinicianOverride", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], EpisodeDetailDto.prototype, "statusChangedAt", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => DiagnosisSummaryDto),
    __metadata("design:type", Object)
], EpisodeDetailDto.prototype, "diagnosis", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => EpisodeCompletenessDto),
    __metadata("design:type", EpisodeCompletenessDto)
], EpisodeDetailDto.prototype, "completeness", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], EpisodeDetailDto.prototype, "version", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], EpisodeDetailDto.prototype, "createdAt", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], EpisodeDetailDto.prototype, "updatedAt", void 0);
