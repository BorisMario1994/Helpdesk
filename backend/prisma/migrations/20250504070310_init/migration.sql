/*
  Warnings:

  - You are about to drop the column `AccToken` on the `HelpdeskUser` table. All the data in the column will be lost.
  - You are about to drop the column `BagianCode` on the `HelpdeskUser` table. All the data in the column will be lost.
  - You are about to drop the column `RefToken` on the `HelpdeskUser` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[HelpdeskUser] DROP CONSTRAINT [FK_User_Bagian];

-- AlterTable
ALTER TABLE [dbo].[HelpdeskUser] DROP COLUMN [AccToken],
[BagianCode],
[RefToken];
ALTER TABLE [dbo].[HelpdeskUser] ADD [Superior] VARCHAR(10);

-- AddForeignKey
ALTER TABLE [dbo].[HelpdeskUser] ADD CONSTRAINT [FK_User_Superior] FOREIGN KEY ([Superior]) REFERENCES [dbo].[HelpdeskUser]([Username]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
