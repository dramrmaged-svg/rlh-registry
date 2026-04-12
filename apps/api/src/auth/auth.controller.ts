import { Controller, Post, Get, Body, Req, Res, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { PasswordResetRequestDto } from './dto/password-reset-request.dto';
import { PasswordResetCompleteDto } from './dto/password-reset-complete.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import type { UserResponseDto } from '../users/dto/user-response.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public() @Post('login') @HttpCode(HttpStatus.OK) @Throttle({ default: { limit: 5, ttl: 900_000 } })
  login(@Body() dto: LoginDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    return this.authService.login(dto.email, dto.password, request, response);
  }

  @Public() @UseGuards(AuthGuard('refresh')) @Post('refresh') @HttpCode(HttpStatus.OK)
  refresh(@Req() request: Request & { cookies: Record<string, string> }, @Res({ passthrough: true }) response: Response) {
    const rawToken = request.cookies['rlh_refresh'] as string;
    return this.authService.refresh(rawToken, request, response);
  }

  @Post('logout') @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentUser() user: UserResponseDto, @Req() request: Request & { cookies: Record<string, string> }, @Res({ passthrough: true }) response: Response) {
    const rawToken = request.cookies['rlh_refresh'] as string | undefined;
    await this.authService.logout(rawToken, user.id, request, response);
  }

  @Get('me') getMe(@CurrentUser() user: UserResponseDto) { return user; }

  @Public() @Post('password-reset/request') @HttpCode(HttpStatus.OK) @Throttle({ default: { limit: 3, ttl: 900_000 } })
  async requestPasswordReset(@Body() dto: PasswordResetRequestDto) {
    await this.authService.requestPasswordReset(dto.email);
    return { message: 'If this email is registered, a reset link has been sent.' };
  }

  @Public() @Post('password-reset/complete') @HttpCode(HttpStatus.NO_CONTENT)
  completePasswordReset(@Body() dto: PasswordResetCompleteDto, @Req() request: Request) {
    return this.authService.completePasswordReset(dto.token, dto.newPassword, request);
  }
}
