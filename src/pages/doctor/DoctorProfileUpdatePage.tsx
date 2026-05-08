import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/http";
import type { AccountDoctorInfo, UpgradeToDoctorResponse } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { getApiErrorMessage } from "../../utils/errors";
import {
  DoctorAvatar,
  DoctorNotice,
  DoctorPageHeading,
  DoctorPanel,
  DoctorStatCard,
  DoctorStatusBadge,
  getProfileStatusMeta,
} from "./doctorUi";

type DocUpload = { id: number; title: string; file: File | null };

type DoctorFormState = {
  chuyenKhoa: string;
  trinhDoChuyenMon: string;
  maChungChiHanhNghe: string;
  loaiHinhBacSi: string;
  tenCoSoYTe: string;
  diaChiLamViec: string;
  moTaBanThan: string;
};
type NoticeState = {
  tone: "success" | "danger" | "warning" | "info";
  title: string;
  description: string;
} | null;

const specialtyOptions = [
  "Tim mạch",
  "Thần kinh",
  "Nha khoa",
  "Nhi khoa",
  "Tai mũi họng",
  "Da liễu",
  "Sản phụ khoa",
  "Cơ xương khớp",
  "Nội khoa",
  "Ngoại khoa",
  "Mắt",
  "Ung bướu",
];

function createDocUpload(): DocUpload {
  return { id: Date.now(), title: "", file: null };
}

function getInitialDoctorForm(
  data?: AccountDoctorInfo | null,
): DoctorFormState {
  return {
    chuyenKhoa: data?.chuyenKhoa ?? "",
    trinhDoChuyenMon: data?.trinhDoChuyenMon ?? "",
    maChungChiHanhNghe: data?.maChungChiHanhNghe ?? "",
    loaiHinhBacSi: data?.loaiHinhBacSi ?? "",
    tenCoSoYTe: data?.tenCoSoYTe ?? "",
    diaChiLamViec: data?.diaChiLamViec ?? "",
    moTaBanThan: data?.moTaBanThan ?? "",
  };
}

function getActivityStatusMeta(status: string | null | undefined) {
  switch (status) {
    case "HOAT_DONG":
      return { label: "Đang hoạt động", tone: "success" as const };
    case "BI_KHOA":
      return { label: "Tài khoản bị khóa", tone: "danger" as const };
    case "CHO_DUYET":
      return { label: "Chờ kích hoạt", tone: "warning" as const };
    default:
      return { label: status ?? "Chưa xác định", tone: "neutral" as const };
  }
}

