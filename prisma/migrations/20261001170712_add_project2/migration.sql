/*
  Warnings:

  - Made the column `githubUrl` on table `Project` required. This step will fail if there are existing NULL values in that column.
  - Made the column `readmeContent` on table `Project` required. This step will fail if there are existing NULL values in that column.
  - Made the column `syncedAt` on table `Project` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "githubUrl" SET NOT NULL,
ALTER COLUMN "readmeContent" SET NOT NULL,
ALTER COLUMN "syncedAt" SET NOT NULL;
