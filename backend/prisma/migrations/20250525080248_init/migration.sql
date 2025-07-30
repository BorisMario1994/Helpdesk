/*
  Warnings:

  - You are about to drop the column `JUMLAH` on the `HelpdeskDetails` table. All the data in the column will be lost.
  - You are about to drop the column `KETERANGAN` on the `HelpdeskDetails` table. All the data in the column will be lost.
  - You are about to drop the column `ORDER` on the `HelpdeskDetails` table. All the data in the column will be lost.
  - You are about to drop the column `REMARKS` on the `HelpdeskDetails` table. All the data in the column will be lost.
  - You are about to drop the column `RTB_REJECT` on the `HelpdeskHeader` table. All the data in the column will be lost.
  - You are about to drop the column `RTB_REVISI` on the `HelpdeskHeader` table. All the data in the column will be lost.
  - Added the required column `Jumlah` to the `HelpdeskDetails` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Keterangan` to the `HelpdeskDetails` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Order` to the `HelpdeskDetails` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Remarks` to the `HelpdeskDetails` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[HelpdeskCc] ALTER COLUMN [TanggalAc] DATETIME NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[HelpdeskDetails] ALTER COLUMN [TanggalTerima] DATETIME NOT NULL;
ALTER TABLE [dbo].[HelpdeskDetails] ALTER COLUMN [TS] DATETIME NOT NULL;
ALTER TABLE [dbo].[HelpdeskDetails] ALTER COLUMN [TanggalSelesai] DATETIME NOT NULL;
ALTER TABLE [dbo].[HelpdeskDetails] DROP COLUMN [JUMLAH],
[KETERANGAN],
[ORDER],
[REMARKS];
ALTER TABLE [dbo].[HelpdeskDetails] ADD [Jumlah] FLOAT(53) NOT NULL,
[Keterangan] TEXT NOT NULL,
[Order] VARCHAR(20) NOT NULL,
[Remarks] TEXT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[HelpdeskHeader] ALTER COLUMN [TanggalTerbit] DATETIME NOT NULL;
ALTER TABLE [dbo].[HelpdeskHeader] ALTER COLUMN [TanggalTerima] DATETIME NOT NULL;
ALTER TABLE [dbo].[HelpdeskHeader] ALTER COLUMN [TanggalSelesai] DATETIME NOT NULL;
ALTER TABLE [dbo].[HelpdeskHeader] DROP COLUMN [RTB_REJECT],
[RTB_REVISI];

-- AlterTable
ALTER TABLE [dbo].[PkpMasterMasalah] ALTER COLUMN [IsActive] VARCHAR(1) NOT NULL;

-- CreateTable
CREATE TABLE [dbo].[HelpdeskNote] (
    [Nomor] VARCHAR(20) NOT NULL,
    [LineNum] INT NOT NULL,
    [Tanggal] DATETIME NOT NULL,
    [Username] VARCHAR(10) NOT NULL,
    [Comment] TEXT NOT NULL,
    CONSTRAINT [PK__Helpdesk__BAE0D0021A8E294F] PRIMARY KEY CLUSTERED ([Nomor],[LineNum])
);

-- CreateTable
CREATE TABLE [dbo].[HelpdeskNotif] (
    [Nomor] VARCHAR(20) NOT NULL,
    [Username] VARCHAR(10) NOT NULL,
    [Action] VARCHAR(20) NOT NULL,
    CONSTRAINT [PK__Helpdesk__68C485ABCC3AE3BE] PRIMARY KEY CLUSTERED ([Nomor],[Username])
);

-- AddForeignKey
ALTER TABLE [dbo].[HelpdeskNote] ADD CONSTRAINT [FK_Nomor_HelpdeskHeader] FOREIGN KEY ([Nomor]) REFERENCES [dbo].[HelpdeskHeader]([Nomor]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[HelpdeskNotif] ADD CONSTRAINT [FK_HelpdeskNotif_HelpdeskHeader] FOREIGN KEY ([Nomor]) REFERENCES [dbo].[HelpdeskHeader]([Nomor]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
