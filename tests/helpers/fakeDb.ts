/**
 * Supabase 쿼리 빌더 흉내. 테이블별 행 배열을 주면 select/eq/in/is/ilike/order/limit/maybeSingle/single 과
 * insert/update/upsert/delete 를 처리하고, 쓰기 호출은 calls 에 기록한다. 테스트 전용.
 */
type Row = Record<string, unknown>;
export type Call = { table: string; op: "insert" | "update" | "upsert" | "delete"; payload: unknown; filters: [string, string, unknown][] };

export function fakeDb(seed: Record<string, Row[]> = {}) {
  const tables: Record<string, Row[]> = Object.fromEntries(Object.entries(seed).map(([k, v]) => [k, v.map((r) => ({ ...r }))]));
  const calls: Call[] = [];
  const rpc = { handlers: {} as Record<string, (args: Record<string, unknown>) => { data?: unknown; error?: { message: string } | null }> };

  function from(table: string) {
    const rows = () => (tables[table] ??= []);
    const filters: [string, string, unknown][] = [];
    let pending: Call | null = null;
    let single: "maybe" | "single" | null = null;
    let limitN: number | null = null;
    let countMode = false;

    const apply = (rs: Row[]) =>
      rs.filter((r) =>
        filters.every(([op, col, v]) => {
          const x = r[col];
          if (op === "eq") return x === v;
          if (op === "neq") return x !== v;
          if (op === "in") return (v as unknown[]).includes(x);
          if (op === "is") return x === v || (v === null && x === undefined);
          if (op === "ilike") return String(x ?? "").toLowerCase() === String(v).toLowerCase();
          if (op === "gte") return (x as number) >= (v as number);
          return true;
        }),
      );

    const exec = () => {
      if (pending) {
        const matched = apply(rows());
        if (pending.op === "insert") {
          const items = Array.isArray(pending.payload) ? (pending.payload as Row[]) : [pending.payload as Row];
          const inserted = items.map((it) => ({ id: it.id ?? `id-${rows().length + 1}`, ...it }));
          rows().push(...inserted);
          return { data: single ? inserted[0] : inserted, error: null, count: null };
        }
        if (pending.op === "upsert") {
          const it = pending.payload as Row;
          const key = Object.keys(it).find((k) => k.endsWith("_key")) ?? "id";
          const idx = rows().findIndex((r) => r[key] === it[key]);
          if (idx >= 0) rows()[idx] = { ...rows()[idx], ...it };
          else rows().push({ id: it.id ?? `id-${rows().length + 1}`, ...it });
          return { data: null, error: null, count: null };
        }
        if (pending.op === "update") {
          for (const r of matched) Object.assign(r, pending.payload as Row);
          return { data: single ? matched[0] ?? null : matched, error: null, count: matched.length };
        }
        if (pending.op === "delete") {
          tables[table] = rows().filter((r) => !matched.includes(r));
          return { data: null, error: null, count: matched.length };
        }
      }
      let out = apply(rows());
      if (limitN != null) out = out.slice(0, limitN);
      if (countMode) return { data: null, error: null, count: out.length };
      if (single === "maybe") return { data: out[0] ?? null, error: null };
      if (single === "single") return out[0] ? { data: out[0], error: null } : { data: null, error: { message: "no rows" } };
      return { data: out, error: null, count: out.length };
    };

    const b: Record<string, unknown> = {};
    const chain = (fn: (...x: unknown[]) => void) => (...a: unknown[]) => { fn(...a); return b; };
    Object.assign(b, {
      select: (_cols?: string, opts?: { count?: string; head?: boolean }) => { if (opts?.head) countMode = true; return b; },
      eq: chain((col: unknown, v: unknown) => { filters.push(["eq", col as string, v]); }),
      neq: chain((col: unknown, v: unknown) => { filters.push(["neq", col as string, v]); }),
      in: chain((col: unknown, v: unknown) => { filters.push(["in", col as string, v]); }),
      is: chain((col: unknown, v: unknown) => { filters.push(["is", col as string, v]); }),
      ilike: chain((col: unknown, v: unknown) => { filters.push(["ilike", col as string, v]); }),
      gte: chain((col: unknown, v: unknown) => { filters.push(["gte", col as string, v]); }),
      order: chain(() => {}),
      limit: chain((n: unknown) => { limitN = n as number; }),
      range: chain(() => {}),
      maybeSingle: () => { single = "maybe"; return Promise.resolve(exec()); },
      single: () => { single = "single"; return Promise.resolve(exec()); },
      insert: (payload: unknown) => { pending = { table, op: "insert", payload, filters }; calls.push(pending); return b; },
      update: (payload: unknown) => { pending = { table, op: "update", payload, filters }; calls.push(pending); return b; },
      upsert: (payload: unknown) => { pending = { table, op: "upsert", payload, filters }; calls.push(pending); return b; },
      delete: () => { pending = { table, op: "delete", payload: null, filters }; calls.push(pending); return b; },
      then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => Promise.resolve(exec()).then(res, rej),
    });
    return b;
  }

  const client = {
    from,
    rpc: async (name: string, args: Record<string, unknown>) => {
      const h = rpc.handlers[name];
      if (!h) return { data: null, error: { message: `no rpc ${name}` } };
      const r = h(args);
      return { data: r.data ?? null, error: r.error ?? null };
    },
    auth: { getUser: async () => ({ data: { user: client.user }, error: null }), signInWithPassword: async () => ({ error: null }) },
    user: null as null | { id: string; email?: string },
  };
  return { client, tables, calls, rpc };
}
