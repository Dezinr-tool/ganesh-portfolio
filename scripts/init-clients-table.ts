import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import { sql } from "@vercel/postgres";

const CREATE_CLIENTS_TABLE = `
  CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    address TEXT,
    gst_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
  );
`;

async function initClientsTable() {
  console.log("Creating clients table if it doesn't exist…");
  await sql.query(CREATE_CLIENTS_TABLE);
  console.log("Done. clients table is ready.");
}

initClientsTable().catch((error) => {
  console.error("Failed to initialize clients table:", error);
  process.exit(1);
});
