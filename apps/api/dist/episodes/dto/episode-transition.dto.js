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
exports.EpisodeTransitionDto = exports.OverrideWarningDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const episode_status_transitions_1 = require("../episode-status-transitions");
class OverrideWarningDto {
    code;
    reason;
}
exports.OverrideWarningDto = OverrideWarningDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OverrideWarningDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    __metadata("design:type", String)
], OverrideWarningDto.prototype, "reason", void 0);
class EpisodeTransitionDto {
    toStatus;
    reason;
    overrideWarnings;
    version;
}
exports.EpisodeTransitionDto = EpisodeTransitionDto;
__decorate([
    (0, class_validator_1.IsIn)(episode_status_transitions_1.EPISODE_STATUSES),
    __metadata("design:type", Object)
], EpisodeTransitionDto.prototype, "toStatus", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], EpisodeTransitionDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => OverrideWarningDto),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], EpisodeTransitionDto.prototype, "overrideWarnings", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], EpisodeTransitionDto.prototype, "version", void 0);
