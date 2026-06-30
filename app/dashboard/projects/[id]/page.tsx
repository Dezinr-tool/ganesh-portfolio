import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { getProjectById } from "@/lib/projects-store";
import { formatDate } from "@/app/dashboard/_lib/projects";
import { BackLink } from "../../_components/back-link";
import { DeleteProjectButton } from "../delete-project-button";
import { ProjectStatusSelect } from "../project-status-select";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProjectById(id);

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <BackLink href="/dashboard/projects" label="Back to projects" />
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/dashboard/projects/${project.id}/edit`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Edit
          </Link>
          <ProjectStatusSelect projectId={project.id} status={project.status} />
          <DeleteProjectButton
            projectId={project.id}
            clientName={project.clientName}
            redirectTo="/dashboard/projects"
          />
        </div>
      </div>

      <Card>
        <CardContent className="space-y-8 pt-6">
          <div className="grid gap-8 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Client
              </p>
              <p className="text-lg font-medium">{project.clientName}</p>
              {project.clientCompany ? (
                <p className="text-sm text-muted-foreground">
                  {project.clientCompany}
                </p>
              ) : null}
              {project.clientEmail ? (
                <p className="text-sm">{project.clientEmail}</p>
              ) : null}
              {project.clientAddress ? (
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {project.clientAddress}
                </p>
              ) : null}
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                First logged
              </p>
              <p className="mt-2 text-sm">{formatDate(project.createdAt)}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Requirements &amp; notes
            </p>
            {project.requirements ? (
              <p className="whitespace-pre-wrap text-sm">
                {project.requirements}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nothing added yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
