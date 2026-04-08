import 'dotenv/config'

export const PORT = process.env.PORT || 3001
export const NODE_ENV = process.env.NODE_ENV || 'development'
export const GCP_PROJECT = process.env.GCP_PROJECT || null
export const GCP_REGION = process.env.GCP_REGION || 'us-central1'
export const VERTEX_SERVICE_ACCOUNT_KEY = process.env.VERTEX_SERVICE_ACCOUNT_KEY || null
export const AISHUB_USERNAME = process.env.AISHUB_USERNAME || null
