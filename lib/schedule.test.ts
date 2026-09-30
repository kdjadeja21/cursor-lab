import assert from "node:assert/strict";
import test from "node:test";
import { isDue, MIN_RETRY_MS, nextDueAt } from "./schedule.ts";

const NOW = Date.parse("2026-09-28T12:00:00.000Z");

function entry(overrides: { agoMs: number; failureCount?: number }) {
  return {
    lastAttemptAt: new Date(NOW - overrides.agoMs).toISOString(),
    failureCount: overrides.failureCount ?? 0,
  };
}

test("manual connections are never due on their own", () => {
  const manual = { refreshSeconds: null };
  assert.equal(nextDueAt(manual, undefined), Number.POSITIVE_INFINITY);
  assert.equal(isDue(manual, entry({ agoMs: 10 * 86_400_000 }), NOW), false);
});

test("a connection that has never run is due immediately", () => {
  assert.equal(nextDueAt({ refreshSeconds: 300 }, undefined), 0);
  assert.ok(isDue({ refreshSeconds: 300 }, undefined, NOW));
});

test("a healthy connection waits exactly one interval", () => {
  const connection = { refreshSeconds: 300 };
  assert.equal(isDue(connection, entry({ agoMs: 299_000 }), NOW), false);
  assert.equal(isDue(connection, entry({ agoMs: 300_000 }), NOW), true);
});

test("failures back off exponentially and stop doubling at the cap", () => {
  const connection = { refreshSeconds: 600 };
  const delayFor = (failureCount: number) =>
    nextDueAt(connection, entry({ agoMs: 0, failureCount })) - NOW;

  assert.equal(delayFor(0), 600_000);
  assert.equal(delayFor(1), 1_200_000);
  assert.equal(delayFor(2), 2_400_000);
  assert.equal(delayFor(3), 4_800_000);
  assert.equal(delayFor(6), 4_800_000, "multiplier is capped at 8x");
});

test("a very short interval still waits the retry floor after a failure", () => {
  const backedOff =
    nextDueAt({ refreshSeconds: 10 }, entry({ agoMs: 0, failureCount: 1 })) - NOW;
  assert.equal(backedOff, MIN_RETRY_MS, "20s doubled interval is raised to the floor");

  const healthy =
    nextDueAt({ refreshSeconds: 10 }, entry({ agoMs: 0, failureCount: 0 })) - NOW;
  assert.equal(healthy, 10_000, "the floor only applies after a failure");
});

test("an unparseable timestamp is treated as due rather than stalling forever", () => {
  assert.equal(
    nextDueAt({ refreshSeconds: 300 }, { lastAttemptAt: "nonsense", failureCount: 0 }),
    0,
  );
});
