#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createLogger } from './logger.js';
import { WorkflowStore } from './workflow-store.js';
import { SymphonyService } from './service.js';

function resolveWorkflowPath(rawPath: string | undefined): string {
  const requested = rawPath ?? './WORKFLOW.md';
  const direct = path.resolve(process.cwd(), requested);
  if (fs.existsSync(direct)) {
    return direct;
  }

  const parentFallback = path.resolve(process.cwd(), '..', requested);
  if (fs.existsSync(parentFallback)) {
    return parentFallback;
  }

  return direct;
}

async function main(): Promise<void> {
  const logger = createLogger();
  const workflowPath = resolveWorkflowPath(process.argv[2]);
  const store = new WorkflowStore(workflowPath, process.env, logger);
  store.load();

  const service = new SymphonyService(store, logger);
  process.on('SIGINT', () => service.stop());
  process.on('SIGTERM', () => service.stop());

  logger.info('service.starting', { workflowPath });
  await service.start();
  logger.info('service.stopped');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
