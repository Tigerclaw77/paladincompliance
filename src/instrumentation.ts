import {
  EnvironmentValidationError,
  isProductionRuntime,
  validateRuntimeEnvironment,
} from "@/lib/paladin/env";
import { logOperationalEvent } from "@/lib/paladin/logging";

export async function register() {
  try {
    const issues = validateRuntimeEnvironment({
      strict: isProductionRuntime(),
    });

    issues.forEach((issue) => {
      logOperationalEvent(issue.severity, "environment_validation_notice", {
        message: issue.message,
      });
    });

    logOperationalEvent("info", "environment_validation_complete", {
      production: isProductionRuntime(),
    });
  } catch (error) {
    if (error instanceof EnvironmentValidationError) {
      logOperationalEvent("error", "environment_validation_failed", {
        issues: error.issues.map((issue) => issue.message).join(" | "),
      });
    }

    throw error;
  }
}
