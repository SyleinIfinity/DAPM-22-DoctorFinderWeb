import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/http";
import type {
  AdminDoctorProfileTrafficReport,
  AdminReportDoctorRank,
  AdminReportKeyword,
} from "../../api/types";
import { getApiErrorMessage } from "../../utils/errors";
import { DoctorPanel } from "../doctor/doctorUi";

const PIE_COLORS = [
  "#0d9488",
  "#f59e0b",
  "#6366f1",
  "#ec4899",
  "#22c55e",
  "#94a3b8",
  "#8b5cf6",
  "#14b8a6",
];

function PieChart({
  slices,
}: {
  slices: { label: string; percent: number; color: string }[];
}) {
  if (slices.length === 0) {
    return (
      <div
        style={{
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "#e2e8f0",
          display: "grid",
          placeItems: "center",
          color: "#64748b",
          fontSize: 13,
        }}
      >
        Chưa có dữ liệu
      </div>
    );
  }
  let acc = 0;
  const parts = slices.map((s) => {
    const start = acc;
    acc += Math.max(0, s.percent);
    return `${s.color} ${start}% ${acc}%`;
  });
  return (
    <div
      style={{
        width: 200,
        height: 200,
        borderRadius: "50%",
        background: `conic-gradient(${parts.join(", ")})`,
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      }}
    />
  );
}

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  const fmt = (d: Date) => {
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  return { from: fmt(from), to: fmt(to) };
}

