/** BullMQ queue names. One queue per kind of slow work — never inside an HTTP request. */
export const QUEUES = {
  image: "image",
  video: "video",
  notify: "notify",
  courier: "courier",
  capi: "capi",
  payments: "payments",
  jobs: "jobs",
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

export const QUEUE_NAMES = Object.values(QUEUES);
