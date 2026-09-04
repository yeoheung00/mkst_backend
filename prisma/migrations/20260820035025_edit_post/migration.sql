/*
  Warnings:

  - Added the required column `toc` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Made the column `width` on table `PostImage` required. This step will fail if there are existing NULL values in that column.
  - Made the column `height` on table `PostImage` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "authorName" TEXT,
ADD COLUMN     "password" TEXT,
ALTER COLUMN "authorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "toc" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "PostImage" ALTER COLUMN "width" SET NOT NULL,
ALTER COLUMN "height" SET NOT NULL;
