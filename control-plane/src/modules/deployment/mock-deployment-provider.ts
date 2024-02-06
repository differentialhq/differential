import { ZodSchema, z } from "zod";
import { Deployment } from "./deployment";
import { DeploymentProvider } from "./deployment-provider";

export class MockProvider implements DeploymentProvider {
  public name(): string {
    return "mock";
  }

  public schema(): ZodSchema<{}> {
    return z.object({});
  }

  public async create(deployment: Deployment): Promise<any> {
    console.log("Would create new deployment", deployment);
  }

  public async update(deployment: Deployment): Promise<any> {
    console.log("Would update existing deployment", deployment);
  }

  public async trigger(deployment: Deployment): Promise<any> {
    console.log("Would trigger deployment", deployment);
  }
}
