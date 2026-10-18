import PlanStartForm from "@/components/start/PlanStartForm";
import { saveOperationalIntent } from "@/app/start/actions";
import { getStartFlowContext } from "@/lib/paladin/startFlow";

type StartOperationalPageProps = {
  searchParams: Promise<{
    employees?: string;
    error?: string;
  }>;
};

export default async function StartOperationalPage({
  searchParams,
}: StartOperationalPageProps) {
  const { organization, user } = await getStartFlowContext("/start/operational");
  const params = await searchParams;

  return (
    <PlanStartForm
      action={saveOperationalIntent}
      contactEmail={user.email}
      errorMessage={getErrorMessage(params.error)}
      initialEmployeeCount={parseEmployees(params.employees)}
      organizationName={organization.name}
      plan="operational"
      savedIntent={organization.acquisitionIntent}
    />
  );
}

function getErrorMessage(error: string | undefined) {
  if (error === "industry") {
    return "Select a valid industry or leave it blank.";
  }

  return "";
}

function parseEmployees(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "", 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
