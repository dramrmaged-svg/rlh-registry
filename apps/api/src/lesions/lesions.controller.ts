import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe, ParseIntPipe, Req } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { LesionsService } from './lesions.service';
import { CreateLesionDto } from './dto/create-lesion.dto';
import { PatchLesionDto } from './dto/patch-lesion.dto';
import type { UserResponseDto } from '../users/dto/user-response.dto';

const CLINICAL_ROLES = [Role.ADMIN, Role.CONSULTANT_IR, Role.FELLOW, Role.CNS_COORDINATOR];

@Controller()
export class LesionsController {
  constructor(private readonly lesionsService: LesionsService) {}

  @Get('episodes/:episodeId/lesions')
  listForEpisode(@Param('episodeId', ParseUUIDPipe) episodeId: string) {
    return this.lesionsService.listForEpisode(episodeId);
  }

  @Post('episodes/:episodeId/lesions') @Roles(...CLINICAL_ROLES)
  create(@Param('episodeId', ParseUUIDPipe) episodeId: string, @Body() dto: CreateLesionDto, @CurrentUser() currentUser: UserResponseDto, @Req() request: Request) {
    return this.lesionsService.create(episodeId, dto, currentUser, request);
  }

  @Get('lesions/:id')
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.lesionsService.getById(id);
  }

  @Patch('lesions/:id') @Roles(...CLINICAL_ROLES)
  patch(@Param('id', ParseUUIDPipe) id: string, @Body() dto: PatchLesionDto, @CurrentUser() currentUser: UserResponseDto, @Req() request: Request) {
    return this.lesionsService.patch(id, dto, currentUser, request);
  }

  @Delete('lesions/:id') @Roles(...CLINICAL_ROLES)
  remove(@Param('id', ParseUUIDPipe) id: string, @Query('version', ParseIntPipe) version: number, @CurrentUser() currentUser: UserResponseDto, @Req() request: Request) {
    return this.lesionsService.remove(id, version, currentUser, request);
  }
}
