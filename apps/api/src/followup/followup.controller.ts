import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe, ParseIntPipe, Req } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FollowUpService } from './followup.service';
import { CreateFollowUpDto } from './dto/create-follow-up.dto';
import { PatchFollowUpDto } from './dto/patch-follow-up.dto';
import type { UserResponseDto } from '../users/dto/user-response.dto';

const CLINICAL_ROLES = [Role.ADMIN, Role.CONSULTANT_IR, Role.FELLOW, Role.CNS_COORDINATOR];

@Controller()
export class FollowUpController {
  constructor(private readonly followUpService: FollowUpService) {}

  @Get('episodes/:episodeId/follow-ups')
  listForEpisode(@Param('episodeId', ParseUUIDPipe) episodeId: string) {
    return this.followUpService.listForEpisode(episodeId);
  }

  @Post('episodes/:episodeId/follow-ups') @Roles(...CLINICAL_ROLES)
  create(@Param('episodeId', ParseUUIDPipe) episodeId: string, @Body() dto: CreateFollowUpDto, @CurrentUser() currentUser: UserResponseDto, @Req() request: Request) {
    return this.followUpService.create(episodeId, dto, currentUser, request);
  }

  @Get('follow-ups/:id')
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.followUpService.getById(id);
  }

  @Patch('follow-ups/:id') @Roles(...CLINICAL_ROLES)
  patch(@Param('id', ParseUUIDPipe) id: string, @Body() dto: PatchFollowUpDto, @CurrentUser() currentUser: UserResponseDto, @Req() request: Request) {
    return this.followUpService.patch(id, dto, currentUser, request);
  }

  @Delete('follow-ups/:id') @Roles(...CLINICAL_ROLES)
  remove(@Param('id', ParseUUIDPipe) id: string, @Query('version', ParseIntPipe) version: number, @CurrentUser() currentUser: UserResponseDto, @Req() request: Request) {
    return this.followUpService.remove(id, version, currentUser, request);
  }
}
