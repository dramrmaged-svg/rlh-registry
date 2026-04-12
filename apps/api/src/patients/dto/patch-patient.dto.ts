import { IsString, IsOptional, IsInt, Min, IsDateString, IsIn } from 'class-validator';
const SEX_VALUES = ['MALE', 'FEMALE', 'INDETERMINATE', 'UNKNOWN'] as const;
export class PatchPatientDto {
  @IsString() @IsOptional() firstName?: string;
  @IsString() @IsOptional() lastName?: string;
  @IsDateString() @IsOptional() dateOfBirth?: string;
  @IsIn(SEX_VALUES) @IsOptional() sex?: (typeof SEX_VALUES)[number];
  @IsString() @IsOptional() ethnicity?: string;
  @IsString() @IsOptional() gpPractice?: string;
  @IsString() @IsOptional() referringHospital?: string;
  @IsInt() @Min(1) version!: number;
}
