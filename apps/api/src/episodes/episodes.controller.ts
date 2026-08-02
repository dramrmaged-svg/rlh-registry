import { Controller, Get, Post, Patch, Body, Param, ParseUUIDPipe, Req } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { EpisodesService } from './episodes.service';
import { CreateEpisodeDto } from './dto/create-episode.dto';
import { PatchEpisodeDto } from './dto/patch-episode.dto';
import { EpisodeTransitionDto } from './dto/episode-transition.dto';
import { ResumeEpisodeDto } from './dto/resume-episode.dto';
import { DuplicateEpisodeDto } from './dto/duplicate-episode.dto';
import type { UserResponseDto } from '../users/dto/user-response.dto';

@Controller()
export class EpisodesController {
  constructor(private readonly episodesService: EpisodesService) {}

  @Get('patients/:patientId/episodes')
  listForPatient(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.episodesService.listForPatient(patientId);
  }

  @Post('patients/:patientId/episodes') @Roles(Role.ADMIN, Role.CONSULTANT_IR, Role.FELLOW, Role.CNS_COORDINATOR)
  create(@Param('patientId', ParseUUIDPipe) patientId: string, @Body() dto: CreateEpisodeDto, @CurrentUser() currentUser: UserResponseDto, @Req() request: Request) {
    return this.episodesService.create(patientId, dto, currentUser, request);
  }

  @Get('episodes/:id')
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.episodesService.getById(id);
  }

  @Patch('episodes/:id') @Roles(Role.ADMIN, Role.CONSULTANT_IR, Role.FELLOW, Role.CNS_COORDINATOR)
  patch(@Param('id', ParseUUIDPipe) id: string, @Body() dto: PatchEpisodeDto, @CurrentUser() currentUser: UserResponseDto, @Req() request: Request) {
    return this.episodesService.patch(id, dto, currentUser, request);
  }

  @Post('episodes/:id/transition') @Roles(Role.ADMIN, Role.CONSULTANT_IR, Role.FELLOW, Role.CNS_COORDINATOR)
  transition(@Param('id', ParseUUIDPipe) id: string, @Body() dto: EpisodeTransitionDto, @CurrentUser() currentUser: UserResponseDto, @Req() request: Request) {
    return this.episodesService.transition(id, dto, currentUser, request);
  }

  @Post('episodes/:id/resume') @Roles(Role.ADMIN, Role.CONSULTANT_IR, Role.FELLOW, Role.CNS_COORDINATOR)
  resume(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ResumeEpisodeDto, @CurrentUser() currentUser: UserResponseDto, @Req() request: Request) {
    return this.episodesService.resume(id, dto, currentUser, request);
  }

  @Post('episodes/:id/duplicate') @Roles(Role.ADMIN, Role.CONSULTANT_IR, Role.FELLOW, Role.CNS_COORDINATOR)
  duplicate(@Param('id', ParseUUIDPipe) id: string, @Body() dto: DuplicateEpisodeDto, @CurrentUser() currentUser: UserResponseDto, @Req() request: Request) {
    return this.episodesService.duplicate(id, dto, currentUser, request);
  }

  @Get('episodes/:id/timeline')
  timeline(@Param('id', ParseUUIDPipe) id: string) {
    return this.episodesService.timeline(id);
  }
}
