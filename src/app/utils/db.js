import { Pool } from "pg";

export const pool = new Pool({
  user: process.env.USER_NAME,
  host: process.env.HOST_NAME,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.PORT_NUMBER,
});

export default async function handlerQuery(query, values) {
  const client = await pool.connect();
  try {
    const hasil = await client.query(query, values);
    return hasil;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  } finally {
    client.release();
  }
}