export function DoctorProfileUpdatePage() {
  const qc = useQueryClient();
  const { session } = useAuth();
  const maTaiKhoan = session?.maTaiKhoan ?? null;

  const [doctorForm, setDoctorForm] = useState<DoctorFormState>(() =>
    getInitialDoctorForm(null),
  );
  const [docs, setDocs] = useState<DocUpload[]>(() => [createDocUpload()]);
  const [notice, setNotice] = useState<NoticeState>(null);

  const query = useQuery({
    queryKey: ["doctor-profile-update", maTaiKhoan],
    queryFn: async () => {
      if (!maTaiKhoan) throw new Error("Thiếu phiên đăng nhập");
      const response = await api.get<AccountDoctorInfo>(
        `/api/auth/account/${maTaiKhoan}/doctor`,
      );
      return response.data;
    },
    enabled: !!maTaiKhoan,
  });

  const rawData = query.data ?? null;
  const hasDoctorAccount = rawData?.coTaiKhoanBacSi ?? false;
  const profileStatus = rawData?.trangThaiHoSo
    ? getProfileStatusMeta(rawData.trangThaiHoSo)
    : null;
  const activityStatus = rawData
    ? getActivityStatusMeta(rawData.trangThaiHoatDong)
    : null;

  useEffect(() => {
    if (rawData) {
      setDoctorForm(getInitialDoctorForm(rawData));
    }
  }, [rawData]);

  const saveProfile = useMutation({
    mutationFn: async () => {
      if (!maTaiKhoan) throw new Error("Thiếu phiên đăng nhập");

      const doctorPayload = {
        chuyenKhoa: doctorForm.chuyenKhoa.trim(),
        trinhDoChuyenMon: doctorForm.trinhDoChuyenMon.trim(),
        loaiHinhBacSi: doctorForm.loaiHinhBacSi.trim(),
        tenCoSoYTe: doctorForm.tenCoSoYTe.trim(),
        diaChiLamViec: doctorForm.diaChiLamViec.trim() || null,
        maChungChiHanhNghe: doctorForm.maChungChiHanhNghe.trim(),
        moTaBanThan: doctorForm.moTaBanThan.trim() || null,
      };

      if (
        !doctorPayload.chuyenKhoa ||
        !doctorPayload.trinhDoChuyenMon ||
        !doctorPayload.loaiHinhBacSi ||
        !doctorPayload.tenCoSoYTe ||
        !doctorPayload.maChungChiHanhNghe
      ) {
        throw new Error("Vui lòng nhập đầy đủ thông tin chuyên môn bắt buộc");
      }

      const validDocs = docs.filter((doc) => doc.file);
      const messages: string[] = [];
      const hadExistingDoctor = !!rawData?.maBacSi;
      let maBacSi = rawData?.maBacSi ?? null;

      const upgradeForm = new FormData();
      upgradeForm.append("maTaiKhoan", String(maTaiKhoan));
      upgradeForm.append(
        "thongTinBacSi",
        new Blob([JSON.stringify(doctorPayload)], { type: "application/json" }),
      );

      if (!maBacSi) {
        for (const doc of validDocs) {
          const fallbackTitle = doc.file?.name ?? "Tai lieu minh chung";
          upgradeForm.append("tieuDeTaiLieu", doc.title.trim() || fallbackTitle);
          upgradeForm.append("files", doc.file as File);
        }
      }

      const upgradeResponse = await api.post<UpgradeToDoctorResponse>(
        "/api/auth/upgrade-to-doctor",
        upgradeForm,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      messages.push(upgradeResponse.data.message);
      if (!maBacSi) {
        maBacSi = upgradeResponse.data.maBacSi ?? null;
      }

      if (hadExistingDoctor && maBacSi && validDocs.length > 0) {
        for (const doc of validDocs) {
          const form = new FormData();
          const fallbackTitle = doc.file?.name ?? "Tai lieu minh chung";
          form.append("tieuDeTaiLieu", doc.title.trim() || fallbackTitle);
          form.append("file", doc.file as File);
          await api.post(`/api/doctors/${maBacSi}/documents`, form, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
        messages.push(`Đã tải ${validDocs.length} tài liệu minh chứng.`);
      }

      return { upgraded: upgradeResponse.data.upgraded, message: messages.join(" ") };
    },
    onSuccess: async (result) => {
      setNotice({
        tone: result.upgraded ? "success" : "warning",
        title: result.upgraded ? "Lưu hồ sơ thành công" : "Đã xử lý cập nhật",
        description: result.message,
      });
      setDocs([createDocUpload()]);
      await qc.invalidateQueries({ queryKey: ["doctor-profile-update", maTaiKhoan] });
      await qc.invalidateQueries({ queryKey: ["doctor-documents", rawData?.maBacSi ?? null] });
    },
    onError: (error) => {
      setNotice({
        tone: "danger",
        title: "Lưu hồ sơ thất bại",
        description: getApiErrorMessage(error),
      });
    },
  });

  const addDocRow = () => setDocs((prev) => [...prev, createDocUpload()]);
  const removeDocRow = (id: number) => {
    setDocs((prev) =>
      prev.length > 1 ? prev.filter((d) => d.id !== id) : prev,
    );
  };

  return (
    <div className="doctor-page">
      <DoctorPageHeading
        eyebrow="Cập nhật hồ sơ"
        title="Cập nhật hồ sơ bác sĩ"
        description="Giao diện riêng cho bác sĩ để chỉnh sửa thông tin chuyên môn và minh chứng, tách khỏi luồng dành cho thành viên."
        actions={
          <Link
            className="doctor-button doctor-button--secondary doctor-button-link"
            to="/doctor/account"
          >
            Quay lại hồ sơ
          </Link>
        }
      />

      {query.isLoading ? (
        <DoctorNotice
          tone="info"
          title="Đang tải thông tin"
          description="Hệ thống đang lấy hồ sơ bác sĩ hiện tại để điền sẵn biểu mẫu."
        />
      ) : null}

      {query.isError ? (
        <DoctorNotice
          tone="danger"
          title="Không tải được dữ liệu"
          description={getApiErrorMessage(query.error)}
        />
      ) : null}
      {notice ? (
        <DoctorNotice
          tone={notice.tone}
          title={notice.title}
          description={notice.description}
        />
      ) : null}

      {!maTaiKhoan ? (
        <DoctorNotice
          tone="warning"
          title="Chưa đăng nhập"
          description="Vui lòng đăng nhập để chỉnh sửa hồ sơ bác sĩ."
        />
      ) : null}

      {rawData ? (
        <>
          <section className="doctor-hero">
            <div className="doctor-hero__content">
              <div className="doctor-hero__eyebrow">Profile editor</div>
              <h2 className="doctor-hero__title">
                Cập nhật thông tin chuyên môn, nơi làm việc và mô tả hồ sơ.
              </h2>
              <p className="doctor-hero__subtitle">
                Đây là giao diện riêng cho bác sĩ, độc lập với màn hình hồ sơ ở
                khu vực thành viên.
              </p>

              <div className="doctor-button-row">
                <button
                  className="doctor-button doctor-button--primary"
                  type="button"
                  disabled={saveProfile.isPending}
                  onClick={() => saveProfile.mutate()}
                >
                  {saveProfile.isPending ? "Đang lưu..." : "Lưu cập nhật hồ sơ"}
                </button>
                <Link
                  className="doctor-button doctor-button--secondary doctor-button-link"
                  to="/doctor/documents"
                >
                  Quản lý minh chứng
                </Link>
              </div>
            </div>

            <div className="doctor-hero__aside">
              <div className="doctor-profile-strip">
                <DoctorAvatar
                  name={`${rawData.hoLot} ${rawData.ten}`}
                  imageUrl={rawData.anhDaiDien}
                />
                <div>
                  <h3 className="doctor-profile-strip__name">
                    {rawData.hoLot} {rawData.ten}
                  </h3>
                  <p className="doctor-profile-strip__meta">
                    {rawData.chuyenKhoa || "Chưa cập nhật"}
                    <br />
                    {rawData.tenCoSoYTe || "Chưa cập nhật"}
                  </p>
                </div>
              </div>

              {profileStatus ? (
                <DoctorStatusBadge
                  label={profileStatus.label}
                  tone={profileStatus.tone}
                />
              ) : null}

              <div className="doctor-keyfacts">
                <div className="doctor-keyfact">
                  <span className="doctor-keyfact__label">Mã hồ sơ bác sĩ</span>
                  <span className="doctor-keyfact__value">
                    {hasDoctorAccount ? `#${rawData.maBacSi}` : "Chưa có"}
                  </span>
                </div>
                <div className="doctor-keyfact">
                  <span className="doctor-keyfact__label">
                    Trạng thái tài khoản
                  </span>
                  <span className="doctor-keyfact__value">
                    {activityStatus?.label ?? rawData.trangThaiHoatDong}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="doctor-metrics-grid">
            <DoctorStatCard
              label="Trạng thái hồ sơ"
              value={
                profileStatus?.label ?? rawData.trangThaiHoSo ?? "Chưa xác định"
              }
              hint={profileStatus?.description}
            />
            <DoctorStatCard
              label="Chuyên khoa"
              value={rawData.chuyenKhoa || "Chưa cập nhật"}
              hint="Hiển thị với bệnh nhân trong khu vực công khai."
            />
            <DoctorStatCard
              label="Cơ sở y tế"
              value={rawData.tenCoSoYTe || "Chưa cập nhật"}
              hint={rawData.diaChiLamViec || "Địa chỉ làm việc chưa có."}
            />
            <DoctorStatCard
              label="Liên hệ"
              value={rawData.soDienThoai || "Chưa cập nhật"}
              hint={rawData.email}
            />
          </section>

          <div className="doctor-schedule-grid">
            <DoctorPanel
              title="Thông tin chuyên môn"
              description="Cập nhật các trường chính của hồ sơ bác sĩ."
            >
              <div className="doctor-form-grid">
                <div className="doctor-field">
                  <label className="doctor-label" htmlFor="doctor-specialty">
                    Chuyên khoa
                  </label>
                  <select
                    id="doctor-specialty"
                    className="doctor-input"
                    value={doctorForm.chuyenKhoa}
                    onChange={(event) =>
                      setDoctorForm((prev) => ({
                        ...prev,
                        chuyenKhoa: event.target.value,
                      }))
                    }
                  >
                    <option value="">Chọn chuyên khoa</option>
                    {specialtyOptions.map((specialty) => (
                      <option key={specialty} value={specialty}>
                        {specialty}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="doctor-field">
                  <label className="doctor-label" htmlFor="doctor-degree">
                    Trình độ chuyên môn
                  </label>
                  <input
                    id="doctor-degree"
                    className="doctor-input"
                    value={doctorForm.trinhDoChuyenMon}
                    onChange={(event) =>
                      setDoctorForm((prev) => ({
                        ...prev,
                        trinhDoChuyenMon: event.target.value,
                      }))
                    }
                    placeholder="Ví dụ: Thạc sĩ, CK1..."
                  />
                </div>

                <div className="doctor-field">
                  <label className="doctor-label" htmlFor="doctor-license">
                    Mã chứng chỉ hành nghề
                  </label>
                  <input
                    id="doctor-license"
                    className="doctor-input"
                    value={doctorForm.maChungChiHanhNghe}
                    onChange={(event) =>
                      setDoctorForm((prev) => ({
                        ...prev,
                        maChungChiHanhNghe: event.target.value,
                      }))
                    }
                    placeholder="Nhập số CCHN"
                  />
                </div>

                <div className="doctor-field">
                  <label className="doctor-label" htmlFor="doctor-type">
                    Loại hình bác sĩ
                  </label>
                  <input
                    id="doctor-type"
                    className="doctor-input"
                    value={doctorForm.loaiHinhBacSi}
                    onChange={(event) =>
                      setDoctorForm((prev) => ({
                        ...prev,
                        loaiHinhBacSi: event.target.value,
                      }))
                    }
                    placeholder="Ví dụ: Bác sĩ tư vấn"
                  />
                </div>

                <div className="doctor-field">
                  <label className="doctor-label" htmlFor="doctor-facility">
                    Tên cơ sở y tế
                  </label>
                  <input
                    id="doctor-facility"
                    className="doctor-input"
                    value={doctorForm.tenCoSoYTe}
                    onChange={(event) =>
                      setDoctorForm((prev) => ({
                        ...prev,
                        tenCoSoYTe: event.target.value,
                      }))
                    }
                    placeholder="Tên bệnh viện / phòng khám"
                  />
                </div>

                <div className="doctor-field">
                  <label className="doctor-label" htmlFor="doctor-address">
                    Địa chỉ làm việc
                  </label>
                  <input
                    id="doctor-address"
                    className="doctor-input"
                    value={doctorForm.diaChiLamViec}
                    onChange={(event) =>
                      setDoctorForm((prev) => ({
                        ...prev,
                        diaChiLamViec: event.target.value,
                      }))
                    }
                    placeholder="Địa chỉ cơ sở"
                  />
                </div>

                <div className="doctor-field doctor-field--full">
                  <label className="doctor-label" htmlFor="doctor-bio">
                    Mô tả bản thân
                  </label>
                  <textarea
                    id="doctor-bio"
                    className="doctor-input"
                    value={doctorForm.moTaBanThan}
                    onChange={(event) =>
                      setDoctorForm((prev) => ({
                        ...prev,
                        moTaBanThan: event.target.value,
                      }))
                    }
                    placeholder="Giới thiệu ngắn về kinh nghiệm, định hướng, thế mạnh..."
                    style={{ minHeight: 120 }}
                  />
                </div>
              </div>
            </DoctorPanel>

            <DoctorPanel
              title="Minh chứng"
              description="Thêm các giấy tờ minh chứng đi kèm hồ sơ."
              aside={
                <button
                  type="button"
                  className="doctor-button doctor-button--secondary"
                  onClick={addDocRow}
                >
                  + Thêm tài liệu
                </button>
              }
            >
              <div className="doctor-section-stack">
                {docs.map((doc) => (
                  <div key={doc.id} className="doctor-list-card">
                    <div className="doctor-list-card__header">
                      <div>
                        <h3 className="doctor-list-card__title">
                          {doc.title || "Tài liệu minh chứng"}
                        </h3>
                        <p className="doctor-list-card__subtitle">
                          Chọn tiêu đề và tệp để đính kèm.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="doctor-button doctor-button--danger"
                        onClick={() => removeDocRow(doc.id)}
                      >
                        Xóa
                      </button>
                    </div>

                    <div className="doctor-form-grid">
                      <div className="doctor-field">
                        <label className="doctor-label">
                          Tiêu đề minh chứng
                        </label>
                        <input
                          className="doctor-input"
                          value={doc.title}
                          onChange={(event) =>
                            setDocs((prev) =>
                              prev.map((item) =>
                                item.id === doc.id
                                  ? { ...item, title: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          placeholder="Ví dụ: Chứng chỉ hành nghề"
                        />
                      </div>
                      <div className="doctor-field">
                        <label className="doctor-label">Tệp đính kèm</label>
                        <input
                          className="doctor-input"
                          type="file"
                          onChange={(event) =>
                            setDocs((prev) =>
                              prev.map((item) =>
                                item.id === doc.id
                                  ? {
                                      ...item,
                                      file: event.target.files?.[0] ?? null,
                                    }
                                  : item,
                              ),
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="doctor-button-row" style={{ marginTop: 20 }}>
                <button
                  type="button"
                  className="doctor-button doctor-button--secondary"
                  onClick={() => {
                    setDoctorForm(getInitialDoctorForm(rawData));
                    setDocs([createDocUpload()]);
                  }}
                >
                  Làm mới biểu mẫu
                </button>
                <button
                  type="button"
                  className="doctor-button doctor-button--primary"
                  disabled={saveProfile.isPending}
                  onClick={() => saveProfile.mutate()}
                >
                  {saveProfile.isPending ? "Đang lưu..." : "Lưu cập nhật hồ sơ"}
                </button>
              </div>
            </DoctorPanel>
          </div>
        </>
      ) : null}
    </div>
  );
}
