const keys = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
  "R2_PUBLIC_URL",
];
for (const key of keys) {
  console.log(`${key}=${process.env[key] ? "set" : "missing"}`);
}
console.log(`R2_BUCKET_NAME=${process.env.R2_BUCKET || ""}`);
