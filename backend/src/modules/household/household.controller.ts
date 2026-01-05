import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { HouseholdService } from './household.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateHouseholdDto } from './dto/create-household.dto';
import { UpdateHouseholdDto } from './dto/update-household.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

@Controller('households')
@UseGuards(JwtAuthGuard)
export class HouseholdController {
  constructor(private readonly householdService: HouseholdService) {}

  // ===== HOUSEHOLD CRUD =====

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createHouseholdDto: CreateHouseholdDto, @Req() req: any) {
    const household = await this.householdService.create(req.user.id, createHouseholdDto);
    return {
      success: true,
      message: 'Household created successfully',
      data: household,
    };
  }

  @Get()
  async findAll(@Req() req: any) {
    const households = await this.householdService.findAll(req.user.id);
    return {
      success: true,
      data: households,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const household = await this.householdService.findOne(id, req.user.id);
    return {
      success: true,
      data: household,
    };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateHouseholdDto: UpdateHouseholdDto,
    @Req() req: any,
  ) {
    const household = await this.householdService.update(id, req.user.id, updateHouseholdDto);
    return {
      success: true,
      message: 'Household updated successfully',
      data: household,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @Req() req: any) {
    const result = await this.householdService.remove(id, req.user.id);
    return result;
  }

  // ===== MEMBER MANAGEMENT =====

  @Post(':id/invite')
  @HttpCode(HttpStatus.CREATED)
  async inviteMember(
    @Param('id') id: string,
    @Body() inviteMemberDto: InviteMemberDto,
    @Req() req: any,
  ) {
    const invitation = await this.householdService.inviteMember(id, req.user.id, inviteMemberDto);
    return {
      success: true,
      message: 'Invitation sent successfully',
      data: invitation,
    };
  }

  @Post('invitations/:token/accept')
  @HttpCode(HttpStatus.OK)
  async acceptInvitation(@Param('token') token: string, @Req() req: any) {
    const member = await this.householdService.acceptInvitation(token, req.user.id);
    return {
      success: true,
      message: 'Invitation accepted successfully',
      data: member,
    };
  }

  @Post('invitations/:token/decline')
  @HttpCode(HttpStatus.OK)
  async declineInvitation(@Param('token') token: string, @Req() req: any) {
    await this.householdService.declineInvitation(token, req.user.id);
    return {
      success: true,
      message: 'Invitation declined',
    };
  }

  @Put(':id/members/:memberId/role')
  async updateMemberRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() updateMemberRoleDto: UpdateMemberRoleDto,
    @Req() req: any,
  ) {
    const member = await this.householdService.updateMemberRole(
      id,
      memberId,
      req.user.id,
      updateMemberRoleDto,
    );
    return {
      success: true,
      message: 'Member role updated successfully',
      data: member,
    };
  }

  @Delete(':id/members/:memberId')
  @HttpCode(HttpStatus.OK)
  async removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Req() req: any,
  ) {
    await this.householdService.removeMember(id, memberId, req.user.id);
    return {
      success: true,
      message: 'Member removed successfully',
    };
  }

  @Post(':id/leave')
  @HttpCode(HttpStatus.OK)
  async leaveHousehold(@Param('id') id: string, @Req() req: any) {
    await this.householdService.leaveHousehold(id, req.user.id);
    return {
      success: true,
      message: 'Left household successfully',
    };
  }

  @Post(':id/switch')
  @HttpCode(HttpStatus.OK)
  async switchHousehold(@Param('id') id: string, @Req() req: any) {
    const result = await this.householdService.switchHousehold(id, req.user.id);
    return result;
  }
}

