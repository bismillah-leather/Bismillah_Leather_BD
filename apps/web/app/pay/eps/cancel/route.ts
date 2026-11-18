import { finishEps } from "../finish";

export const dynamic = "force-dynamic";

export function POST(request: Request) {
  return finishEps(request, "cancel");
}

export function GET(request: Request) {
  return finishEps(request, "cancel");
}
