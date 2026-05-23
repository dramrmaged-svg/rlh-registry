import { Controller, Get, Post, Body, Param, ParseUUIDPipe, Req } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ChestXrayAiService } from './chest-xray-ai.service';
import { CreateChestXrayAiReportDto } from './dto/create-chest-xray-ai-report.dto';
import { ReviewChestXrayAiReportDto } from './dto/review-chest-xray-ai-report.dto';
import type { UserResponseDto } from '../users/dto/user-response.dto';

@Controller()
export class ChestXrayAiController {
  constructor(private readonly chestXrayAiService: ChestXrayAiService) {}

  @Get('patients/:patientId/chest-xray-ai-reports')
  listForPatient(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.chestXrayAiService.listForPatient(patientId);
  }

  @Post('patients/:patientId/chest-xray-ai-reports')
  @Roles(Role.ADMIN, Role.CONSULTANT_IR, Role.FELLOW, Role.DATA_MANAGER)
  create(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: CreateChestXrayAiReportDto,
    @CurrentUser() currentUser: UserResponseDto,
    @Req() request: Request,
  ) {
    return this.chestXrayAiService.create(patientId, dto, currentUser, request);
  }

  @Get('chest-xray-ai-reports/:id')
  getReport(@Param('id', ParseUUIDPipe) id: string) {
    return this.chestXrayAiService.getReport(id);
  }

  @Post('chest-xray-ai-reports/:id/review')
  @Roles(Role.ADMIN, Role.CONSULTANT_IR)
  review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewChestXrayAiReportDto,
    @CurrentUser() currentUser: UserResponseDto,
    @Req() request: Request,
  ) {
    return this.chestXrayAiService.review(id, dto, currentUser, request);
  }
}
