import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'refresh') {
  constructor(private readonly authService: AuthService) { super(); }

  async validate(request: Request) {
    const token = request.cookies['rlh_refresh'] as string | undefined;
    if (!token) throw new UnauthorizedException({ code: 'INVALID_REFRESH_TOKEN', message: 'No refresh token provided' });
    const result = await this.authService.validateRefreshToken(token);
    if (!result) throw new UnauthorizedException({ code: 'INVALID_REFRESH_TOKEN', message: 'Invalid or expired refresh token' });
    return result;
  }
}
