import { withRole } from "../../_utils/auth";
import { jsonOk } from "@/lib/api/http";
import {
  dailySeedForDay,
  deterministicDailyTargets,
  utcDayStart,
  utcDayString,
} from "@/lib/api/targets";

export const runtime = "nodejs";

export const GET = withRole("admin", async () => {
  const dayStart = utcDayStart();
  const day = utcDayString(dayStart);
  const seed = dailySeedForDay(dayStart);
  const targets = deterministicDailyTargets(dayStart);

  return jsonOk({
    day,
    seed: seed.toString(),
    targets,
  });
});
