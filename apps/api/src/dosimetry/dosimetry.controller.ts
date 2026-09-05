import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe, ParseIntPipe, Req } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DosimetryService } from './dosimetry.service';
import { CreateDosimetryPlanDto } from './dto/create-dosimetry-plan.dto';
import { PatchDosimetryPlanDto } from './dto/patch-dosimetry-plan.dto';
import type { UserResponseDto } from '../users/dto/user-response.dto';

const CLINICAL_ROLES = [Role.ADMIN, Role.CONSULTANT_IR, Role.FELLOW, Role.CNS_COORDINATOR];

@Controller()
export class DosimetryController {
  constructor(private readonly dosimetryService: DosimetryService) {}

  @Get('episodes/:episodeId/dosimetry-plans')
  listForEpisode(@Param('episodeId', ParseUUIDPipe) episodeId: string) {
    return this.dosimetryService.listForEpisode(episodeId);
  }

  @Post('episodes/:episodeId/dosimetry-plans') @Roles(...CLINICAL_ROLES)
  create(@Param('episodeId', ParseUUIDPipe) episodeId: string, @Body() dto: CreateDosimetryPlanDto, @CurrentUser() currentUser: UserResponseDto, @Req() request: Request) {
    return this.dosimetryService.create(episodeId, dto, currentUser, request);
  }

  @Get('dosimetry-plans/:id')
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.dosimetryService.getById(id);
  }

  @Patch('dosimetry-plans/:id') @Roles(...CLINICAL_ROLES)
  patch(@Param('id', ParseUUIDPipe) id: string, @Body() dto: PatchDosimetryPlanDto, @CurrentUser() currentUser: UserResponseDto, @Req() request: Request) {
    return this.dosimetryService.patch(id, dto, currentUser, request);
  }

  @Post('dosimetry-plans/:id/approve') @Roles(Role.ADMIN, Role.CONSULTANT_IR)
  approve(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() currentUser: UserResponseDto, @Req() request: Request) {
    return this.dosimetryService.approve(id, currentUser, request);
  }

  @Delete('dosimetry-plans/:id') @Roles(...CLINICAL_ROLES)
  remove(@Param('id', ParseUUIDPipe) id: string, @Query('version', ParseIntPipe) version: number, @CurrentUser() currentUser: UserResponseDto, @Req() request: Request) {
    return this.dosimetryService.remove(id, version, currentUser, request);
  }
}
