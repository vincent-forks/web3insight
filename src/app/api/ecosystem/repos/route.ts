import { NextResponse } from 'next/server';

import { fetchCurrentUser } from '~/auth/repository';
import { canManageEcosystems } from '~/auth/helper';
import { fetchManageableRepositoryList } from '~/ecosystem/repository';

export async function GET(request: Request) {
  try {
    const res = await fetchCurrentUser(request);

    if (!canManageEcosystems(res.data)) {
      return NextResponse.json(
        { success: false, message: "Access denied", code: "404" },
        { status: 404 },
      );
    }

    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const result = await fetchManageableRepositoryList(params as Record<string, unknown>);

    return NextResponse.json(result, { status: Number(result.code) });
  } catch (error) {
    console.error('Error in ecosystem repos GET:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error", code: "500" },
      { status: 500 },
    );
  }
}
