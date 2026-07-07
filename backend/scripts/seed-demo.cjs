#!/usr/bin/env node
const baseUrl = process.env.API_URL ?? "http://localhost:3001";
const token = process.env.DEMO_RESET_TOKEN;

const headers = { "Content-Type": "application/json" };
if (token) {
  headers["X-Demo-Reset-Token"] = token;
}

async function main() {
  const res = await fetch(`${baseUrl}/demo/reset`, {
    method: "POST",
    headers,
  });

  const body = await res.text();
  if (!res.ok) {
    console.error(`Demo reset failed (${res.status}): ${body}`);
    process.exit(1);
  }

  console.log(body);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
