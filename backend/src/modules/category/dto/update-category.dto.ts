import { IsString, IsOptional, Length, Matches } from 'class-validator';

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  @Length(1, 50)
  name?: string;

  @IsString()
  @IsOptional()
  @Length(1, 10)
  icon?: string;

  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Color must be a valid hex color (e.g., #6366f1)' })
  color?: string;
}
