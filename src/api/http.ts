import axios from 'axios'
import { getApiBaseUrl } from '../utils/env'

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 20000,
})

