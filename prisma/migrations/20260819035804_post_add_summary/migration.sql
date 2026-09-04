/*
  Warnings:

  - Added the required column `summary` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "summary" TEXT;

UPDATE "Post" SET "summary" = 'temp summary string' WHERE "summary" IS NULL;

ALTER TABLE "Post" ALTER COLUMN "summary" SET NOT NULL;
