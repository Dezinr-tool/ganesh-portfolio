import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { readProjects } from "@/lib/projects-store";
import { EmptyState } from "../_components/empty-state";
import { PageHeader } from "../_components/page-header";
import { formatDate, projectStatusLabel } from "../_lib/projects";
import type { ProjectStatus } from "../_lib/projects";
import { DeleteProjectButton } from "./delete-project-button";

export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: ProjectStatus }) {
  const variant =
    status === "converted"
      ? "default"
      : status === "lost"
        ? "destructive"
        : status === "discussion"
          ? "secondary"
          : "outline";
  return <Badge variant={variant}>{projectStatusLabel(status)}</Badge>;
}

export default async function ProjectsPage() {
  const projects = await readProjects();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Projects"
        description={
          projects.length === 0
            ? "No projects yet."
            : `${projects.length} project${projects.length === 1 ? "" : "s"}`
        }
        action={{ href: "/dashboard/projects/new", label: "New project" }}
      />

      {projects.length === 0 ? (
        <EmptyState
          title="No projects"
          description="Log every client reach-out here — even ones that don't convert. It builds your pipeline history and a repository of client requirements."
        />
      ) : (
        <>
          {/* Mobile card list */}
          <div className="flex flex-col divide-y divide-border rounded-xl border border-border sm:hidden">
            {projects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between gap-3 px-4 py-3.5"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="block truncate font-medium text-foreground hover:underline"
                  >
                    {project.clientName}
                  </Link>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {project.clientCompany || "—"} ·{" "}
                    {formatDate(project.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={project.status} />
                  <DeleteProjectButton
                    projectId={project.id}
                    clientName={project.clientName}
                    variant="icon"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden rounded-xl border border-border sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Logged</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/projects/${project.id}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {project.clientName}
                      </Link>
                    </TableCell>
                    <TableCell>{project.clientCompany || "—"}</TableCell>
                    <TableCell>{formatDate(project.createdAt)}</TableCell>
                    <TableCell>
                      <StatusBadge status={project.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <DeleteProjectButton
                        projectId={project.id}
                        clientName={project.clientName}
                        variant="icon"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
