import { Injectable, OnModuleInit, OnModuleDestroy, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
  }

  async onModuleInit() {
    try {
      await this.prisma.$connect();
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('⚠️  Database connection failed:', error.message);
      console.log('⚠️  Server will continue without database connection');
      console.log('💡 To fix: Use local PostgreSQL or deploy to production');
    }
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
    console.log('👋 Database disconnected');
  }

  // Expose Prisma client methods
  get user() {
    return this.prisma.user;
  }

  get passwordReset() {
    return this.prisma.passwordReset;
  }

  get emailVerification() {
    return this.prisma.emailVerification;
  }

  get auditLog() {
    return this.prisma.auditLog;
  }

  get category() {
    return this.prisma.category;
  }

  get expense() {
    return this.prisma.expense;
  }

  get household() {
    return this.prisma.household;
  }

  get householdMember() {
    return this.prisma.householdMember;
  }

  get invitation() {
    return this.prisma.invitation;
  }
}
