import api from "../../api";

class User {
  username: string;
  lvl: string;
  isActive: boolean; 
  superior: string;
  inferior: string[];

  // Constructor for User Class
  constructor(username: string = "", lvl: string = "", isActive: boolean = false, superior: string = "", inferior: string[] = []) {
    this.username = username;
    this.lvl = lvl;
    this.isActive = isActive;
    this.superior = superior;
    this.inferior = inferior;
  };

  // Method to get list of User data from backend, with optional parameter "allActive" to filter the result from backend, 
  // whether includes all inactive user, or only returns active User(s).
  static getUserList = async (allActive: boolean = false) => {
    const userListData = await api.apiInstance.get("/users");
    if (allActive) {
      const userList = userListData.data as User[];
      return userList.filter(user => user.isActive);
    }
    return userListData.data;
  };

  static getUserListAdjustedSuperior = async () => {
    const userListData = await api.apiInstance.get("/users/adjusted-superior");
    return userListData.data;
  };

  // Method to get username of the user which is the head of the account's division or department
  // which username is passed on the parameter.
  static getUserDeptHead = async (username: string) => (await api.apiInstance.get(`/users/${username}/dept-head`)).data.user as string;

  // Method to send POST request to backend to create a new User record in database. 
  createUserData = async () => api.apiInstance.post("/users", { data: this });

  // Method to send PUT request to backend to update an existing User record in database. 
  updateUserData = async () => api.apiInstance.put(`/users/${this.username}`, { data: this });

  static changePassword = async (username: string, oldPassword: string, newPassword: string) => api.apiInstance.put(`/users/${username}/change-password`, { data: { oldPassword, newPassword } });

  static resetPassword = async (username: string) => api.apiInstance.put(`/users/${username}/reset-password`);
}

export default User;
