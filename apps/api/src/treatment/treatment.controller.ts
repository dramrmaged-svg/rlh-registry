import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe, ParseIntPipe, Req } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TreatmentService } from './treatment.service';
import { CreateTreatmentSessionDto } from './dto/create-treatment-session.dto';
import { PatchTreatmentSessionDto } from './dto/patch-treatment-session.dto';
import { CreateDoseInjectionDto } from './dto/create-dose-injection.dto';
import type { UserResponseDto } from '../users/dto/user-response.dto';

const CLINICAL_ROLES = [Role.ADMIN, Role.CONSULTANT_IR, Role.FELLOW, Role.CNS_COORDINATOR];

@Controller()
export class TreatmentController {
  constructor(private readonly treatmentService: TreatmentService) {}

  @Get('episodes/:episodeId/treatment-sessions')
  listForEpisode(@Param('episodeId', ParseUUIDPipe) episodeId: string) {
    return this.treatmentService.listForEpisode(episodeId);
  }

  @Post('episodes/:episodeId/treatment-sessions') @Roles(...CLINICAL_ROLES)
  create(@Param('episodeId', ParseUUIDPipe) episodeId: string, @Body() dto: CreateTreatmentSessionDto, @CurrentUser() currentUser: UserResponseDto, @Req() request: Request) {
    return this.treatmentService.create(episodeId, dto, currentUser, request);
  }

  @Get('treatment-sessions/:id')
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.treatmentService.getById(id);
  }

  @Patch('treatment-sessions/:id') @Roles(...CLINICAL_ROLES)
  patch(@Param('id', ParseUUIDPipe) id: string, @Body() dto: PatchTreatmentSessionDto, @CurrentUser() currentUser: UserResponseDto, @Req() request: Request) {
    return this.treatmentService.patch(id, dto, currentUser, request);
  }

  @Delete('treatment-sessions/:id') @Roles(...CLINICAL_ROLES)
  remove(@Param('id', ParseUUIDPipe) id: string, @Query('version', ParseIntPipe) version: number, @CurrentUser() currentUser: UserResponseDto, @Req() request: Request) {
    return this.treatmentService.remove(id, version, currentUser, request);
  }

  @Get('treatment-sessions/:id/dose-injections')
  listDoseInjections(@Param('id', ParseUUIDPipe) id: string) {
    return this.treatmentService.listDoseInjections(id);
  }

  @Post('treatment-sessions/:id/dose-injections') @Roles(...CLINICAL_ROLES)
  createDoseInjection(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateDoseInjectionDto, @CurrentUser() currentUser: UserResponseDto, @Req() request: Request) {
    return this.treatmentService.createDoseInjection(id, dto, currentUser, request);
  }
}
