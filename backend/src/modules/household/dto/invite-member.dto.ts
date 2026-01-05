import { IsEmail, IsString, IsIn, IsOptional } from 'class-validator';

export class InviteMemberDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsOptional()
  @IsString()
  @IsIn(['owner', 'admin', 'member', 'viewer'], { message: 'Invalid role. Must be owner, admin, member, or viewer' })
  role?: string = 'member';
}

