-- CreateTable: Households - Shared workspaces for expenses
CREATE TABLE "households" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "households_pkey" PRIMARY KEY ("id")
);

-- CreateTable: HouseholdMember - User membership in households with roles
CREATE TABLE "household_members" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "invited_by" TEXT,
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "household_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Invitations - Email invitations for joining households
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "invited_by" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "declined_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Add currentHouseholdId to users
ALTER TABLE "users" ADD COLUMN "current_household_id" TEXT;

-- AlterTable: Add householdId to categories (nullable for backward compatibility)
ALTER TABLE "categories" ADD COLUMN "household_id" TEXT;

-- AlterTable: Add householdId to expenses (nullable for backward compatibility)
ALTER TABLE "expenses" ADD COLUMN "household_id" TEXT;

-- CreateIndex
CREATE INDEX "households_created_by_idx" ON "households"("created_by");

-- CreateIndex
CREATE INDEX "household_members_household_id_idx" ON "household_members"("household_id");

-- CreateIndex
CREATE INDEX "household_members_user_id_idx" ON "household_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "household_members_household_id_user_id_key" ON "household_members"("household_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_key" ON "invitations"("token");

-- CreateIndex
CREATE INDEX "invitations_token_idx" ON "invitations"("token");

-- CreateIndex
CREATE INDEX "invitations_email_idx" ON "invitations"("email");

-- CreateIndex
CREATE INDEX "categories_household_id_idx" ON "categories"("household_id");

-- CreateIndex
CREATE INDEX "expenses_household_id_idx" ON "expenses"("household_id");

-- AddForeignKey
ALTER TABLE "households" ADD CONSTRAINT "households_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- MIGRATION: Create default household for each existing user
-- This ensures backward compatibility with existing data
DO $$
DECLARE
    user_record RECORD;
    new_household_id TEXT;
BEGIN
    -- Loop through all existing users
    FOR user_record IN SELECT id, full_name, email FROM users LOOP
        -- Generate UUID for new household
        new_household_id := gen_random_uuid()::TEXT;
        
        -- Create a "Personal" household for each user
        INSERT INTO households (id, name, description, created_by, updated_at)
        VALUES (
            new_household_id,
            user_record.full_name || '''s Personal Expenses',
            'Automatically created default household',
            user_record.id,
            NOW()
        );
        
        -- Add user as owner of their household
        INSERT INTO household_members (id, household_id, user_id, role, accepted_at, status, updated_at)
        VALUES (
            gen_random_uuid()::TEXT,
            new_household_id,
            user_record.id,
            'owner',
            NOW(),
            'active',
            NOW()
        );
        
        -- Set this as the user's current household
        UPDATE users
        SET current_household_id = new_household_id
        WHERE id = user_record.id;
        
        -- Link all existing categories to this household
        UPDATE categories
        SET household_id = new_household_id
        WHERE user_id = user_record.id AND household_id IS NULL;
        
        -- Link all existing expenses to this household
        UPDATE expenses
        SET household_id = new_household_id
        WHERE user_id = user_record.id AND household_id IS NULL;
        
        RAISE NOTICE 'Created household % for user %', new_household_id, user_record.email;
    END LOOP;
END $$;

-- Add comment for future reference
COMMENT ON TABLE "households" IS 'Shared workspaces for expense tracking. Users can be members of multiple households.';
COMMENT ON TABLE "household_members" IS 'User membership in households with roles (owner, admin, member, viewer).';
COMMENT ON TABLE "invitations" IS 'Email invitations for joining households. Tokens expire after 7 days.';

