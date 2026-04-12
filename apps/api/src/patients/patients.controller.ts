import { Controller, Get, Post, Patch, Body, Param, Query, ParseUUIDPipe, HttpStatus, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { PatchPatientDto } from './dto/patch-patient.dto';
import { PatientListQueryDto } from './dto/patient-list-query.dto';
import type { UserResponseDto } from '../users/dto/user-response.dto';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get() list(@Query() query: PatientListQueryDto) { return this.patientsService.list(query); }

  @Get(':patientId') getById(@Param('patientId', ParseUUIDPipe) patientId: string) { return this.patientsService.getById(patientId); }

  @Post() @Roles(Role.ADMIN, Role.CONSULTANT_IR, Role.FELLOW, Role.CNS_COORDINATOR)
  async create(@Body() dto: CreatePatientDto, @CurrentUser() currentUser: UserResponseDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const result = await this.patientsService.create(dto, currentUser, request);
    response.status(result.status === 'CREATED' ? HttpStatus.CREATED : HttpStatus.OK);
    return result;
  }

  @Patch(':patientId') @Roles(Role.ADMIN, Role.CONSULTANT_IR, Role.FELLOW, Role.CNS_COORDINATOR)
  patch(@Param('patientId', ParseUUIDPipe) patientId: string, @Body() dto: PatchPatientDto, @CurrentUser() currentUser: UserResponseDto, @Req() request: Request) {
    return this.patientsService.patch(patientId, dto, currentUser, request);
  }
}
