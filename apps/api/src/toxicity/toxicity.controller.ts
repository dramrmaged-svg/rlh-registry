import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe, ParseIntPipe, Req } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ToxicityService } from './toxicity.service';
import { CreateToxicityEventDto } from './dto/create-toxicity-event.dto';
import { PatchToxicityEventDto } from './dto/patch-toxicity-event.dto';
import type { UserResponseDto } from '../users/dto/user-response.dto';

const CLINICAL_ROLES = [Role.ADMIN, Role.CONSULTANT_IR, Role.FELLOW, Role.CNS_COORDINATOR];

@Controller()
export class ToxicityController {
  constructor(private readonly toxicityService: ToxicityService) {}

  @Get('episodes/:episodeId/toxicity-events')
  listForEpisode(@Param('episodeId', ParseUUIDPipe) episodeId: string) {
    return this.toxicityService.listForEpisode(episodeId);
  }

  @Post('episodes/:episodeId/toxicity-events') @Roles(...CLINICAL_ROLES)
  create(@Param('episodeId', ParseUUIDPipe) episodeId: string, @Body() dto: CreateToxicityEventDto, @CurrentUser() currentUser: UserResponseDto, @Req() request: Request) {
    return this.toxicityService.create(episodeId, dto, currentUser, request);
  }

  @Get('toxicity-events/:id')
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.toxicityService.getById(id);
  }

  @Patch('toxicity-events/:id') @Roles(...CLINICAL_ROLES)
  patch(@Param('id', ParseUUIDPipe) id: string, @Body() dto: PatchToxicityEventDto, @CurrentUser() currentUser: UserResponseDto, @Req() request: Request) {
    return this.toxicityService.patch(id, dto, currentUser, request);
  }

  @Delete('toxicity-events/:id') @Roles(...CLINICAL_ROLES)
  remove(@Param('id', ParseUUIDPipe) id: string, @Query('version', ParseIntPipe) version: number, @CurrentUser() currentUser: UserResponseDto, @Req() request: Request) {
    return this.toxicityService.remove(id, version, currentUser, request);
  }
}
