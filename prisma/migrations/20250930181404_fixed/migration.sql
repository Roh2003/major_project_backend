-- AlterTable
ALTER TABLE "roles" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "updated_at" DROP NOT NULL;
