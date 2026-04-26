import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { DoctorDocument } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { PageHeader } from '../../components/PageHeader'
import { getApiErrorMessage } from '../../utils/errors'

export function DoctorDocumentsPage() {
  const qc = useQueryClient()
  const { session } = useAuth()
  const maBacSi = session?.maBacSi ?? null

  const [tieuDe, setTieuDe] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['doctor-documents', maBacSi],
    queryFn: async () => (await api.get<DoctorDocument[]>(`/api/doctors/${maBacSi}/documents`)).data,
    enabled: !!maBacSi,
  })

  const upload = useMutation({
    mutationFn: async () => {
      if (!maBacSi) throw new Error('Thiếu maBacSi')
      if (!file) throw new Error('Vui lòng chọn file')
      const form = new FormData()
      form.append('tieuDeTaiLieu', tieuDe.trim() || file.name)
      form.append('file', file)
      const res = await api.post(`/api/doctors/${maBacSi}/documents`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data
    },
    onSuccess: async () => {
      setError(null)
      setTieuDe('')
      setFile(null)
      await qc.invalidateQueries({ queryKey: ['doctor-documents', maBacSi] })
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  const del = useMutation({
    mutationFn: async (maTaiLieu: number) => {
      if (!maBacSi) throw new Error('Thiếu maBacSi')
      await api.delete(`/api/doctors/${maBacSi}/documents/${maTaiLieu}`)
    },
    onSuccess: async () => {
      setError(null)
      await qc.invalidateQueries({ queryKey: ['doctor-documents', maBacSi] })
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  return (
    <>
      <PageHeader title="Minh chứng bác sĩ" />

      {!maBacSi ? <div className="card">Thiếu maBacSi. Hãy đăng nhập lại.</div> : null}

      <div className="card stack">
        <div className="title">Upload</div>
        <div className="grid">
          <div className="stack">
            <div className="label">Tiêu đề</div>
            <input className="input" value={tieuDe} onChange={(e) => setTieuDe(e.target.value)} placeholder="VD: CCCD" />
          </div>
          <div className="stack">
            <div className="label">File</div>
            <input className="input" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <div className="stack">
            <div className="label">Hành động</div>
            <button className="btn btn-primary" type="button" disabled={upload.isPending} onClick={() => upload.mutate()}>
              {upload.isPending ? 'Đang upload…' : 'Upload'}
            </button>
          </div>
        </div>

        {error ? <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)' }}>{error}</div> : null}
      </div>

      <div style={{ height: 12 }} />

      <div className="card stack">
        <div className="title">Danh sách tài liệu</div>
        {query.isLoading ? <div className="muted">Đang tải…</div> : null}
        {query.isError ? (
          <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)' }}>
            {getApiErrorMessage(query.error)}
          </div>
        ) : null}

        {(query.data || []).length === 0 ? <div className="muted">Chưa có tài liệu.</div> : null}
        <div className="stack">
          {(query.data || []).map((d) => (
            <div key={d.maTaiLieu} className="card row-between">
              <div className="stack" style={{ gap: 4 }}>
                <div style={{ fontWeight: 900 }}>{d.tieuDeTaiLieu}</div>
                <a className="muted" href={d.duongDanFileUrl} target="_blank" rel="noreferrer">
                  Mở file
                </a>
              </div>
              <button className="btn btn-danger" type="button" disabled={del.isPending} onClick={() => del.mutate(d.maTaiLieu)}>
                Xóa
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

