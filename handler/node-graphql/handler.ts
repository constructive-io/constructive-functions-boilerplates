import type { FunctionHandler } from '@constructive-functions/runtime';

/**
 * ____name____ function handler.
 *
 * The handler receives:
 *   - params: the job payload (JSON from the caller)
 *   - context: { client, meta, agent, log, env, job }
 *     - client/meta: GraphQL clients (tenant-scoped)
 *     - agent: AgentContext for LLM inference
 *       - agent.inference({ messages, model?, temperature? })
 *       - agent.embed(input, model?)
 *     - log: structured logger
 *     - env: process.env
 *     - job: { jobId, workerId, databaseId, actorId }
 */
const handler: FunctionHandler = async (params: any, context) => {
  const { log } = context;

  log.info('____name____ received payload', { params });

  return {
    status: 'ok',
    received: params,
    timestamp: new Date().toISOString()
  };
};

export default handler;
