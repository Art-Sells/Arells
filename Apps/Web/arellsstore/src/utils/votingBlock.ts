import AWS from 'aws-sdk';

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME!;
const VOTING_KEY = 'arellsusers/votingblock/VotingBlock.json';

export type VotingBlockData = {
  expiresAt: number;
  votes: {
    solana: number;
    xrp: number;
  };
  sessions: string[];
  updatedAt: number;
};

const buildDefaultVotingBlock = (): VotingBlockData => {
  const now = Date.now();
  return {
    expiresAt: now + 30 * 1000,
    votes: {
      solana: 0,
      xrp: 0,
    },
    sessions: [],
    updatedAt: now,
  };
};

const normalizeVotingBlock = (data: any): VotingBlockData => {
  const base = buildDefaultVotingBlock();
  return {
    expiresAt: typeof data?.expiresAt === 'number' ? data.expiresAt : base.expiresAt,
    votes: {
      solana: typeof data?.votes?.solana === 'number' ? data.votes.solana : base.votes.solana,
      xrp: typeof data?.votes?.xrp === 'number' ? data.votes.xrp : base.votes.xrp,
    },
    sessions: Array.isArray(data?.sessions) ? data.sessions.filter((s: any) => typeof s === 'string') : base.sessions,
    updatedAt: typeof data?.updatedAt === 'number' ? data.updatedAt : base.updatedAt,
  };
};

export const fetchVotingBlock = async (): Promise<VotingBlockData> => {
  try {
    const response = await s3.getObject({ Bucket: BUCKET_NAME, Key: VOTING_KEY }).promise();
    if (response.Body) {
      const parsed = JSON.parse(response.Body.toString());
      return normalizeVotingBlock(parsed);
    }
  } catch (error: any) {
    if (error.code !== 'NoSuchKey') {
      console.error('[voting] fetch error', error);
    }
  }
  const fallback = buildDefaultVotingBlock();
  await saveVotingBlock(fallback);
  return fallback;
};

export const saveVotingBlock = async (data: VotingBlockData): Promise<void> => {
  await s3
    .putObject({
      Bucket: BUCKET_NAME,
      Key: VOTING_KEY,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
    })
    .promise();
};
