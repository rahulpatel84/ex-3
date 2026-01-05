import { Module } from '@nestjs/common';
import { HouseholdService } from './household.service';
import { HouseholdController } from './household.controller';
import { PrismaService } from '../../services/prisma.service';
import { EmailService } from '../../services/email.service';

@Module({
  controllers: [HouseholdController],
  providers: [HouseholdService, PrismaService, EmailService],
  exports: [HouseholdService],
})
export class HouseholdModule {}

