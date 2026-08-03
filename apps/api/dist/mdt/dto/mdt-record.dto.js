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
exports.MdtRecordDto = void 0;
const class_transformer_1 = require("class-transformer");
class MdtSessionSummaryDto {
    id;
    sessionDate;
    location;
    chair;
}
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], MdtSessionSummaryDto.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], MdtSessionSummaryDto.prototype, "sessionDate", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], MdtSessionSummaryDto.prototype, "location", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], MdtSessionSummaryDto.prototype, "chair", void 0);
class UserSummaryDto {
    id;
    firstName;
    lastName;
    title;
}
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], UserSummaryDto.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], UserSummaryDto.prototype, "firstName", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], UserSummaryDto.prototype, "lastName", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], UserSummaryDto.prototype, "title", void 0);
class ClinicalSnapshotSummaryDto {
    id;
    snapshotDate;
    snapshotContext;
    ecogScore;
    cpGrade;
    cpTotalScore;
    meldNaScoreRounded;
    albiGrade;
    bclcStage;
    labPanelCollectedAt;
    clinicalScoreDate;
}
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], ClinicalSnapshotSummaryDto.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], ClinicalSnapshotSummaryDto.prototype, "snapshotDate", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], ClinicalSnapshotSummaryDto.prototype, "snapshotContext", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], ClinicalSnapshotSummaryDto.prototype, "ecogScore", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], ClinicalSnapshotSummaryDto.prototype, "cpGrade", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], ClinicalSnapshotSummaryDto.prototype, "cpTotalScore", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], ClinicalSnapshotSummaryDto.prototype, "meldNaScoreRounded", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], ClinicalSnapshotSummaryDto.prototype, "albiGrade", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], ClinicalSnapshotSummaryDto.prototype, "bclcStage", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], ClinicalSnapshotSummaryDto.prototype, "labPanelCollectedAt", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], ClinicalSnapshotSummaryDto.prototype, "clinicalScoreDate", void 0);
class MdtRecordDto {
    id;
    episodeId;
    mdtSessionId;
    mdtSession;
    clinicalSnapshotId;
    clinicalSnapshot;
    diseaseSummary;
    priorTreatmentSummary;
    decision;
    decisionDetail;
    decisionConditions;
    patientFitForProcedure;
    performanceStatusAcceptable;
    liverFunctionAcceptable;
    tumourLoadAcceptable;
    lockStatus;
    availableActions;
    submittedAt;
    submittedById;
    lockedAt;
    lockedById;
    lockedBy;
    version;
    createdAt;
    updatedAt;
}
exports.MdtRecordDto = MdtRecordDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], MdtRecordDto.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], MdtRecordDto.prototype, "episodeId", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], MdtRecordDto.prototype, "mdtSessionId", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => MdtSessionSummaryDto),
    __metadata("design:type", MdtSessionSummaryDto)
], MdtRecordDto.prototype, "mdtSession", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], MdtRecordDto.prototype, "clinicalSnapshotId", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => ClinicalSnapshotSummaryDto),
    __metadata("design:type", Object)
], MdtRecordDto.prototype, "clinicalSnapshot", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], MdtRecordDto.prototype, "diseaseSummary", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], MdtRecordDto.prototype, "priorTreatmentSummary", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], MdtRecordDto.prototype, "decision", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], MdtRecordDto.prototype, "decisionDetail", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], MdtRecordDto.prototype, "decisionConditions", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], MdtRecordDto.prototype, "patientFitForProcedure", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], MdtRecordDto.prototype, "performanceStatusAcceptable", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], MdtRecordDto.prototype, "liverFunctionAcceptable", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], MdtRecordDto.prototype, "tumourLoadAcceptable", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], MdtRecordDto.prototype, "lockStatus", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Array)
], MdtRecordDto.prototype, "availableActions", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], MdtRecordDto.prototype, "submittedAt", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], MdtRecordDto.prototype, "submittedById", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], MdtRecordDto.prototype, "lockedAt", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], MdtRecordDto.prototype, "lockedById", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => UserSummaryDto),
    __metadata("design:type", Object)
], MdtRecordDto.prototype, "lockedBy", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], MdtRecordDto.prototype, "version", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], MdtRecordDto.prototype, "createdAt", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], MdtRecordDto.prototype, "updatedAt", void 0);
