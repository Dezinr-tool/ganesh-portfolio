import { NextResponse } from "next/server";
import type { CreateProjectInput } from "@/app/dashboard/_lib/projects";
import { buildProjectInput } from "@/app/dashboard/_lib/projects";
import { createProject, readProjects } from "@/lib/projects-store";

export async function GET() {
  try {
    const projects = await readProjects();
    return NextResponse.json({ projects });
  } catch {
    return NextResponse.json(
      { error: "Failed to load projects." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateProjectInput;

    if (!body.clientName?.trim()) {
      return NextResponse.json(
        { error: "Client name is required." },
        { status: 400 },
      );
    }

    const input = buildProjectInput(body);
    const project = await createProject(input);

    return NextResponse.json(project, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create project." },
      { status: 500 },
    );
  }
}
