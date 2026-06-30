import "server-only";

import type {
  CreateProjectInput,
  Project,
  ProjectStatus,
} from "@/app/dashboard/_lib/projects";
import { sql } from "@/lib/db";

type ProjectRow = {
  id: string;
  client_name: string;
  client_company: string;
  client_email: string;
  client_address: string;
  requirements: string;
  status: string;
  created_at: Date | string;
};

function toTimestamp(value: Date | string): string {
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
}

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    clientName: row.client_name,
    clientCompany: row.client_company,
    clientEmail: row.client_email,
    clientAddress: row.client_address,
    requirements: row.requirements,
    status: row.status as ProjectStatus,
    createdAt: toTimestamp(row.created_at),
  };
}

export async function readProjects(): Promise<Project[]> {
  const { rows } = await sql<ProjectRow>`
    SELECT
      id,
      client_name,
      client_company,
      client_email,
      client_address,
      requirements,
      status,
      created_at
    FROM projects
    ORDER BY created_at DESC
  `;
  return rows.map(rowToProject);
}

export async function getProjectById(id: string): Promise<Project | null> {
  const { rows } = await sql<ProjectRow>`
    SELECT
      id,
      client_name,
      client_company,
      client_email,
      client_address,
      requirements,
      status,
      created_at
    FROM projects
    WHERE id = ${id}
    LIMIT 1
  `;
  const row = rows[0];
  return row ? rowToProject(row) : null;
}

export async function createProject(
  input: CreateProjectInput,
): Promise<Project> {
  const id = crypto.randomUUID();
  const status: ProjectStatus = input.status ?? "lead";

  const { rows } = await sql<ProjectRow>`
    INSERT INTO projects (
      id,
      client_name,
      client_company,
      client_email,
      client_address,
      requirements,
      status
    ) VALUES (
      ${id},
      ${input.clientName},
      ${input.clientCompany ?? ""},
      ${input.clientEmail ?? ""},
      ${input.clientAddress ?? ""},
      ${input.requirements ?? ""},
      ${status}
    )
    RETURNING
      id,
      client_name,
      client_company,
      client_email,
      client_address,
      requirements,
      status,
      created_at
  `;

  const row = rows[0];
  if (!row) {
    throw new Error("Failed to create project.");
  }

  return rowToProject(row);
}

export async function updateProject(
  id: string,
  input: CreateProjectInput,
): Promise<Project | null> {
  const status = input.status ?? null;

  const { rows } = await sql<ProjectRow>`
    UPDATE projects
    SET
      client_name = ${input.clientName},
      client_company = ${input.clientCompany ?? ""},
      client_email = ${input.clientEmail ?? ""},
      client_address = ${input.clientAddress ?? ""},
      requirements = ${input.requirements ?? ""},
      status = COALESCE(${status}, status)
    WHERE id = ${id}
    RETURNING
      id,
      client_name,
      client_company,
      client_email,
      client_address,
      requirements,
      status,
      created_at
  `;

  const row = rows[0];
  return row ? rowToProject(row) : null;
}

export async function updateProjectStatus(
  id: string,
  status: ProjectStatus,
): Promise<Project | null> {
  const { rows } = await sql<ProjectRow>`
    UPDATE projects
    SET status = ${status}
    WHERE id = ${id}
    RETURNING
      id,
      client_name,
      client_company,
      client_email,
      client_address,
      requirements,
      status,
      created_at
  `;

  const row = rows[0];
  return row ? rowToProject(row) : null;
}

export async function deleteProject(id: string): Promise<boolean> {
  const { rows } = await sql<{ id: string }>`
    DELETE FROM projects
    WHERE id = ${id}
    RETURNING id
  `;

  return rows.length > 0;
}
