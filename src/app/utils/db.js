import { Pool } from "pg";

export const pool = new Pool({
  user: process.env.USER_NAME as string,
  host: process.env.HOST_NAME as string,
  database: process.env.DB_NAME as string,
  password: process.env.DB_PASSWORD as string,
  port: Number(process.env.PORT_NUMBER),
});

export default async function handlerQuery(
  query: string,
  values?: any[]
): Promise<any> {
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
