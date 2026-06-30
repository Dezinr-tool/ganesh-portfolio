import { notFound } from "next/navigation";
import { getProjectById } from "@/lib/projects-store";
import { BackLink } from "../../../_components/back-link";
import { PageHeader } from "../../../_components/page-header";
import ProjectForm from "../../new/project-form";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({
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
    <div className="space-y-8">
      <BackLink
        href={`/dashboard/projects/${project.id}`}
        label="Back to project"
      />
      <PageHeader
        title={`Edit ${project.clientName}`}
        description="Update client details and notes."
      />
      <ProjectForm project={project} />
    </div>
  );
}
