import { IsString, IsIn } from 'class-validator';

export class UpdateMemberRoleDto {
  @IsString()
  @IsIn(['owner', 'admin', 'member', 'viewer'], { message: 'Invalid role. Must be owner, admin, member, or viewer' })
  role: string;
}

