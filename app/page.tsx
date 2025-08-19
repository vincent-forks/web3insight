import { redirect } from 'next/navigation';
import { getMetadata } from "@/utils/app";
import { fetchStatisticsOverview, fetchStatisticsRank } from "~/statistics/repository";
import { getUser } from "~/auth/repository";
import { headers } from 'next/headers';
import EcosystemRankViewWidget from "~/ecosystem/views/ecosystem-rank";
import RepositoryRankViewWidget from "~/repository/views/repository-rank";
import DeveloperRankViewWidget from "~/developer/views/developer-rank";
import Section from "$/section";
import DefaultLayoutWrapper from "./DefaultLayoutWrapper";
import HomePageClient from "./HomePageClient";

const { title, tagline, description } = getMetadata();

export const metadata = {
  title: `${title} - ${tagline}`,
  openGraph: {
    title: `${title} - ${tagline}`,
  },
  description,
};

interface HomePageProps {
  searchParams: Promise<{
    error?: string;
    code?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams;
  const { code } = resolvedSearchParams;

  // If this is a GitHub OAuth callback, redirect to the proper handler
  if (code) {
    redirect(`/connect/github/redirect?code=${code}`);
  }

  // Get current user from session
  const headersList = await headers();
  const request = new Request('http://localhost', {
    headers: headersList,
  });
  const user = await getUser(request);

  try {
    const [statisticsResult, rankResult] = await Promise.all([
      fetchStatisticsOverview(),
      fetchStatisticsRank(),
    ]);

    // Use fallback data if statistics fetch failed
    // Client component will handle data fetching via API
    // const statisticOverview = statisticsResult.success ? statisticsResult.data : {
    //   ecosystem: 0,
    //   repository: 0,
    //   developer: 0,
    //   coreDeveloper: 0,
    // };

    // Use fallback data if rank fetch failed
    const statisticRank = rankResult.success ? rankResult.data : {
      ecosystem: [],
      repository: [],
      developer: [],
    };

    // Log any failures for debugging
    if (!statisticsResult.success) {
      console.warn("Statistics overview fetch failed:", statisticsResult.message);
    }
    if (!rankResult.success) {
      console.warn("Statistics rank fetch failed:", rankResult.message);
    }

    return (
      <DefaultLayoutWrapper user={user}>
        <div className="min-h-dvh flex flex-col">
          <div className="w-full max-w-content mx-auto px-6 py-8">
            {/* AI Query Section - Client Component */}
            <HomePageClient />

            {/* Server-rendered content */}
            <div className="w-full max-w-content mx-auto px-6 pb-12">
              <Section
                className="mt-12"
                title="Web3 Ecosystem Analytics"
                summary="Comprehensive insights about major blockchain ecosystems"
              >
                <EcosystemRankViewWidget dataSource={statisticRank.ecosystem} />
              </Section>
              <Section
                className="mt-16"
                title="Repository Activity"
                summary="Top repositories by developer engagement and contributions"
              >
                <RepositoryRankViewWidget dataSource={statisticRank.repository} />
              </Section>
              <Section
                className="mt-16"
                title="Top Developer Activity"
                summary="Leading contributors across Web3 ecosystems"
              >
                <DeveloperRankViewWidget dataSource={statisticRank.developer} view="grid" />
              </Section>

              {/* Footer */}
              <footer className="mt-16 pt-8 border-t border-border dark:border-border-dark">
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Supported by{" "}
                    <a href="https://openbuild.xyz/" className="text-foreground dark:text-foreground font-medium hover:text-primary transition-colors">
                      OpenBuild
                    </a>{" "}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-600">© {new Date().getFullYear()} {title}. All rights reserved.</p>
                </div>
              </footer>
            </div>
          </div>
        </div>
      </DefaultLayoutWrapper>
    );
  } catch (error) {
    // Extra safety net - if something else goes wrong, provide fallback data
    console.error("Loader error in home route:", error);

    // Client component will handle fallback data
    // const fallbackStatisticOverview = {
    //   ecosystem: 0,
    //   repository: 0,
    //   developer: 0,
    //   coreDeveloper: 0,
    // };

    const fallbackStatisticRank = {
      ecosystem: [],
      repository: [],
      developer: [],
    };

    return (
      <DefaultLayoutWrapper user={user}>
        <div className="min-h-dvh flex flex-col">
          <div className="w-full max-w-content mx-auto px-6 py-8">
            <HomePageClient />

            <div className="w-full max-w-content mx-auto px-6 pb-12">
              <Section
                className="mt-12"
                title="Web3 Ecosystem Analytics"
                summary="Comprehensive insights about major blockchain ecosystems"
              >
                <EcosystemRankViewWidget dataSource={fallbackStatisticRank.ecosystem} />
              </Section>
              <Section
                className="mt-16"
                title="Repository Activity"
                summary="Top repositories by developer engagement and contributions"
              >
                <RepositoryRankViewWidget dataSource={fallbackStatisticRank.repository} />
              </Section>
              <Section
                className="mt-16"
                title="Top Developer Activity"
                summary="Leading contributors across Web3 ecosystems"
              >
                <DeveloperRankViewWidget dataSource={fallbackStatisticRank.developer} view="grid" />
              </Section>
            </div>
          </div>
        </div>
      </DefaultLayoutWrapper>
    );
  }
}
