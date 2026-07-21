import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '../../../lib/auth/session';
import {
  consumeAgentFreeCall,
  getAgentConnection,
  isOverFreeLimit,
} from '../../../lib/agent/agentConnection';
import { runAgentChatTurn } from '../../../lib/agent/agentChatEngine';
import { AGENT_SOFT_GATE_MESSAGE } from '../../../lib/assets/supportedAssetsCatalog';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSessionFromRequest(req);
  if (!session?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const message = typeof req.body?.message === 'string' ? req.body.message : '';

  try {
    let connection = await getAgentConnection(session.email);
    if (!connection.connected) {
      return res.status(400).json({ error: 'Connect agent first' });
    }

    if (isOverFreeLimit(connection)) {
      return res.status(200).json({
        reply: AGENT_SOFT_GATE_MESSAGE,
        action: { type: 'soft_gate' },
        matchedAsset: null,
        usedLlm: false,
        connection,
        softGated: true,
      });
    }

    // Consume a free call before generating the reply.
    connection = await consumeAgentFreeCall(session.email);
    const softGated = isOverFreeLimit(connection);

    const result = await runAgentChatTurn({
      message,
      overFreeLimit: false,
    });

    return res.status(200).json({
      ...result,
      connection,
      softGated,
    });
  } catch (e) {
    console.error('[api/agent/chat]', e);
    return res.status(500).json({ error: 'Agent chat failed' });
  }
}
