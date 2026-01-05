import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateHouseholdDto {
  @IsString()
  @MinLength(1, { message: 'Household name is required' })
  @MaxLength(100, { message: 'Household name must be less than 100 characters' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description must be less than 500 characters' })
  description?: string;
}

