import { IsUUID, IsOptional, IsNumber, IsString } from 'class-validator';

export class CreateDoseInjectionDto {
  @IsUUID() lesionId!: string;
  @IsUUID() @IsOptional() lesionFeederId?: string;
  @IsNumber() @IsOptional() deliveredActivityGbq?: number;
  @IsNumber() @IsOptional() deliveredDoseGy?: number;
  @IsNumber() @IsOptional() particleCount?: number;
  @IsString() @IsOptional() notes?: string;
}
