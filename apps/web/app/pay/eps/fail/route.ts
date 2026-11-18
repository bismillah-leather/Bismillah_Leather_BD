import { finishEps } from "../finish";

export const dynamic = "force-dynamic";

export function POST(request: Request) {
  return finishEps(request, "fail");
}

export function GET(request: Request) {
  return finishEps(request, "fail");
}
