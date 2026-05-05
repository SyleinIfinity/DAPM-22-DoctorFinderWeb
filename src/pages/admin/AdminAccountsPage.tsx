import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/http";
import type { AdminAccount, AdminAccountAction } from "../../api/types";
import { getApiErrorMessage } from "../../utils/errors";
import { DoctorPanel, AccountCard } from "../doctor/doctorUi";

type AccountSegment = "all" | "member" | "doctor";

export function AdminAccountsPage() {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [segment, setSegment] = useState<AccountSegment>("all");

  const query = useQuery({
    queryKey: ["admin-accounts"],
    queryFn: async () =>
      (await api.get<AdminAccount[]>("/api/admin/accounts")).data,
  });

  const lock = useMutation({
    mutationFn: async (maTaiKhoan: number) =>
      (
        await api.patch<AdminAccountAction>(
          `/api/admin/accounts/${maTaiKhoan}/lock`,
        )
      ).data,
    onSuccess: async () => {
      setError(null);
      await qc.invalidateQueries({ queryKey: ["admin-accounts"] });
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const unlock = useMutation({
    mutationFn: async (maTaiKhoan: number) =>
      (
        await api.patch<AdminAccountAction>(
          `/api/admin/accounts/${maTaiKhoan}/unlock`,
        )
      ).data,
    onSuccess: async () => {
      setError(null);
      await qc.invalidateQueries({ queryKey: ["admin-accounts"] });
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const updateRole = useMutation({
    mutationFn: async ({
      maTaiKhoan,
      vaiTro,
    }: {
      maTaiKhoan: number;
      vaiTro: string;
    }) =>
      (
        await api.patch<AdminAccountAction>(
          `/api/admin/accounts/${maTaiKhoan}/role`,
          { vaiTro },
        )
      ).data,
    onSuccess: async () => {
      setError(null);
      await qc.invalidateQueries({ queryKey: ["admin-accounts"] });
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const list = useMemo(() => {
    const raw = query.data || [];
    if (segment === "doctor") return raw.filter((a) => a.maBacSi != null);
    if (segment === "member") return raw.filter((a) => a.maBacSi == null);
    return raw;
  }, [query.data, segment]);

  return (
    <>
      <DoctorPanel
        title="Quản lý tài khoản"
        description="Quản lý danh sách người dùng, bác sĩ và quyền hạn."
      >
        <div
          className="row"
          style={{ gap: 8, marginBottom: 16, flexWrap: "wrap" }}
        >
          {(
            [
              { id: "all" as const, label: "Tất cả" },
              {
                id: "member" as const,
                label: "Người dùng (không có hồ sơ BS)",
              },
              { id: "doctor" as const, label: "Bác sĩ (có hồ sơ BS)" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              className={segment === t.id ? "btn btn-primary" : "btn"}
              onClick={() => setSegment(t.id)}
              style={{ fontSize: 13 }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </DoctorPanel>

      {query.isLoading ? (
        <div className="muted" style={{ marginTop: 16 }}>
          Đang tải…
        </div>
      ) : null}
      {query.isError ? (
        <div
          className="card"
          style={{ borderColor: "rgba(239,68,68,0.6)", marginTop: 16 }}
        >
          {getApiErrorMessage(query.error)}
        </div>
      ) : null}
      {error ? (
        <div
          className="card"
          style={{ borderColor: "rgba(239,68,68,0.6)", marginTop: 16 }}
        >
          {error}
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 16,
          marginTop: 24,
        }}
      >
        {!query.isLoading && list.length === 0 ? (
          <div
            className="muted"
            style={{ gridColumn: "1/-1", padding: "20px", textAlign: "center" }}
          >
            Không có tài khoản trong nhóm đã chọn.
          </div>
        ) : null}
        {list.map((a) => (
          <Link
            key={a.maTaiKhoan}
            to={`/admin/accounts/${a.maTaiKhoan}`}
            style={{ textDecoration: "none" }}
          >
            <AccountCard
              id={a.maTaiKhoan}
              username={a.tenDangNhap}
              role={a.vaiTro}
              fullName={a.hoTenNguoiDung}
              status={a.trangThaiHoatDong}
              doctorId={a.maBacSi}
              doctorStatus={a.trangThaiHoSoBacSi}
              onDetail={() => {
                /* handled by Link */
              }}
              onToggleLock={() => {
                if (a.trangThaiHoatDong === "KHOA") {
                  unlock.mutate(a.maTaiKhoan);
                } else {
                  lock.mutate(a.maTaiKhoan);
                }
              }}
              onChangeRole={() => {
                const next = prompt(
                  "Nhập vai trò mới (VD: NGUOI_DUNG/BAC_SI/QUAN_TRI_VIEN):",
                  a.vaiTro,
                );
                if (!next) return;
                updateRole.mutate({ maTaiKhoan: a.maTaiKhoan, vaiTro: next });
              }}
              isLoading={
                lock.isPending || unlock.isPending || updateRole.isPending
              }
            />
          </Link>
        ))}
      </div>
    </>
  );
}
