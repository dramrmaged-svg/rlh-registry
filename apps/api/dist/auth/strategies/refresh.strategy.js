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
exports.RefreshStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_custom_1 = require("passport-custom");
const auth_service_1 = require("../auth.service");
let RefreshStrategy = class RefreshStrategy extends (0, passport_1.PassportStrategy)(passport_custom_1.Strategy, 'refresh') {
    authService;
    constructor(authService) {
        super();
        this.authService = authService;
    }
    async validate(request) {
        const token = request.cookies['rlh_refresh'];
        if (!token)
            throw new common_1.UnauthorizedException({ code: 'INVALID_REFRESH_TOKEN', message: 'No refresh token provided' });
        const result = await this.authService.validateRefreshToken(token);
        if (!result)
            throw new common_1.UnauthorizedException({ code: 'INVALID_REFRESH_TOKEN', message: 'Invalid or expired refresh token' });
        return result;
    }
};
exports.RefreshStrategy = RefreshStrategy;
exports.RefreshStrategy = RefreshStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], RefreshStrategy);
