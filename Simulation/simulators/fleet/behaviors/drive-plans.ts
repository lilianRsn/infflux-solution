import { ApiClient, ApiError } from "../../shared/api-client";
import { Logger } from "../../shared/logger";
import {
  DeliveryPlanSummary,
  generateDeliveryPlans,
  listDeliveryPlans,
  updateDeliveryPlanStatus
} from "../../shared/delivery-plans-api";

export interface InProgressTrack {
  plan_id: string;
  started_at_ms: number;
  completes_at_ms: number;
  planned_delivery_date: string;
  days_from_start: number;
}

export interface DrivePlansDeps {
  client: ApiClient;
  log: Logger;
  now: () => number;
  /** ms réels représentant 1 jour simulé. */
  minute_par_jour_ms: number;
}

export interface DrivePlansCycleResult {
  generated: number;
  started: number;
  completed: number;
  pending: number;
}

export function daysBetween(fromIsoDate: string, toIsoDate: string): number {
  const from = new Date(`${fromIsoDate}T00:00:00.000Z`).getTime();
  const to = new Date(`${toIsoDate}T00:00:00.000Z`).getTime();
  const diffMs = to - from;
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

export async function runDrivePlansCycle(
  deps: DrivePlansDeps,
  inflight: Map<string, InProgressTrack>
): Promise<DrivePlansCycleResult> {
  const { client, log, now, minute_par_jour_ms } = deps;
  const result: DrivePlansCycleResult = {
    generated: 0,
    started: 0,
    completed: 0,
    pending: 0
  };

  try {
    const gen = await generateDeliveryPlans(client);
    result.generated = gen.generated_count;
    log.info("generate_result", {
      generated: gen.generated_count,
      blocked: gen.blocked_count,
      partially_planned: gen.partially_planned_count
    });
  } catch (err) {
    log.error("generate_erreur", errorPayload(err));
  }

  let plans: DeliveryPlanSummary[] = [];
  try {
    plans = await listDeliveryPlans(client);
  } catch (err) {
    log.error("list_plans_erreur", errorPayload(err));
    return result;
  }

  const today = new Date().toISOString().split("T")[0];

  for (const plan of plans) {
    if (plan.status === "DRAFT" && !inflight.has(plan.id)) {
      const days = daysBetween(today, plan.planned_delivery_date);
      const startedAt = now();
      const completesAt = startedAt + days * minute_par_jour_ms;

      try {
        await updateDeliveryPlanStatus(client, plan.id, "IN_PROGRESS");
        inflight.set(plan.id, {
          plan_id: plan.id,
          started_at_ms: startedAt,
          completes_at_ms: completesAt,
          planned_delivery_date: plan.planned_delivery_date,
          days_from_start: days
        });
        result.started++;
        log.info("plan_started", {
          plan_id: plan.id,
          client_warehouse: plan.client_warehouse_name,
          trucks_count: Number(plan.trucks_count),
          planned_delivery_date: plan.planned_delivery_date,
          days_to_delivery: days,
          completes_in_ms: completesAt - startedAt
        });
      } catch (err) {
        log.error("plan_start_erreur", { plan_id: plan.id, ...errorPayload(err) });
      }
    }
  }

  for (const [planId, track] of inflight) {
    if (now() >= track.completes_at_ms) {
      try {
        await updateDeliveryPlanStatus(client, planId, "COMPLETED");
        inflight.delete(planId);
        result.completed++;
        log.info("plan_completed", {
          plan_id: planId,
          duration_ms: now() - track.started_at_ms,
          planned_delivery_date: track.planned_delivery_date
        });
      } catch (err) {
        log.error("plan_complete_erreur", { plan_id: planId, ...errorPayload(err) });
      }
    }
  }

  result.pending = inflight.size;
  return result;
}

function errorPayload(err: unknown): Record<string, unknown> {
  if (err instanceof ApiError) {
    return { status: err.status, body: err.body };
  }
  return { message: err instanceof Error ? err.message : String(err) };
}
