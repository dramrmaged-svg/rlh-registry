"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LesionsModule = void 0;
const common_1 = require("@nestjs/common");
const lesions_controller_1 = require("./lesions.controller");
const lesions_service_1 = require("./lesions.service");
const audit_module_1 = require("../audit/audit.module");
let LesionsModule = class LesionsModule {
};
exports.LesionsModule = LesionsModule;
exports.LesionsModule = LesionsModule = __decorate([
    (0, common_1.Module)({
        imports: [audit_module_1.AuditModule],
        controllers: [lesions_controller_1.LesionsController],
        providers: [lesions_service_1.LesionsService],
    })
], LesionsModule);
