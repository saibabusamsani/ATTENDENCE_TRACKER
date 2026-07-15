import axiosInstance from "./AxiosInstance";

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.log('Error : ', error?.response);

    return Promise.reject(error);
  },
);


export default axiosInstance;