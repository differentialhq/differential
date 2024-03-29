import { ZodSchema, z } from "zod";
import { Deployment } from "./deployment";
import { DeploymentProvider } from "./deployment-provider";
import { logger } from "../../utilities/logger";

export class MockProvider implements DeploymentProvider {
  public name(): string {
    return "mock";
  }

  public schema(): ZodSchema<{}> {
    return z.object({});
  }

  public minimumNotificationInterval(): number {
    return 10000;
  }

  public async create(deployment: Deployment): Promise<any> {
    logger.info("Would create new deployment", {
      deployment,
    });
  }

  public async update(deployment: Deployment): Promise<any> {
    logger.info("Would update existing deployment", {
      deployment,
    });
  }

  public async notify(
    deployment: Deployment,
    pendingJobs: number,
    runningMachines: number,
  ): Promise<any> {
    logger.info("Would notify provider of new jobs", {
      deployment,
      pendingJobs,
      runningMachines,
    });
  }

  public async getLogs(): Promise<{ message: string }[]> {
    return [{ message: "Test log" }];
  }
}