export function AdminReportsPage() {
  const { from: defaultFrom, to: defaultTo } = useMemo(
    () => defaultRange(),
    [],
  );
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);

  const params = useMemo(() => {
    const normalize = (s: string) => (s.length === 16 ? `${s}:00` : s);
    return { from: normalize(from), to: normalize(to) };
  }, [from, to]);

  const trafficQuery = useQuery({
    queryKey: ["admin-report-traffic", params.from, params.to],
    queryFn: async () =>
      (
        await api.get<AdminDoctorProfileTrafficReport>(
          "/api/admin/reports/doctor-profile-traffic",
          {
            params: { ...params, top: 7 },
          },
        )
      ).data,
  });

  const topViewQuery = useQuery({
    queryKey: ["admin-report-top-view", params.from, params.to],
    queryFn: async () =>
      (
        await api.get<AdminReportDoctorRank[]>(
          "/api/admin/reports/top-doctors",
          {
            params: { ...params, metric: "view", limit: 10 },
          },
        )
      ).data,
  });

  const topFollowQuery = useQuery({
    queryKey: ["admin-report-top-follow", params.from, params.to],
    queryFn: async () =>
      (
        await api.get<AdminReportDoctorRank[]>(
          "/api/admin/reports/top-doctors",
          {
            params: { ...params, metric: "follow", limit: 10 },
          },
        )
      ).data,
  });

  const keywordsQuery = useQuery({
    queryKey: ["admin-report-keywords", params.from, params.to],
    queryFn: async () =>
      (
        await api.get<AdminReportKeyword[]>(
          "/api/admin/reports/top-search-keywords",
          {
            params: { ...params, limit: 10 },
          },
        )
      ).data,
  });

  const pieSlices = useMemo(() => {
    const data = trafficQuery.data;
    if (!data?.slices?.length) return [];
    return data.slices.map((s, i) => ({
      label: s.label,
      percent: s.percent,
      color: PIE_COLORS[i % PIE_COLORS.length],
    }));
  }, [trafficQuery.data]);

  return (
    <>
      <DoctorPanel title="Khoảng thời gian">
        <div style={{ gap: 12 }}>
          <div
            className="row"
            style={{
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <label className="muted" style={{ fontSize: 12 }}>
              Từ{" "}
              <input
                type="datetime-local"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                style={{ marginLeft: 6 }}
              />
            </label>
            <label className="muted" style={{ fontSize: 12 }}>
              Đến{" "}
              <input
                type="datetime-local"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                style={{ marginLeft: 6 }}
              />
            </label>
          </div>
          <p className="muted" style={{ margin: 0, fontSize: 12 }}>
            Tần suất ghé thăm hồ sơ và từ khóa tìm kiếm được ghi khi người dùng
            gọi API xem bác sĩ / tìm kiếm (có thể truyền{" "}
            <code>viewerMaTaiKhoan</code>).
          </p>
        </div>
      </DoctorPanel>

      <div style={{ marginTop: 24 }}>
        <DoctorPanel title="Tần suất xem hồ sơ bác sĩ">
          <div
            className="row"
            style={{ gap: 24, flexWrap: "wrap", alignItems: "center" }}
          >
            <PieChart slices={pieSlices} />
            <div style={{ flex: 1, minWidth: 200 }}>
              {trafficQuery.isError ? (
                <div style={{ color: "#dc2626", fontSize: 13 }}>
                  {getApiErrorMessage(trafficQuery.error)}
                </div>
              ) : null}
              {trafficQuery.isLoading ? (
                <div className="muted">Đang tải…</div>
              ) : null}
              <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
                Tổng lượt xem:{" "}
                <b style={{ color: "#0f172a" }}>
                  {trafficQuery.data?.totalViews ?? 0}
                </b>
              </div>
              <div className="stack" style={{ gap: 6 }}>
                {(trafficQuery.data?.slices || []).map((s, i) => (
                  <div
                    key={`${s.label}-${i}`}
                    className="row-between"
                    style={{ fontSize: 13 }}
                  >
                    <span
                      className="row"
                      style={{ gap: 8, alignItems: "center" }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 2,
                          background: PIE_COLORS[i % PIE_COLORS.length],
                        }}
                      />
                      {s.label}
                    </span>
                    <span style={{ fontWeight: 700 }}>
                      {s.value} ({s.percent}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DoctorPanel>
      </div>

      <div style={{ marginTop: 24 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 12,
          }}
        >
          <DoctorPanel title="Top bác sĩ được xem">
            {topViewQuery.isError ? (
              <div style={{ color: "#dc2626" }}>
                {getApiErrorMessage(topViewQuery.error)}
              </div>
            ) : null}
            {topViewQuery.isLoading ? (
              <div className="muted">Đang tải…</div>
            ) : null}
            <div className="stack" style={{ gap: 6 }}>
              {(topViewQuery.data || []).map((r) => (
                <div
                  key={r.maBacSi}
                  className="row-between"
                  style={{ fontSize: 13 }}
                >
                  <span>
                    #{r.rank} {r.hoTenDayDu}
                  </span>
                  <span className="chip">{r.count}</span>
                </div>
              ))}
              {(topViewQuery.data || []).length === 0 &&
              !topViewQuery.isLoading ? (
                <div className="muted" style={{ fontSize: 13 }}>
                  Chưa có dữ liệu.
                </div>
              ) : null}
            </div>
          </DoctorPanel>

          <DoctorPanel title="Top bác sĩ được follow">
            {topFollowQuery.isError ? (
              <div style={{ color: "#dc2626" }}>
                {getApiErrorMessage(topFollowQuery.error)}
              </div>
            ) : null}
            {topFollowQuery.isLoading ? (
              <div className="muted">Đang tải…</div>
            ) : null}
            <div className="stack" style={{ gap: 6 }}>
              {(topFollowQuery.data || []).map((r) => (
                <div
                  key={r.maBacSi}
                  className="row-between"
                  style={{ fontSize: 13 }}
                >
                  <span>
                    #{r.rank} {r.hoTenDayDu}
                  </span>
                  <span className="chip">{r.count}</span>
                </div>
              ))}
              {(topFollowQuery.data || []).length === 0 &&
              !topFollowQuery.isLoading ? (
                <div className="muted" style={{ fontSize: 13 }}>
                  Chưa có dữ liệu.
                </div>
              ) : null}
            </div>
          </DoctorPanel>

          <DoctorPanel title="Top từ khóa tìm kiếm">
            {keywordsQuery.isError ? (
              <div style={{ color: "#dc2626" }}>
                {getApiErrorMessage(keywordsQuery.error)}
              </div>
            ) : null}
            {keywordsQuery.isLoading ? (
              <div className="muted">Đang tải…</div>
            ) : null}
            <div className="stack" style={{ gap: 6 }}>
              {(keywordsQuery.data || []).map((k) => (
                <div
                  key={`${k.keyword}-${k.rank}`}
                  className="row-between"
                  style={{ fontSize: 13 }}
                >
                  <span>
                    #{k.rank} {k.keyword}
                  </span>
                  <span className="chip">{k.count}</span>
                </div>
              ))}
              {(keywordsQuery.data || []).length === 0 &&
              !keywordsQuery.isLoading ? (
                <div className="muted" style={{ fontSize: 13 }}>
                  Chưa có dữ liệu.
                </div>
              ) : null}
            </div>
          </DoctorPanel>
        </div>
      </div>
    </>
  );
}
