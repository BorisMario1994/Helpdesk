BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[HelpdeskCc] (
    [Nomor] VARCHAR(20) NOT NULL,
    [LineNum] INT NOT NULL,
    [CC] VARCHAR(10) NOT NULL,
    [AC] VARCHAR(10) NOT NULL,
    [TanggalAc] DATE NOT NULL,
    [RTB] TEXT NOT NULL,
    [PIC] VARCHAR(10) NOT NULL,
    [NamaFile] VARCHAR(256) NOT NULL,
    CONSTRAINT [PK__Helpdesk__FAC0AB61D1B154B7] PRIMARY KEY CLUSTERED ([Nomor],[LineNum])
);

-- CreateTable
CREATE TABLE [dbo].[HelpdeskDetails] (
    [Nomor] VARCHAR(20) NOT NULL,
    [LineNum] INT NOT NULL,
    [ORDER] VARCHAR(20) NOT NULL,
    [JUMLAH] FLOAT(53) NOT NULL,
    [KETERANGAN] TEXT NOT NULL,
    [Status] VARCHAR(20) NOT NULL,
    [PIC] VARCHAR(10) NOT NULL,
    [REMARKS] TEXT NOT NULL,
    [TanggalTerima] DATE NOT NULL,
    [TS] DATE NOT NULL,
    [TanggalSelesai] DATE NOT NULL,
    CONSTRAINT [PK__Helpdesk__FAC0AB614DD66B52] PRIMARY KEY CLUSTERED ([Nomor],[LineNum])
);

-- CreateTable
CREATE TABLE [dbo].[HelpdeskHeader] (
    [Nomor] VARCHAR(20) NOT NULL,
    [Title] TEXT NOT NULL,
    [Tipe] VARCHAR(20) NOT NULL,
    [Prioritas] VARCHAR(20) NOT NULL,
    [Dari] VARCHAR(10) NOT NULL,
    [Kepada] VARCHAR(10) NOT NULL,
    [Status] VARCHAR(20) NOT NULL,
    [Pertimbangan] TEXT NOT NULL,
    [NamaFile] VARCHAR(256) NOT NULL,
    [NamaFileKepada] VARCHAR(256) NOT NULL,
    [TanggalTerbit] DATE NOT NULL,
    [TanggalTerima] DATE NOT NULL,
    [TanggalSelesai] DATE NOT NULL,
    [RTB_REVISI] TEXT NOT NULL,
    [RTB_REJECT] TEXT NOT NULL,
    CONSTRAINT [PK__Helpdesk__05A5886BFE460DBF] PRIMARY KEY CLUSTERED ([Nomor])
);

-- CreateTable
CREATE TABLE [dbo].[HelpdeskBagian] (
    [Code] VARCHAR(10) NOT NULL,
    [Descrption] VARCHAR(256) NOT NULL,
    [IsActive] CHAR(1) NOT NULL CONSTRAINT [DF__HelpdeskB__IsAct__43F60EC8] DEFAULT 'Y',
    [UpperBagianCode] VARCHAR(10),
    CONSTRAINT [PK__Helpdesk__A25C5AA686BAD0B6] PRIMARY KEY CLUSTERED ([Code])
);

-- CreateTable
CREATE TABLE [dbo].[HelpdeskOrderMaster] (
    [Code] VARCHAR(10) NOT NULL,
    [Descrption] VARCHAR(256) NOT NULL,
    [IsActive] CHAR(1) NOT NULL CONSTRAINT [DF__HelpdeskO__IsAct__65570293] DEFAULT 'Y',
    CONSTRAINT [PK__Helpdesk__A25C5AA687C5F437] PRIMARY KEY CLUSTERED ([Code])
);

-- CreateTable
CREATE TABLE [dbo].[HelpdeskUser] (
    [Username] VARCHAR(10) NOT NULL,
    [Pwd] VARCHAR(256) NOT NULL,
    [Salt] VARCHAR(20) NOT NULL,
    [AccToken] VARCHAR(256) NOT NULL,
    [RefToken] VARCHAR(256) NOT NULL,
    [BagianCode] VARCHAR(10),
    [Lvl] VARCHAR(10) NOT NULL,
    [IsActive] CHAR(1) NOT NULL CONSTRAINT [DF__HelpdeskU__IsAct__4F67C174] DEFAULT 'Y',
    CONSTRAINT [PK__Helpdesk__536C85E58E0745CF] PRIMARY KEY CLUSTERED ([Username])
);

-- CreateTable
CREATE TABLE [dbo].[PkpMasterMasalah] (
    [Code] INT NOT NULL,
    [Masalah] VARCHAR(256) NOT NULL,
    [IsActive] CHAR(1) NOT NULL,
    CONSTRAINT [PK__PkpMaste__A25C5AA61F5D78BB] PRIMARY KEY CLUSTERED ([Code])
);

-- AddForeignKey
ALTER TABLE [dbo].[HelpdeskCc] ADD CONSTRAINT [FK_HelpdeskCc_HelpdeskHeader] FOREIGN KEY ([Nomor]) REFERENCES [dbo].[HelpdeskHeader]([Nomor]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[HelpdeskDetails] ADD CONSTRAINT [FK_HelpdeskDetail_HelpdeskHeader] FOREIGN KEY ([Nomor]) REFERENCES [dbo].[HelpdeskHeader]([Nomor]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[HelpdeskBagian] ADD CONSTRAINT [FK_Bagian_UpperBagian] FOREIGN KEY ([UpperBagianCode]) REFERENCES [dbo].[HelpdeskBagian]([Code]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[HelpdeskUser] ADD CONSTRAINT [FK_User_Bagian] FOREIGN KEY ([BagianCode]) REFERENCES [dbo].[HelpdeskBagian]([Code]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
