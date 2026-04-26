import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { DoctorDocument } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { getApiErrorMessage } from '../../utils/errors'
import { DoctorEmptyState, DoctorNotice, DoctorPageHeading, DoctorPanel, DoctorStatCard } from './doctorUi'

type NoticeState = {
  tone: 'success' | 'danger'
  title: string
  description: string
} | null

export function DoctorDocumentsPage() {
  const qc = useQueryClient()
  const { session } = useAuth()
  const maBacSi = session?.maBacSi ?? null

  const [tieuDe, setTieuDe] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [notice, setNotice] = useState<NoticeState>(null)

  const query = useQuery({
    queryKey: ['doctor-documents', maBacSi],
    queryFn: async () => (await api.get<DoctorDocument[]>(`/api/doctors/${maBacSi}/documents`)).data,
    enabled: !!maBacSi,
  })

  const documents = query.data ?? []

  const upload = useMutation({
    mutationFn: async () => {
      if (!maBacSi) throw new Error('Thiếu mã bác sĩ')
      if (!file) throw new Error('Vui lòng chọn tài liệu cần tải lên')

      const form = new FormData()
      form.append('tieuDeTaiLieu', tieuDe.trim() || file.name)
      form.append('file', file)

      const res = await api.post(`/api/doctors/${maBacSi}/documents`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data
    },
    onSuccess: async () => {
      setTieuDe('')
      setFile(null)
      setNotice({
        tone: 'success',
        title: 'Tải tài liệu thành công',
        description: 'Tài liệu mới đã được thêm vào hồ sơ minh chứng của bác sĩ.',
      })
      await qc.invalidateQueries({ queryKey: ['doctor-documents', maBacSi] })
    },
    onError: (err) =>
      setNotice({
        tone: 'danger',
        title: 'Không thể tải tài liệu',
        description: getApiErrorMessage(err),
      }),
  })

  const del = useMutation({
    mutationFn: async (maTaiLieu: number) => {
      if (!maBacSi) throw new Error('Thiếu mã bác sĩ')
      await api.delete(`/api/doctors/${maBacSi}/documents/${maTaiLieu}`)
    },
    onSuccess: async () => {
      setNotice({
        tone: 'success',
        title: 'Đã xóa tài liệu',
        description: 'Danh mục minh chứng đã được cập nhật.',
      })
      await qc.invalidateQueries({ queryKey: ['doctor-documents', maBacSi] })
    },
    onError: (err) =>
      setNotice({
        tone: 'danger',
        title: 'Không thể xóa tài liệu',
        description: getApiErrorMessage(err),
      }),
  })

  return (
    <div className="doctor-page">
      <DoctorPageHeading
        eyebrow="Verification documents"
        title="Quản lý minh chứng bác sĩ"
        description="Lưu trữ tài liệu hành nghề trong một giao diện sáng, gọn và dễ tra cứu để hỗ trợ xác minh hồ sơ nhanh hơn."
      />

      {!maBacSi ? (
        <DoctorNotice
          tone="danger"
          title="Thiếu liên kết hồ sơ bác sĩ"
          description="Phiên đăng nhập hiện chưa có mã bác sĩ. Hãy đăng nhập lại rồi thử tiếp tục."
        />
      ) : null}

      {notice ? <DoctorNotice tone={notice.tone} title={notice.title} description={notice.description} /> : null}

      <section className="doctor-metrics-grid">
        <DoctorStatCard label="Tổng tài liệu" value={String(documents.length)} hint="Số lượng tài liệu đang liên kết với hồ sơ bác sĩ." />
        <DoctorStatCard
          label="Tệp đang chọn"
          value={file ? '1 tài liệu' : 'Chưa chọn'}
          hint={file ? file.name : 'Chọn đúng tệp trước khi tải lên để tránh thiếu minh chứng.'}
        />
        <DoctorStatCard
          label="Tiêu đề hiển thị"
          value={tieuDe.trim() || 'Dùng tên tệp'}
          hint="Bạn có thể đặt tiêu đề riêng để dễ nhận biết khi xem lại."
        />
        <DoctorStatCard
          label="Mục tiêu"
          value="Hồ sơ rõ ràng"
          hint="Ưu tiên đặt tên tài liệu ngắn gọn, chính xác và thống nhất."
        />
      </section>

      <div className="doctor-schedule-grid">
        <DoctorPanel
          title="Tải tài liệu mới"
          description="Hỗ trợ bổ sung các giấy tờ chuyên môn, chứng chỉ hoặc minh chứng cần thiết cho quá trình kiểm duyệt."
        >
          <div className="doctor-form-grid">
            <div className="doctor-field">
              <label className="doctor-label" htmlFor="document-title">
                Tiêu đề tài liệu
              </label>
              <input
                id="document-title"
                className="doctor-input"
                value={tieuDe}
                onChange={(event) => setTieuDe(event.target.value)}
                placeholder="Ví dụ: Chứng chỉ hành nghề"
              />
            </div>

            <div className="doctor-field">
              <span className="doctor-label">Chọn tệp tải lên</span>
              <label className="doctor-file-picker">
                <div>
                  <div className="doctor-file-picker__title">Chọn tệp từ thiết bị</div>
                  <div className="doctor-file-picker__meta">Ưu tiên tài liệu rõ nét, đúng nội dung và dễ đối chiếu.</div>
                </div>
                <div className="doctor-file-picker__meta">{file ? file.name : 'Chưa có tệp nào được chọn'}</div>
                <input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
              </label>
            </div>
          </div>

          <div className="doctor-button-row">
            <button className="doctor-button doctor-button--primary" type="button" disabled={upload.isPending || !maBacSi} onClick={() => upload.mutate()}>
              {upload.isPending ? 'Đang tải lên...' : 'Tải tài liệu'}
            </button>
            <button
              className="doctor-button doctor-button--secondary"
              type="button"
              onClick={() => {
                setTieuDe('')
                setFile(null)
                setNotice(null)
              }}
            >
              Làm mới biểu mẫu
            </button>
          </div>
        </DoctorPanel>

        <DoctorPanel title="Gợi ý chuẩn hóa hồ sơ" description="Cách sắp xếp minh chứng để đội duyệt hồ sơ đọc nhanh và ít phải yêu cầu bổ sung hơn.">
          <div className="doctor-section-stack">
            <div className="doctor-note-card">
              <p className="doctor-note">
                Dùng tiêu đề rõ ràng theo nhóm tài liệu, ví dụ: Chứng chỉ hành nghề, Căn cước công dân, Bằng chuyên môn.
              </p>
            </div>
            <div className="doctor-note-card">
              <p className="doctor-note">
                Kiểm tra chất lượng ảnh quét hoặc ảnh chụp trước khi tải lên, tránh bị cắt góc hoặc mờ thông tin quan trọng.
              </p>
            </div>
            <div className="doctor-note-card">
              <p className="doctor-note">
                Nếu hồ sơ đang chờ duyệt hoặc bị trả lại, hãy cập nhật đúng nhóm tài liệu còn thiếu trước khi gửi lại.
              </p>
            </div>
          </div>
        </DoctorPanel>
      </div>

      <DoctorPanel
        title="Danh sách tài liệu đã tải"
        description="Theo dõi nhanh toàn bộ minh chứng đang liên kết với hồ sơ bác sĩ."
        aside={<span className="doctor-count-bubble">{documents.length}</span>}
      >
        {query.isLoading ? (
          <DoctorNotice
            tone="info"
            title="Đang tải danh sách tài liệu"
            description="Vui lòng chờ trong giây lát để hệ thống đồng bộ hồ sơ minh chứng."
          />
        ) : null}

        {query.isError ? (
          <DoctorNotice tone="danger" title="Không thể tải danh mục tài liệu" description={getApiErrorMessage(query.error)} />
        ) : null}

        {!query.isLoading && !query.isError && documents.length === 0 ? (
          <DoctorEmptyState
            title="Chưa có minh chứng nào"
            description="Bạn có thể tải tài liệu đầu tiên ngay từ biểu mẫu phía trên để bắt đầu hoàn thiện hồ sơ bác sĩ."
          />
        ) : null}

        {documents.length > 0 ? (
          <div className="doctor-list">
            {documents.map((document, index) => (
              <article key={document.maTaiLieu} className="doctor-list-card">
                <div className="doctor-list-card__header">
                  <div>
                    <h3 className="doctor-list-card__title">{document.tieuDeTaiLieu}</h3>
                    <p className="doctor-list-card__subtitle">Tài liệu số {String(index + 1).padStart(2, '0')} trong hồ sơ minh chứng.</p>
                  </div>
                  <span className="doctor-chip">Mã tài liệu #{document.maTaiLieu}</span>
                </div>

                <div className="doctor-inline-text">{document.duongDanFileUrl}</div>

                <div className="doctor-list-card__footer">
                  <a className="doctor-button doctor-button--secondary doctor-button-link" href={document.duongDanFileUrl} target="_blank" rel="noreferrer">
                    Mở tài liệu
                  </a>
                  <button className="doctor-button doctor-button--danger" type="button" disabled={del.isPending} onClick={() => del.mutate(document.maTaiLieu)}>
                    {del.isPending ? 'Đang xử lý...' : 'Xóa tài liệu'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </DoctorPanel>
    </div>
  )
}
