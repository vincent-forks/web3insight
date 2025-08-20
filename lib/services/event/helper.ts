import type { DataValue } from "@/types";

import { resolveDeveloperFromGithubUser } from "../developer/helper";

import type { GithubUser, EventReport } from "./typing";

function resolveEventDetail(raw: Record<string, DataValue>): EventReport {
  const ghUserMap: Record<string, GithubUser> = ((raw.github?.users || []) as GithubUser[]).reduce((acc, u) => ({
    ...acc,
    [u.id]: u,
  }), {});

  const contestants = ((raw.data?.users || []) as Record<string, DataValue>[]).map(u => {
    const analytics = u.ecosystem_scores
      .filter((eco: Record<string, DataValue>) => eco.ecosystem !== "ALL")
      .map((eco: Record<string, DataValue>) => {
        const repos = (eco.repos as Record<string, DataValue>[]).map((repo: Record<string, DataValue>) => {
          // Handle new API format: { repo_name: "owner/repo", score: 123, ... }
          if (repo.repo_name && repo.score !== undefined) {
            return {
              fullName: String(repo.repo_name),
              score: String(repo.score),
            };
          }

          // Fallback for old format or unexpected structures
          const entries = Object.entries(repo);
          if (entries.length === 0) {
            return { fullName: "unknown", score: "0" };
          }

          const [fullName, score] = entries[0];
          return { fullName, score };
        });

        return {
          name: eco.ecosystem,
          score: eco.total_score,
          repos,
        };
      });

    return {
      ...resolveDeveloperFromGithubUser(ghUserMap[u.actor_id]),
      analytics,
    };
  });

  // Try to find request_data in different possible locations
  let requestData: string[] | undefined;
  
  if (raw.request_data && Array.isArray(raw.request_data)) {
    requestData = raw.request_data as string[];
  } else if (raw.data?.request_data && Array.isArray(raw.data.request_data)) {
    requestData = raw.data.request_data as string[];
  } else if (raw.urls && Array.isArray(raw.urls)) {
    requestData = raw.urls as string[];
  }

  return {
    id: raw.id,
    type: raw.intent,
    description: raw.description,
    contestants,
    request_data: requestData,
  };
}

export { resolveEventDetail };
