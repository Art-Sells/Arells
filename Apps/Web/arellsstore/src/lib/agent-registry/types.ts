export const AGENT_REGISTRY_SCHEMA = "arells/agent-registry/v1" as const;

/** Stored in S3 after Arells verifies an open agent’s published opt-in document. */
export type AgentRegistryRecord = {
  schema: typeof AGENT_REGISTRY_SCHEMA;
  origin: string;
  /** When Arells last verified this agent (automated ingest). */
  lastVerifiedAt: string;
  optedIn: boolean;
  signer?: `0x${string}`;
  agentLabel?: string;
  endUserId?: string;
  issuedAt?: string;
  narrative?: string;
  /** Signed optional lines (self-attested). */
  providerClaim?: string;
  productClaim?: string;
  wellKnownUrl?: string;
  httpStatus?: number;
  /** When verification failed or agent unreachable */
  error?: string;

  /**
   * Optional MCP surface metadata (from introspection jobs or operator attestation).
   * MCP remains transport — “agent” is a policy claim; use delegatesForUserClaim only when backed by attestations.
   */
  mcpUrl?: string;
  /** Heuristic or reviewed tier; not proof of behavior by itself. */
  mcpEndpointKind?:
    | "mcp_server"
    | "assistant_surface"
    | "user_delegated_agent_claim";
  capabilityTags?: string[];
  /** Explicit opt-in that this origin may act on behalf of end users (reviewed / signed). */
  delegatesForUserClaim?: boolean;
  lastMcpProfileAt?: string;
};
