import CaseWorkspaceClient from "@/components/case-workspace/CaseWorkspaceClient"

interface WorkspacePageProps {
  params: {
    caseId: string
  }
}

export default function WorkspacePage({ params }: WorkspacePageProps) {
  return <CaseWorkspaceClient caseId={params.caseId} basePath="/dashboard-client/cases" />
}
