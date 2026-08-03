import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe, ParseIntPipe, Req } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MappingService } from './mapping.service';
import { CreateMappingSessionDto } from './dto/create-mapping-session.dto';
import { PatchMappingSessionDto } from './dto/patch-mapping-session.dto';
import { CreateMaaStudyDto } from './dto/create-maa-study.dto';
import type { UserResponseDto } from '../users/dto/user-response.dto';

const CLINICAL_ROLES = [Role.ADMIN, Role.CONSULTANT_IR, Role.FELLOW, Role.CNS_COORDINATOR];

@Controller()
export class MappingController {
  constructor(private readonly mappingService: MappingService) {}

  @Get('episodes/:episodeId/mapping-sessions')
  listForEpisode(@Param('episodeId', ParseUUIDPipe) episodeId: string) {
    return this.mappingService.listForEpisode(episodeId);
  }

  @Post('episodes/:episodeId/mapping-sessions') @Roles(...CLINICAL_ROLES)
  create(@Param('episodeId', ParseUUIDPipe) episodeId: string, @Body() dto: CreateMappingSessionDto, @CurrentUser() currentUser: UserResponseDto, @Req() request: Request) {
    return this.mappingService.create(episodeId, dto, currentUser, request);
  }

  @Get('mapping-sessions/:id')
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.mappingService.getById(id);
  }

  @Patch('mapping-sessions/:id') @Roles(...CLINICAL_ROLES)
  patch(@Param('id', ParseUUIDPipe) id: string, @Body() dto: PatchMappingSessionDto, @CurrentUser() currentUser: UserResponseDto, @Req() request: Request) {
    return this.mappingService.patch(id, dto, currentUser, request);
  }

  @Delete('mapping-sessions/:id') @Roles(...CLINICAL_ROLES)
  remove(@Param('id', ParseUUIDPipe) id: string, @Query('version', ParseIntPipe) version: number, @CurrentUser() currentUser: UserResponseDto, @Req() request: Request) {
    return this.mappingService.remove(id, version, currentUser, request);
  }

  @Get('mapping-sessions/:id/maa-studies')
  listMaaStudies(@Param('id', ParseUUIDPipe) id: string) {
    return this.mappingService.listMaaStudies(id);
  }

  @Post('mapping-sessions/:id/maa-studies') @Roles(...CLINICAL_ROLES)
  createMaaStudy(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateMaaStudyDto, @CurrentUser() currentUser: UserResponseDto, @Req() request: Request) {
    return this.mappingService.createMaaStudy(id, dto, currentUser, request);
  }
}
