import assert from "node:assert/strict";
import test from "node:test";
import {
  assertSafeUrl,
  blockedAddressReason,
  parseTargetUrl,
  UnsafeUrlError,
} from "./ssrf.ts";

test("blocks loopback, private, and metadata IPv4 addresses", () => {
  const blocked = [
    "127.0.0.1",
    "10.1.2.3",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.10",
    "169.254.169.254",
    "100.64.0.1",
    "0.0.0.0",
    "255.255.255.255",
    "224.0.0.1",
  ];
  for (const address of blocked) {
    assert.ok(
      blockedAddressReason(address),
      `${address} should be blocked but was allowed`,
    );
  }
});

test("allows publicly routable IPv4 addresses", () => {
  for (const address of ["8.8.8.8", "1.1.1.1", "93.184.216.34", "172.32.0.1"]) {
    assert.equal(
      blockedAddressReason(address),
      null,
      `${address} should be allowed`,
    );
  }
});

test("blocks loopback, unique-local, and link-local IPv6 addresses", () => {
  const blocked = [
    "::1",
    "::",
    "fc00::1",
    "fd12:3456::1",
    "fe80::1",
    "ff02::1",
    "64:ff9b::8.8.8.8",
    "::ffff:127.0.0.1",
    "::ffff:169.254.169.254",
  ];
  for (const address of blocked) {
    assert.ok(
      blockedAddressReason(address),
      `${address} should be blocked but was allowed`,
    );
  }
});

test("allows publicly routable IPv6 addresses", () => {
  for (const address of ["2606:4700:4700::1111", "2001:4860:4860::8888"]) {
    assert.equal(
      blockedAddressReason(address),
      null,
      `${address} should be allowed`,
    );
  }
  assert.equal(blockedAddressReason("::ffff:8.8.8.8"), null);
});

test("rejects unsupported schemes, embedded credentials, and malformed URLs", () => {
  assert.throws(() => parseTargetUrl("file:///etc/passwd"), UnsafeUrlError);
  assert.throws(() => parseTargetUrl("ftp://example.com/data"), UnsafeUrlError);
  assert.throws(() => parseTargetUrl("not a url"), UnsafeUrlError);
  assert.throws(
    () => parseTargetUrl("https://user:secret@example.com/data"),
    UnsafeUrlError,
  );
  assert.equal(parseTargetUrl("https://example.com/data").host, "example.com");
});

test("rejects literal private hosts without touching DNS", async () => {
  await assert.rejects(
    () => assertSafeUrl("http://127.0.0.1:3000/internal"),
    UnsafeUrlError,
  );
  await assert.rejects(
    () => assertSafeUrl("http://[::1]:3000/internal"),
    UnsafeUrlError,
  );
  await assert.rejects(
    () => assertSafeUrl("http://169.254.169.254/latest/meta-data"),
    UnsafeUrlError,
  );
});

test("honours the host allowlist so bundled demo endpoints stay reachable", async () => {
  const result = await assertSafeUrl("http://localhost:3000/api/demo/orders", {
    allowedHosts: ["localhost:3000"],
  });
  assert.equal(result.url.pathname, "/api/demo/orders");

  await assert.rejects(
    () =>
      assertSafeUrl("http://localhost:9999/api/demo/orders", {
        allowedHosts: ["localhost:3000"],
      }),
    UnsafeUrlError,
  );
});
