import { Controller, Get, Post, Patch, Body, Param, ParseUUIDPipe, Req } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DiagnosisService } from './diagnosis.service';
import { CreateDiagnosisDto } from './dto/create-diagnosis.dto';
import { PatchDiagnosisDto } from './dto/patch-diagnosis.dto';
import { RecalculateDiagnosisDto } from './dto/recalculate-diagnosis.dto';
import type { UserResponseDto } from '../users/dto/user-response.dto';

const CLINICAL_ROLES = [Role.ADMIN, Role.CONSULTANT_IR, Role.FELLOW, Role.CNS_COORDINATOR];

@Controller('episodes/:episodeId/diagnosis')
export class DiagnosisController {
  constructor(private readonly diagnosisService: DiagnosisService) {}

  @Get()
  getForEpisode(@Param('episodeId', ParseUUIDPipe) episodeId: string) {
    return this.diagnosisService.getForEpisode(episodeId);
  }

  @Post() @Roles(...CLINICAL_ROLES)
  create(@Param('episodeId', ParseUUIDPipe) episodeId: string, @Body() dto: CreateDiagnosisDto, @CurrentUser() currentUser: UserResponseDto, @Req() request: Request) {
    return this.diagnosisService.create(episodeId, dto, currentUser, request);
  }

  @Patch() @Roles(...CLINICAL_ROLES)
  patch(@Param('episodeId', ParseUUIDPipe) episodeId: string, @Body() dto: PatchDiagnosisDto, @CurrentUser() currentUser: UserResponseDto, @Req() request: Request) {
    return this.diagnosisService.patch(episodeId, dto, currentUser, request);
  }

  @Post('recalculate') @Roles(...CLINICAL_ROLES)
  recalculate(@Param('episodeId', ParseUUIDPipe) episodeId: string, @Body() dto: RecalculateDiagnosisDto, @CurrentUser() currentUser: UserResponseDto, @Req() request: Request) {
    return this.diagnosisService.recalculate(episodeId, dto, currentUser, request);
  }
}
