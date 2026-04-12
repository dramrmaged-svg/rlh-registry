import { IsOptional, IsString, IsBoolean, IsIn, IsInt, Min, Max, MinLength } from 'class-validator';
import { Transform, Type } from 'class-transformer';
export class PatientListQueryDto {
  @IsString() @MinLength(2) @IsOptional() search?: string;
  @IsBoolean() @Transform(({ value }: { value: unknown }) => { if (value === 'true') return true; if (value === 'false') return false; return value; }) @IsOptional() isActive?: boolean;
  @IsInt() @Min(1) @Max(100) @Type(() => Number) @IsOptional() limit?: number = 25;
  @IsString() @IsOptional() cursor?: string;
  @IsIn(['lastName', 'createdAt', 'dateOfBirth']) @IsOptional() sortBy?: 'lastName' | 'createdAt' | 'dateOfBirth' = 'lastName';
  @IsIn(['asc', 'desc']) @IsOptional() sortOrder?: 'asc' | 'desc' = 'asc';
}
