import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { app } from "..";
import { Trace } from "../utils/types";

let server: ReturnType<typeof app.listen>;
let baseUrl: string;

before(() => {
    server = app.listen(0);
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
});

after(() => {
    server.close();
});

test("status endpoint returns code", async () => {
    const res = await fetch(`${baseUrl}/status/418`);
    assert.equal(res.status, 418);
});

test("logs endpoint returns json", async () => {
    const res = await fetch(`${baseUrl}/logs`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.traces));
});
