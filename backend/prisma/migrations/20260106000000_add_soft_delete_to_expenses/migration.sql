-- AlterTable
ALTER TABLE "expenses" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "expenses" ADD COLUMN "deleted_by" TEXT;

-- CreateIndex
CREATE INDEX "expenses_deleted_at_idx" ON "expenses"("deleted_at");

