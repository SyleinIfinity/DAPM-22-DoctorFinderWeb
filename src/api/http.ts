import axios from "axios";
import { getApiBaseUrl, getApiPassword, getApiUsername } from "../utils/env";

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  auth: {
    username: getApiUsername(),
    password: getApiPassword(),
  },
  timeout: 20000,
});
