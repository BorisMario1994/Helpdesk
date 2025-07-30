import axios from "axios";

let accessToken: string | null;

const getAccessToken = () => {
  return accessToken;
};

const setAccessToken = (token: string) => {
  accessToken = token;
};

const apiInstance = axios.create({
  baseURL: "/api-hock-helpdesk",
  withCredentials: true
});

apiInstance.interceptors.request.use(
  config => {
    config.headers.Authorization = `Bearer ${getAccessToken()}`;
    return config;
  },
  error => Promise.reject(error)
);

const refreshToken = async (username: string) => {
  const newAccessToken = (await apiInstance.post("/auth/refresh", { username: username })).data as string;
  setAccessToken(newAccessToken);
  return newAccessToken;
};

export default { apiInstance, refreshToken, setAccessToken};
