import AppError from "../AppError";
import { HelpdeskUser, Prisma } from "../../../generated/prisma";
import prisma from "../../PrismaConnection";
import { createHash } from "crypto";

// Defining a new type out of the one Prisma generated before to exclude credentials columns to be send to frontend. 
type UserWithChildren = Prisma.HelpdeskUserGetPayload<{
  select: {
    Username: true;
    Lvl: true;
    IsActive: true;
    Superior: true;
    other_HelpdeskUser: true;
  };
}>;

// User class is used for encapsulating User properties with all of its method for creating, updating or retrieving data from database. 
// It is created based on HelpdeskUser table structure in database and to align with the type created by Prisma ORM. 
class User {
  readonly username: string;
  readonly lvl: string;
  readonly isActive: boolean;
  superior: string;
  inferior: string[];

  // Constructor for initializing User class.
  constructor(username: string = "", lvl: string = "", isActive: boolean = false, superior: string = "", inferior: HelpdeskUser[] = []) {
    this.username = username;
    this.lvl = lvl;
    this.isActive = isActive;
    this.superior = superior;
    this.inferior = inferior.map(u => u.Username);
  };

  // Second constructor of User class which uses HelpdeskUser type (generated from Prisma ORM based on the corresponding table structure) as parameter. 
  static createFromType = (data: HelpdeskUser) => {
    return new User(data.Username, data.Lvl, data.IsActive === "Y", data.Superior || "");
  };

  // Third constructor of User class which uses custom-typed UserWithChildren type as parameter. 
  static createFromTypeWithChildren = (data: UserWithChildren) => {
    return new User(data.Username, data.Lvl, data.IsActive === "Y", data.Superior || "", data.other_HelpdeskUser);
  };

  // Check on database for the table on whether the "username" value provided by user is already exists in database. Username is the primary key 
  // of HelpdeskUser table, thus the value couldn't be redundant.
  static checkUsernameAvailability = async (username: string) => {
    return !(await prisma.helpdeskUser.findFirst({
      select: { Username: true },
      where: { Username: username }
    }));
  };

  // Method to check the credentials provided by client before doing the further operations by checking the existences of username and password checking. 
  static checkCredentials = async (username: string, password: string = "") => {
    try {
      const creds = await prisma.helpdeskUser.findFirst({
        where: { Username: username }
      });

      const divDeptActive = await prisma.helpdeskBagian.findFirst({
        where: { Code: username.substring(0, 4), IsActive: "Y" }
      });

      if (!creds || (username.substring(4) === "-01" && !divDeptActive)) {
        let error = new AppError(new Error(), "UserNotExists", "User not found.");
        error.LogError();
        throw error;
      }

      if (!createHash("sha256").update(creds.Salt.substring(0, 5) + password + creds.Salt.substring(5)).digest().equals(Buffer.from(creds.Pwd))) {
        let error = new AppError(new Error(), "AuthenticationFailed", "Credential is invalid.");
        error.LogError();
        throw error;
      }

      return User.getUserByUsername(username);
    } catch(err) {
      throw err;
    }
  };

  static insertLog = async (username: string) => {
    try {
      await prisma.$queryRawUnsafe(`INSERT INTO HELPDESK_LOGIN VALUES ('${username}', GETDATE())`);
    } catch(err) {
      throw err;
    }
  }

  // Method to get User data by passing username value as parameter. 
  static getUserByUsername = async (username: string) => {
    const getUserListQuery = await prisma.$queryRaw`EXEC [dbo].[EF_GET_USER_TREE]` as HelpdeskUser[];
    const user = User.createFromTypeWithChildren(await prisma.helpdeskUser.findFirst({
      where: { Username: username },
      select: { 
        Username: true, Lvl: true, IsActive: true, Superior: true, other_HelpdeskUser: {
          where: { IsActive: "Y" },
          select: { Username: true, Lvl: true, IsActive: true, Superior: true }
        }
      },
    }) as UserWithChildren);
    user.superior = getUserListQuery.find(findUser => findUser.Username === user.username)?.Superior || "";
    user.inferior = getUserListQuery.filter(findUser => findUser.Superior === user.username).map(resUser => resUser.Username);
    return user;
  };

  // Method to get list of User data from database. 
  static getUserList = async () => {
    const getUserListQuery = await prisma.helpdeskUser.findMany();
    return getUserListQuery.map((user) => User.createFromType(user));
  };

  static getUserListAdjustedSuperior = async () => {
    const getUserListQuery = await prisma.$queryRaw`EXEC [dbo].[EF_GET_USER_TREE]` as HelpdeskUser[];
    return getUserListQuery.map((user) => User.createFromType(user));
  }

  // Method to get Departement Header account username (highest authorized user under GMG) of the user with username passed as parameter. 
  static getUserDeptHead = async (username: string) => {
    const result: any[] = await prisma.$queryRaw`SELECT [dbo].[EF_GET_DEPT_HEAD](${username}) DeptHead`;
    return result[0].DeptHead as string;
  }

  // Method to create new User data in database by using current User object instance.
  createUser = async () => {
    let salt = "";
    while (salt.length !== 10)
      salt = Math.random().toString(36).slice(2).substring(0, 10);
    return prisma.helpdeskUser.create({
      data: {
        Username: this.username,
        Pwd: createHash("sha256").update(salt.substring(0, 5) + "1234" + salt.substring(5)).digest(),
        Salt: salt,
        Lvl: this.lvl,
        IsActive: this.isActive ? "Y" : "N",
        Superior: this.superior
      }
    });
  };

  // Method to update existing User data in database by using current User object instance.
  updateUser = async () => {
    return prisma.helpdeskUser.update({
      where: { Username: this.username },
      data: {
        Lvl: this.lvl,
        IsActive: this.isActive ? "Y" : "N",
        Superior: this.superior
      }
    });
  };

  // Method to reset password of a User by passing username as parameter.
  static resetPassword = async (username: string) => {
    const salt = await prisma.helpdeskUser.findFirst({
      where: { Username: username },
      select: { Salt: true }
    });
    return prisma.helpdeskUser.update({
      where: { Username: username },
      data: { Pwd: createHash("sha256").update(salt?.Salt.substring(0, 5) + "1234" + salt?.Salt.substring(5)).digest() }
    });
  };

  // Method to change password of a User by passing the credentials needed as parameters.
  static changePassword = async (username: string, oldPassword: string, newPassword: string) => {
    await this.checkCredentials(username, oldPassword);
    const salt = await prisma.helpdeskUser.findFirst({
      where: { Username: username },
      select: { Salt: true }
    });
    return prisma.helpdeskUser.update({
      where: { Username: username },
      data: { Pwd: createHash("sha256").update(salt?.Salt.substring(0, 5) + newPassword + salt?.Salt.substring(5)).digest() }
    });
  };
};

export default User;
