export const REDIS_CONFIG = {
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
};

export const BLOB_CONFIG = {
  token: process.env.BLOB_READ_WRITE_TOKEN || '',
};
