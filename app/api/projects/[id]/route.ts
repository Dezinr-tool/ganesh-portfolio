import { NextResponse } from "next/server";
import type {
  CreateProjectInput,
  ProjectStatus,
} from "@/app/dashboard/_lib/projects";
import {
  buildProjectInput,
  PROJECT_STATUS_OPTIONS,
} from "@/app/dashboard/_lib/projects";
import {
  deleteProject,
  getProjectById,
  updateProject,
  updateProjectStatus,
} from "@/lib/projects-store";

function normalizeStatus(value: string | undefined): ProjectStatus | null {
  if (!value) return null;
  return (
    PROJECT_STATUS_OPTIONS.find((option) => option.value === value)?.value ??
    null
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const project = await getProjectById(id);

    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch {
    return NextResponse.json(
      { error: "Failed to load project." },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as CreateProjectInput;

    if (!body.clientName?.trim()) {
      return NextResponse.json(
        { error: "Client name is required." },
        { status: 400 },
      );
    }

    const input = buildProjectInput(body);
    const project = await updateProject(id, input);

    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch {
    return NextResponse.json(
      { error: "Failed to update project." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { status?: string };
    const status = normalizeStatus(body.status);

    if (!status) {
      return NextResponse.json(
        { error: "Invalid status." },
        { status: 400 },
      );
    }

    const project = await updateProjectStatus(id, status);

    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch {
    return NextResponse.json(
      { error: "Failed to update project status." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const deleted = await deleteProject(id);

    if (!deleted) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete project." },
      { status: 500 },
    );
  }
}
