import "server-only";

import { sql } from "@vercel/postgres";
import { types } from "@neondatabase/serverless";

// Postgres DATE columns have no time/timezone component. Without this, the
// driver parses them into JS Date objects using the server's local
// timezone, which can shift the day by ±1 when read back (e.g. IST reads
// midnight UTC as the previous day). Returning the raw "YYYY-MM-DD" string
// avoids that ambiguity entirely.
types.setTypeParser(1082, (value: string) => value);

export { sql };
