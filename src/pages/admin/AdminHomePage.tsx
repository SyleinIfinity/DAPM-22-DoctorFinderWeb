import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/http";
import type {
  AdminDashboardEvent,
  AdminDashboardOverview,
} from "../../api/types";
import { getApiErrorMessage } from "../../utils/errors";
import { DoctorStatCard, DoctorPanel } from "../doctor/doctorUi";

function formatEventTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function AdminHomePage() {
  const overviewQuery = useQuery({
    queryKey: ["admin-dashboard-overview", 15],
    queryFn: async () =>
      (
        await api.get<AdminDashboardOverview>("/api/admin/dashboard/overview", {
          params: { onlineWindowMinutes: 15 },
        })
      ).data,
  });

  const eventsQuery = useQuery({
    queryKey: ["admin-dashboard-events", 24, 20],
    queryFn: async () =>
      (
        await api.get<AdminDashboardEvent[]>("/api/admin/dashboard/events", {
          params: { hours: 24, limit: 20 },
        })
      ).data,
  });

  const o = overviewQuery.data;

  return (
    <>
      <DoctorPanel>
        {overviewQuery.isLoading ? (
          <div className="muted">Đang tải số liệu…</div>
        ) : null}
        {overviewQuery.isError ? (
          <div
            className="card"
            style={{ borderColor: "rgba(239,68,68,0.5)", marginBottom: 16 }}
          >
            {getApiErrorMessage(overviewQuery.error)}
          </div>
        ) : null}

        {o ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 12,
            }}
          >
            <DoctorStatCard
              label="Online (ước tính)"
              value={String(o.onlineAccounts)}
              hint={`Trong ${o.onlineWindowMinutes} phút gần nhất`}
            />
            <DoctorStatCard
              label="Người dùng"
              value={String(o.totalMembers)}
              hint="Bản ghi người dùng (bệnh nhân)"
            />
            <DoctorStatCard
              label="Bác sĩ (đã duyệt)"
              value={String(o.totalDoctors)}
              hint="Hồ sơ trạng thái DA_DUYET"
            />
          </div>
        ) : null}
      </DoctorPanel>

      <div style={{ marginTop: 24 }}>
        <DoctorPanel title="Hoạt động gần đây (24h)">
          {eventsQuery.isLoading ? (
            <div className="muted">Đang tải thông báo…</div>
          ) : null}
          {eventsQuery.isError ? (
            <div
              className="card"
              style={{ borderColor: "rgba(239,68,68,0.5)" }}
            >
              {getApiErrorMessage(eventsQuery.error)}
            </div>
          ) : null}

          <div className="stack" style={{ gap: 8 }}>
            {(eventsQuery.data || []).length === 0 && !eventsQuery.isLoading ? (
              <div className="muted">Chưa có sự kiện trong 24 giờ qua.</div>
            ) : null}
            {(eventsQuery.data || []).map((ev, idx) => (
              <div
                key={`${ev.type}-${idx}-${ev.occurredAt}`}
                className="card row-between"
                style={{ alignItems: "flex-start" }}
              >
                <div>
                  <div
                    style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}
                  >
                    {ev.message}
                  </div>
                  <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
                    {ev.type === "DOCTOR_APPROVED"
                      ? "Duyệt bác sĩ"
                      : "Tài khoản"}
                  </div>
                </div>
                <span className="chip" style={{ flexShrink: 0 }}>
                  {formatEventTime(ev.occurredAt)}
                </span>
              </div>
            ))}
          </div>
        </DoctorPanel>
      </div>
    </>
  );
}
