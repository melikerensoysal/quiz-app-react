import axios from "axios";

const apiClient = axios.create({
  baseURL: "https://opentdb.com",
});

export default apiClient;
