import { type LoaderFunctionArgs, type ActionFunctionArgs, json } from "@remix-run/node";

import { fetchCurrentUser } from "~/auth/repository";
import { canManageEvents } from "~/auth/helper";
import { fetchOne, updateOne } from "~/event/repository";

async function protectedLoader(args: LoaderFunctionArgs) {
  const res = await fetchCurrentUser(args.request);
  
  if (!canManageEvents(res.data)) {
    return json({ success: false, message: "Access denied", code: "404" }, { status: 404 });
  }

  const result = await fetchOne(args.request, Number(args.params.id));
  
  return json(result, { status: Number(result.code) });
}

async function protectedAction(args: ActionFunctionArgs) {
  const res = await fetchCurrentUser(args.request);
  
  if (!canManageEvents(res.data)) {
    return json({ success: false, message: "Access denied", code: "404" }, { status: 404 });
  }

  const eventId = Number(args.params.id!);
  const data = await args.request.json();
  
  const result = await updateOne(args.request, {
    id: eventId,
    urls: data.urls,
    description: data.description,
  });
  
  return json(result, { status: Number(result.code) });
}

export { protectedLoader as loader, protectedAction as action };
