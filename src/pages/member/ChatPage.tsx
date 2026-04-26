import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/http'
import type { Message } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { PageHeader } from '../../components/PageHeader'
import { getApiErrorMessage } from '../../utils/errors'

function normalizeTime(value: string): string {
  if (!value) return ''
  // LocalDateTime: 2026-04-26T10:20:30
  const parts = value.split('T')
  if (parts.length !== 2) return value
  return parts[1].slice(0, 5)
}

export function ChatPage() {
  const params = useParams()
  const qc = useQueryClient()
  const { session } = useAuth()

  const role = (session?.vaiTro || '').toUpperCase()
  const isDoctor = role === 'BAC_SI'
  const base = isDoctor ? '/doctor' : '/app'

  const maCuocHoiThoai = Number(params.maCuocHoiThoai)
  const [noiDung, setNoiDung] = useState('')
  const [error, setError] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['messages', maCuocHoiThoai],
    queryFn: async () =>
      (await api.get<Message[]>(`/api/conversations/${maCuocHoiThoai}/messages`, { params: { limit: 80 } })).data,
    enabled: Number.isFinite(maCuocHoiThoai) && maCuocHoiThoai > 0,
    refetchInterval: 5000,
  })

  const messages = useMemo(() => {
    const list = query.data || []
    return [...list].sort((a, b) => (a.thoiGianGui || '').localeCompare(b.thoiGianGui || ''))
  }, [query.data])

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!session?.maTaiKhoan) throw new Error('Thiếu maTaiKhoan')
      const text = noiDung.trim()
      if (!text) throw new Error('Vui lòng nhập nội dung')
      const res = await api.post<Message>(`/api/conversations/${maCuocHoiThoai}/messages`, {
        maTaiKhoanGui: session.maTaiKhoan,
        noiDungTinNhan: text,
        loaiNoiDung: 'TEXT',
      })
      return res.data
    },
    onSuccess: async () => {
      setNoiDung('')
      await qc.invalidateQueries({ queryKey: ['messages', maCuocHoiThoai] })
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  useEffect(() => {
    setError(null)
  }, [maCuocHoiThoai])

  if (!Number.isFinite(maCuocHoiThoai) || maCuocHoiThoai <= 0) {
    return (
      <>
        <PageHeader title="Chat" />
        <div className="card">URL không hợp lệ.</div>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Chat" right={<Link to={`${base}/messages`}>Danh sách</Link>} />

      {query.isLoading ? <div className="muted">Đang tải…</div> : null}
      {query.isError ? (
        <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)' }}>
          {getApiErrorMessage(query.error)}
        </div>
      ) : null}

      <div className="card stack">
        {messages.length === 0 ? <div className="muted">Chưa có tin nhắn.</div> : null}
        {messages.map((m) => {
          const mine = m.maTaiKhoanGui === session?.maTaiKhoan
          return (
            <div
              key={m.maTinNhan}
              className="card"
              style={{
                background: mine ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.06)',
              }}
            >
              <div className="row-between">
                <span className="chip">{mine ? 'Bạn' : `TK ${m.maTaiKhoanGui}`}</span>
                <span className="muted">{normalizeTime(m.thoiGianGui)}</span>
              </div>
              <div style={{ marginTop: 6 }}>{m.noiDungTinNhan}</div>
            </div>
          )
        })}

        {error ? <div className="card" style={{ borderColor: 'rgba(239,68,68,0.6)' }}>{error}</div> : null}

        <div className="row" style={{ alignItems: 'stretch' }}>
          <input
            className="input"
            value={noiDung}
            onChange={(e) => setNoiDung(e.target.value)}
            placeholder="Nhập tin nhắn…"
          />
          <button className="btn btn-primary" type="button" disabled={sendMutation.isPending} onClick={() => sendMutation.mutate()}>
            Gửi
          </button>
        </div>
      </div>
    </>
  )
}

