"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface HuntScanDto {
  id: string;
  code: string;
  houseId: string;
  houseName: string;
  deviceId: string;
  deviceNumber: number | null;
  ip: string | null;
  name: string;
  group: number;
  scannedAt: string;
}

interface HuntDeviceDto {
  deviceId: string;
  deviceNumber: number;
  firstSeenAt: string;
  lastSeenAt: string;
  lastIp: string | null;
  lastHouseName: string | null;
  scanCount: number;
}

interface HouseStat {
  houseId: string;
  houseName: string;
  scanCount: number;
  distinctCodes: number;
}

const PAGE_SIZE = 50;

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function HuntActivity() {
  const router = useRouter();
  const [tab, setTab] = useState<"scans" | "devices" | "houses">("scans");
  const [scans, setScans] = useState<HuntScanDto[]>([]);
  const [devices, setDevices] = useState<HuntDeviceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedDevice, setSelectedDevice] = useState<HuntDeviceDto | null>(null);
  const [selectedHouse, setSelectedHouse] = useState<HouseStat | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [scansRes, devicesRes] = await Promise.all([
      fetch("/api/v1/hunt/scans"),
      fetch("/api/v1/hunt/devices"),
    ]);

    if (scansRes.status === 401 || devicesRes.status === 401) {
      router.push("/login?next=/hunt/activity");
      return;
    }

    if (!scansRes.ok || !devicesRes.ok) {
      setError("Could not load activity");
      setLoading(false);
      return;
    }

    const scansData = await scansRes.json();
    const devicesData = await devicesRes.json();

    setScans(scansData.scans ?? []);
    setDevices(devicesData.devices ?? []);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    load();
  }, [load]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset pagination when the view/filter changes
    setPage(1);
  }, [tab, query]);

  const filteredScans = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return scans;

    return scans.filter(
      (s) =>
        // Scans recorded before a field existed (name, houseName, ...) can
        // have it missing in Mongo despite the DTO type saying otherwise.
        (s.code ?? "").toLowerCase().includes(q) ||
        (s.name ?? "").toLowerCase().includes(q) ||
        (s.houseName ?? "").toLowerCase().includes(q) ||
        String(s.deviceNumber ?? "").includes(q) ||
        (s.ip ?? "").includes(q)
    );
  }, [scans, query]);

  const filteredDevices = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return devices;

    return devices.filter(
      (d) =>
        String(d.deviceNumber).includes(q) ||
        (d.lastIp ?? "").includes(q) ||
        (d.lastHouseName ?? "").toLowerCase().includes(q)
    );
  }, [devices, query]);

  const deviceScans = useMemo(() => {
    if (!selectedDevice) return [];

    // scans is already sorted most-recent-first by the API — filtering keeps that order.
    return scans.filter((s) => s.deviceId === selectedDevice.deviceId);
  }, [scans, selectedDevice]);

  // "School"/house breakdown — how many scans each house has made, derived
  // client-side from the same scan log rather than a separate endpoint.
  const houseStats = useMemo(() => {
    const byHouse = new Map<string, { houseName: string; scanCount: number; codes: Set<string> }>();

    for (const s of scans) {
      const key = s.houseId || s.houseName || "unknown";
      const entry = byHouse.get(key) ?? {
        houseName: s.houseName || "Unknown",
        scanCount: 0,
        codes: new Set<string>(),
      };
      entry.scanCount += 1;
      entry.codes.add(s.code);
      byHouse.set(key, entry);
    }

    return Array.from(byHouse.entries())
      .map(([houseId, v]): HouseStat => ({
        houseId,
        houseName: v.houseName,
        scanCount: v.scanCount,
        distinctCodes: v.codes.size,
      }))
      .sort((a, b) => b.scanCount - a.scanCount);
  }, [scans]);

  const filteredHouses = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return houseStats;

    return houseStats.filter((h) => h.houseName.toLowerCase().includes(q));
  }, [houseStats, query]);

  // Per house: how many times each individual code was scanned by that
  // house — answers "which code, how many times" directly.
  const houseCodeBreakdown = useMemo(() => {
    if (!selectedHouse) return [];

    const byCode = new Map<string, { count: number; lastAt: string }>();

    for (const s of scans) {
      const key = s.houseId || s.houseName || "unknown";
      if (key !== selectedHouse.houseId) continue;

      const entry = byCode.get(s.code) ?? { count: 0, lastAt: s.scannedAt };
      entry.count += 1;
      if (s.scannedAt > entry.lastAt) entry.lastAt = s.scannedAt;
      byCode.set(s.code, entry);
    }

    return Array.from(byCode.entries())
      .map(([code, v]) => ({ code, count: v.count, lastAt: v.lastAt }))
      .sort((a, b) => b.count - a.count);
  }, [scans, selectedHouse]);

  const rows = tab === "scans" ? filteredScans : tab === "devices" ? filteredDevices : filteredHouses;
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const pill =
    "rounded-full border-2 border-dotted px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors";
  const ghost = "border-fg/40 text-fg hover:border-fg";
  const active = "border-transparent bg-fg text-surface";

  const stats = useMemo(
    () => ({
      totalScans: scans.length,
      totalDevices: devices.length,
      topScans: devices[0]?.scanCount ?? 0,
    }),
    [scans, devices]
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-italic text-sm italic text-fg/50">— NUST Orientation &apos;26</p>
          <h1 className="mt-2 font-serif text-5xl font-bold text-fg">Hunt Activity</h1>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-fg/50">
            Every scan, and every device that made one
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/hunt" className={`${pill} ${ghost}`}>
            ← Back to codes
          </a>
          <button onClick={load} className={`${pill} ${ghost}`}>
            Refresh
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total scans", value: stats.totalScans },
          { label: "Distinct devices", value: stats.totalDevices },
          { label: "Busiest device's scans", value: stats.topScans },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-fg/12 bg-fg/[0.02] p-5">
            <div className="text-4xl font-bold tabular-nums text-fg">{s.value}</div>
            <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-fg/50">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button onClick={() => setTab("scans")} className={`${pill} ${tab === "scans" ? active : ghost}`}>
            Scan log
          </button>
          <button
            onClick={() => setTab("devices")}
            className={`${pill} ${tab === "devices" ? active : ghost}`}
          >
            Devices
          </button>
          <button
            onClick={() => setTab("houses")}
            className={`${pill} ${tab === "houses" ? active : ghost}`}
          >
            Houses
          </button>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            tab === "scans"
              ? "Search code, name, house, device #, IP…"
              : tab === "devices"
                ? "Search device #, house, IP…"
                : "Search house…"
          }
          className="w-full max-w-xs rounded-full border-2 border-dotted border-fg/25 bg-transparent px-5 py-2.5 font-mono text-[13px] text-fg placeholder:text-fg/30 focus:border-fg focus:outline-none"
        />
      </div>

      {error && (
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.1em] text-ember">{error}</p>
      )}

      {tab === "scans" ? (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-fg/12">
          <table className="w-full min-w-[900px] border-collapse text-left font-mono text-[12px]">
            <thead>
              <tr className="border-b border-fg/15 text-fg/45">
                {["Time", "Device #", "Code", "House", "Name", "Group", "IP"].map((h) => (
                  <th key={h} className="px-4 py-3 text-[10px] uppercase tracking-[0.12em]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td className="px-4 py-4 text-fg/45" colSpan={7}>
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && pageRows.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center uppercase tracking-[0.1em] text-fg/40" colSpan={7}>
                    No scans {query ? "match that search" : "yet"}.
                  </td>
                </tr>
              )}
              {(pageRows as HuntScanDto[]).map((s) => (
                <tr key={s.id} className="border-b border-fg/8 text-fg/80 hover:bg-fg/[0.03]">
                  <td className="whitespace-nowrap px-4 py-2.5 text-fg/60">
                    {formatDateTime(s.scannedAt)}
                  </td>
                  <td className="px-4 py-2.5 font-sans font-medium text-fg">
                    {s.deviceNumber !== null ? `#${s.deviceNumber}` : "—"}
                  </td>
                  <td className="px-4 py-2.5">{s.code}</td>
                  <td className="px-4 py-2.5">{s.houseName}</td>
                  <td className="px-4 py-2.5">{s.name}</td>
                  <td className="px-4 py-2.5">{s.group}</td>
                  <td className="px-4 py-2.5 text-fg/60">{s.ip ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : tab === "devices" ? (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-fg/12">
          <table className="w-full min-w-[800px] border-collapse text-left font-mono text-[12px]">
            <thead>
              <tr className="border-b border-fg/15 text-fg/45">
                {["Device #", "House", "Scans", "First seen", "Last seen", "Last IP"].map((h) => (
                  <th key={h} className="px-4 py-3 text-[10px] uppercase tracking-[0.12em]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td className="px-4 py-4 text-fg/45" colSpan={6}>
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && pageRows.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center uppercase tracking-[0.1em] text-fg/40" colSpan={6}>
                    No devices {query ? "match that search" : "yet"}.
                  </td>
                </tr>
              )}
              {(pageRows as HuntDeviceDto[]).map((d) => (
                <tr
                  key={d.deviceId}
                  onClick={() => setSelectedDevice(d)}
                  className="cursor-pointer border-b border-fg/8 text-fg/80 hover:bg-fg/[0.03]"
                >
                  <td className="px-4 py-2.5 font-sans font-medium text-fg underline decoration-dotted underline-offset-4">
                    #{d.deviceNumber}
                  </td>
                  <td className="px-4 py-2.5">{d.lastHouseName ?? "—"}</td>
                  <td className="px-4 py-2.5">{d.scanCount}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-fg/60">
                    {formatDateTime(d.firstSeenAt)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-fg/60">
                    {formatDateTime(d.lastSeenAt)}
                  </td>
                  <td className="px-4 py-2.5 text-fg/60">{d.lastIp ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-fg/12">
          <table className="w-full min-w-[600px] border-collapse text-left font-mono text-[12px]">
            <thead>
              <tr className="border-b border-fg/15 text-fg/45">
                {["House", "Scans", "Distinct codes"].map((h) => (
                  <th key={h} className="px-4 py-3 text-[10px] uppercase tracking-[0.12em]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td className="px-4 py-4 text-fg/45" colSpan={3}>
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && pageRows.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center uppercase tracking-[0.1em] text-fg/40" colSpan={3}>
                    No houses {query ? "match that search" : "have scanned yet"}.
                  </td>
                </tr>
              )}
              {(pageRows as HouseStat[]).map((h) => (
                <tr
                  key={h.houseId}
                  onClick={() => setSelectedHouse(h)}
                  className="cursor-pointer border-b border-fg/8 text-fg/80 hover:bg-fg/[0.03]"
                >
                  <td className="px-4 py-2.5 font-sans font-medium text-fg underline decoration-dotted underline-offset-4">
                    {h.houseName}
                  </td>
                  <td className="px-4 py-2.5">{h.scanCount}</td>
                  <td className="px-4 py-2.5">{h.distinctCodes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows.length > 0 && (
        <div className="mt-4 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.1em] text-fg/50">
          <span>
            {rows.length} row{rows.length === 1 ? "" : "s"} · page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
              className="rounded-full border-2 border-dotted border-fg/40 px-4 py-1.5 text-fg transition-colors hover:border-fg disabled:opacity-30"
            >
              Previous
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setPage(currentPage + 1)}
              className="rounded-full border-2 border-dotted border-fg/40 px-4 py-1.5 text-fg transition-colors hover:border-fg disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {selectedDevice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-6 py-10 backdrop-blur-sm"
          onClick={() => setSelectedDevice(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-fg/15 bg-surface p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg/50">
                  Device
                </p>
                <h3 className="mt-1 font-serif text-3xl font-bold text-fg">
                  #{selectedDevice.deviceNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDevice(null)}
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-fg/40 hover:text-fg"
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "House", value: selectedDevice.lastHouseName ?? "—" },
                { label: "Total scans", value: String(deviceScans.length) },
                { label: "First seen", value: formatDateTime(selectedDevice.firstSeenAt) },
                { label: "Last seen", value: formatDateTime(selectedDevice.lastSeenAt) },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-fg/12 bg-fg/[0.02] p-3">
                  <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-fg/45">
                    {s.label}
                  </div>
                  <div className="mt-1 font-mono text-[12px] text-fg">{s.value}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 font-mono text-[11px] text-fg/50">
              Last IP: <span className="text-fg">{selectedDevice.lastIp ?? "—"}</span> · Device id:{" "}
              <span className="text-fg/70">{selectedDevice.deviceId}</span>
            </p>

            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.14em] text-fg/45">
              QR codes captured ({deviceScans.length})
            </p>
            <div className="mt-2 overflow-hidden rounded-xl border border-fg/12">
              <table className="w-full border-collapse text-left font-mono text-[12px]">
                <thead>
                  <tr className="border-b border-fg/15 text-fg/45">
                    {["Time", "Code", "House"].map((h) => (
                      <th key={h} className="px-3 py-2 text-[10px] uppercase tracking-[0.12em]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deviceScans.length === 0 && (
                    <tr>
                      <td className="px-3 py-4 text-center text-fg/40" colSpan={3}>
                        No scans on record for this device.
                      </td>
                    </tr>
                  )}
                  {deviceScans.map((s) => (
                    <tr key={s.id} className="border-b border-fg/8 text-fg/80">
                      <td className="whitespace-nowrap px-3 py-2 text-fg/60">
                        {formatDateTime(s.scannedAt)}
                      </td>
                      <td className="px-3 py-2">{s.code}</td>
                      <td className="px-3 py-2">{s.houseName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedHouse && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-6 py-10 backdrop-blur-sm"
          onClick={() => setSelectedHouse(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-fg/15 bg-surface p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg/50">House</p>
                <h3 className="mt-1 font-serif text-3xl font-bold text-fg">
                  {selectedHouse.houseName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedHouse(null)}
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-fg/40 hover:text-fg"
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                { label: "Total scans", value: String(selectedHouse.scanCount) },
                { label: "Distinct codes", value: String(selectedHouse.distinctCodes) },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-fg/12 bg-fg/[0.02] p-3">
                  <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-fg/45">
                    {s.label}
                  </div>
                  <div className="mt-1 font-mono text-[12px] text-fg">{s.value}</div>
                </div>
              ))}
            </div>

            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.14em] text-fg/45">
              Codes scanned by {selectedHouse.houseName}, by frequency
            </p>
            <div className="mt-2 overflow-hidden rounded-xl border border-fg/12">
              <table className="w-full border-collapse text-left font-mono text-[12px]">
                <thead>
                  <tr className="border-b border-fg/15 text-fg/45">
                    {["Code", "Times scanned", "Last scanned"].map((h) => (
                      <th key={h} className="px-3 py-2 text-[10px] uppercase tracking-[0.12em]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {houseCodeBreakdown.length === 0 && (
                    <tr>
                      <td className="px-3 py-4 text-center text-fg/40" colSpan={3}>
                        No scans on record for this house.
                      </td>
                    </tr>
                  )}
                  {houseCodeBreakdown.map((c) => (
                    <tr key={c.code} className="border-b border-fg/8 text-fg/80">
                      <td className="px-3 py-2">{c.code}</td>
                      <td className="px-3 py-2">{c.count}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-fg/60">
                        {formatDateTime(c.lastAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
