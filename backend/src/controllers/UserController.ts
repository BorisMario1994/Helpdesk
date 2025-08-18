import AppError from "../models/AppError";
import User from "../models/master/User";

export default {
  // Function to get list of User data from database, called using the static method provided from the User class
  getUserList: async () => {
    return User.getUserList();
  },

  getUserListAdjustedSuperior: async () => {
    return User.getUserListAdjustedSuperior();
  },

  // Function to get name of division / department head account's username, called using the static method provided from User class
  getUserDeptHead: async (username: string) => {
    return User.getUserDeptHead(username);
  },

  getUserSupHead: async (username: string) => {
    return User.getUserSupHead(username);
  },

  // Function to create User data by checking the availability of "username" provided by requester before inserting it.
  // Insert method is available for objects of User class. If the "username" exists, then it will create a custom error
  // and throw it to router to send error code response to client. Other error will be threw directly to router.
  createUser: async (data: User) => {
    if (await User.checkUsernameAvailability(data.username)) {
      const userData = new User(data.username, data.lvl, data.isActive, data.superior, []);
      return userData.createUser();
    } else {
      throw new AppError(new Error(), "RecordExists", "Code has been used");
    }
  },

  // Function to update User data by creating the User object and call its corresponding method to update data. 
  updateUser: async (username: string, data: User) => {
    const userData = new User(username, data.lvl, data.isActive, data.superior, []);
    return userData.updateUser();
  },

  // Function to reset password of user registered in database with default password. 
  resetPassword: async (username: string) => {
    return User.resetPassword(username);
  },

  // Function to change password of user registered in database by providing username, current password, and new password. 
  changePassword: async (username: string, oldPassword: string, newPassword: string) => {
    return User.changePassword(username, oldPassword, newPassword);
  }
};
