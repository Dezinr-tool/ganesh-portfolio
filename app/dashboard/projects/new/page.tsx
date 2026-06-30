import ProjectForm from "./project-form";
import { BackLink } from "../../_components/back-link";
import { PageHeader } from "../../_components/page-header";

export default function NewProjectPage() {
  return (
    <div className="space-y-8">
      <BackLink href="/dashboard/projects" label="Back to projects" />
      <PageHeader
        title="New project"
        description="Log a client reach-out — fill in what you know now, add more later."
      />
      <ProjectForm />
    </div>
  );
}
