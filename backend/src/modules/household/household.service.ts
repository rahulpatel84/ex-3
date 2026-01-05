import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import { EmailService } from '../../services/email.service';
import { CreateHouseholdDto } from './dto/create-household.dto';
import { UpdateHouseholdDto } from './dto/update-household.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import * as crypto from 'crypto';

@Injectable()
export class HouseholdService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  // ===== HOUSEHOLD CRUD =====

  async create(userId: string, createHouseholdDto: CreateHouseholdDto) {
    // Create household and add creator as owner
    const household = await this.prisma.household.create({
      data: {
        name: createHouseholdDto.name,
        description: createHouseholdDto.description,
        createdBy: userId,
        members: {
          create: {
            userId,
            role: 'owner',
            acceptedAt: new Date(),
            status: 'active',
          },
        },
      },
      include: {
        creator: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true, avatarUrl: true },
            },
          },
        },
      },
    });

    // Set as current household if user doesn't have one
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { currentHouseholdId: true },
    });

    if (!user.currentHouseholdId) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { currentHouseholdId: household.id },
      });
    }

    return household;
  }

  async findAll(userId: string) {
    // Get all households where user is a member
    return this.prisma.household.findMany({
      where: {
        members: {
          some: {
            userId,
            status: 'active',
          },
        },
      },
      include: {
        creator: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
        members: {
          where: { status: 'active' },
          include: {
            user: {
              select: { id: true, fullName: true, email: true, avatarUrl: true },
            },
          },
        },
        _count: {
          select: {
            expenses: { where: { deletedAt: null } },
            categories: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(householdId: string, userId: string) {
    const household = await this.prisma.household.findUnique({
      where: { id: householdId },
      include: {
        creator: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
        members: {
          where: { status: 'active' },
          include: {
            user: {
              select: { id: true, fullName: true, email: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        invitations: {
          where: {
            acceptedAt: null,
            declinedAt: null,
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            expenses: { where: { deletedAt: null } },
            categories: true,
          },
        },
      },
    });

    if (!household) {
      throw new NotFoundException('Household not found');
    }

    // Check if user is a member
    await this.checkMembership(householdId, userId);

    return household;
  }

  async update(householdId: string, userId: string, updateHouseholdDto: UpdateHouseholdDto) {
    // Check if user has permission (owner or admin)
    await this.checkPermission(householdId, userId, ['owner', 'admin']);

    return this.prisma.household.update({
      where: { id: householdId },
      data: updateHouseholdDto,
      include: {
        creator: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
        members: {
          where: { status: 'active' },
          include: {
            user: {
              select: { id: true, fullName: true, email: true, avatarUrl: true },
            },
          },
        },
      },
    });
  }

  async remove(householdId: string, userId: string) {
    // Only owner can delete household
    await this.checkPermission(householdId, userId, ['owner']);

    // Check if this is the only household for the user
    const userHouseholds = await this.findAll(userId);
    if (userHouseholds.length === 1) {
      throw new BadRequestException('Cannot delete your only household');
    }

    // Delete household (cascade will handle members, invitations, etc.)
    await this.prisma.household.delete({
      where: { id: householdId },
    });

    return { success: true, message: 'Household deleted successfully' };
  }

  // ===== MEMBER MANAGEMENT =====

  async inviteMember(householdId: string, userId: string, inviteMemberDto: InviteMemberDto) {
    // Check if user has permission (owner or admin)
    await this.checkPermission(householdId, userId, ['owner', 'admin']);

    const { email, role } = inviteMemberDto;

    // Check if user exists
    const invitedUser = await this.prisma.user.findUnique({
      where: { email },
    });

    // Check if already a member
    if (invitedUser) {
      const existingMember = await this.prisma.householdMember.findUnique({
        where: {
          householdId_userId: {
            householdId,
            userId: invitedUser.id,
          },
        },
      });

      if (existingMember && existingMember.status === 'active') {
        throw new ConflictException('User is already a member of this household');
      }
    }

    // Check for pending invitation
    const existingInvitation = await this.prisma.invitation.findFirst({
      where: {
        householdId,
        email,
        acceptedAt: null,
        declinedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      throw new ConflictException('An invitation is already pending for this email');
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create invitation
    const invitation = await this.prisma.invitation.create({
      data: {
        householdId,
        email,
        role: role || 'member',
        invitedBy: userId,
        token,
        expiresAt,
      },
      include: {
        household: {
          select: { id: true, name: true },
        },
      },
    });

    // Get inviter details
    const inviter = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true, email: true },
    });

    // Send invitation email
    try {
      await this.emailService.sendHouseholdInvitation(
        email,
        inviter.fullName,
        invitation.household.name,
        token,
      );
    } catch (error) {
      console.error('Failed to send invitation email:', error);
      // Don't fail the invitation if email fails
    }

    return invitation;
  }

  async acceptInvitation(token: string, userId: string) {
    // Find invitation
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: {
        household: {
          select: { id: true, name: true },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.acceptedAt) {
      throw new BadRequestException('Invitation has already been accepted');
    }

    if (invitation.declinedAt) {
      throw new BadRequestException('Invitation has been declined');
    }

    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invitation has expired');
    }

    // Get user email
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (user.email !== invitation.email) {
      throw new ForbiddenException('This invitation was sent to a different email address');
    }

    // Check if already a member
    const existingMember = await this.prisma.householdMember.findUnique({
      where: {
        householdId_userId: {
          householdId: invitation.householdId,
          userId,
        },
      },
    });

    if (existingMember && existingMember.status === 'active') {
      throw new ConflictException('You are already a member of this household');
    }

    // Create or update membership
    const member = await this.prisma.householdMember.upsert({
      where: {
        householdId_userId: {
          householdId: invitation.householdId,
          userId,
        },
      },
      create: {
        householdId: invitation.householdId,
        userId,
        role: invitation.role,
        invitedBy: invitation.invitedBy,
        acceptedAt: new Date(),
        status: 'active',
      },
      update: {
        role: invitation.role,
        acceptedAt: new Date(),
        status: 'active',
      },
      include: {
        household: {
          select: { id: true, name: true },
        },
        user: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
      },
    });

    // Mark invitation as accepted
    await this.prisma.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    });

    // Set as current household if user doesn't have one
    const userProfile = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { currentHouseholdId: true },
    });

    if (!userProfile.currentHouseholdId) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { currentHouseholdId: invitation.householdId },
      });
    }

    return member;
  }

  async declineInvitation(token: string, userId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.acceptedAt) {
      throw new BadRequestException('Invitation has already been accepted');
    }

    if (invitation.declinedAt) {
      throw new BadRequestException('Invitation has already been declined');
    }

    // Get user email
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (user.email !== invitation.email) {
      throw new ForbiddenException('This invitation was sent to a different email address');
    }

    return this.prisma.invitation.update({
      where: { id: invitation.id },
      data: { declinedAt: new Date() },
    });
  }

  async updateMemberRole(householdId: string, memberId: string, userId: string, updateMemberRoleDto: UpdateMemberRoleDto) {
    // Check if user has permission (owner or admin)
    await this.checkPermission(householdId, userId, ['owner', 'admin']);

    const member = await this.prisma.householdMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.householdId !== householdId) {
      throw new NotFoundException('Member not found in this household');
    }

    // Don't allow changing own role
    if (member.userId === userId) {
      throw new BadRequestException('You cannot change your own role');
    }

    // Only owner can assign owner role
    if (updateMemberRoleDto.role === 'owner') {
      await this.checkPermission(householdId, userId, ['owner']);
    }

    return this.prisma.householdMember.update({
      where: { id: memberId },
      data: { role: updateMemberRoleDto.role },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
      },
    });
  }

  async removeMember(householdId: string, memberId: string, userId: string) {
    // Check if user has permission (owner or admin)
    await this.checkPermission(householdId, userId, ['owner', 'admin']);

    const member = await this.prisma.householdMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.householdId !== householdId) {
      throw new NotFoundException('Member not found in this household');
    }

    // Don't allow removing own membership (use leaveHousehold instead)
    if (member.userId === userId) {
      throw new BadRequestException('Use the leave household endpoint to remove yourself');
    }

    // Don't allow removing the owner
    if (member.role === 'owner') {
      throw new BadRequestException('Cannot remove the household owner');
    }

    return this.prisma.householdMember.update({
      where: { id: memberId },
      data: { status: 'removed' },
    });
  }

  async leaveHousehold(householdId: string, userId: string) {
    const member = await this.prisma.householdMember.findUnique({
      where: {
        householdId_userId: {
          householdId,
          userId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('You are not a member of this household');
    }

    if (member.role === 'owner') {
      throw new BadRequestException('Owner cannot leave the household. Transfer ownership or delete the household instead.');
    }

    // Check if this is the only household for the user
    const userHouseholds = await this.findAll(userId);
    if (userHouseholds.length === 1) {
      throw new BadRequestException('Cannot leave your only household');
    }

    return this.prisma.householdMember.update({
      where: { id: member.id },
      data: { status: 'removed' },
    });
  }

  async switchHousehold(householdId: string, userId: string) {
    // Check if user is a member
    await this.checkMembership(householdId, userId);

    // Update user's current household
    await this.prisma.user.update({
      where: { id: userId },
      data: { currentHouseholdId: householdId },
    });

    return { success: true, message: 'Switched household successfully', householdId };
  }

  // ===== PERMISSION HELPERS =====

  async checkMembership(householdId: string, userId: string) {
    const member = await this.prisma.householdMember.findUnique({
      where: {
        householdId_userId: {
          householdId,
          userId,
        },
      },
    });

    if (!member || member.status !== 'active') {
      throw new ForbiddenException('You are not a member of this household');
    }

    return member;
  }

  async checkPermission(householdId: string, userId: string, allowedRoles: string[]) {
    const member = await this.checkMembership(householdId, userId);

    if (!allowedRoles.includes(member.role)) {
      throw new ForbiddenException(`This action requires one of the following roles: ${allowedRoles.join(', ')}`);
    }

    return member;
  }

  async getUserRole(householdId: string, userId: string): Promise<string | null> {
    const member = await this.prisma.householdMember.findUnique({
      where: {
        householdId_userId: {
          householdId,
          userId,
        },
      },
    });

    return member?.status === 'active' ? member.role : null;
  }
}

