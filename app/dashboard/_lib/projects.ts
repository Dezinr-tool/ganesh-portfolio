export type ProjectStatus = "lead" | "discussion" | "converted" | "lost";

export const PROJECT_STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "lead", label: "Lead" },
  { value: "discussion", label: "In discussion" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
];

export function projectStatusLabel(status: ProjectStatus): string {
  return (
    PROJECT_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    status
  );
}

export type Project = {
  id: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientAddress: string;
  requirements: string;
  status: ProjectStatus;
  createdAt: string;
};

export type CreateProjectInput = Omit<Project, "id" | "createdAt" | "status"> & {
  status?: ProjectStatus;
};

export function buildProjectInput(body: CreateProjectInput): CreateProjectInput {
  return {
    clientName: body.clientName.trim(),
    clientCompany: body.clientCompany?.trim() ?? "",
    clientEmail: body.clientEmail?.trim() ?? "",
    clientAddress: body.clientAddress?.trim() ?? "",
    requirements: body.requirements?.trim() ?? "",
    status: body.status,
  };
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}
