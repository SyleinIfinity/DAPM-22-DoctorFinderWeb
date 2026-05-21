import React from 'react'

export function PageHeader({
  title,
  right,
}: {
  title: React.ReactNode
  right?: React.ReactNode
}) {
  return (
    <div className="row-between" style={{ padding: '8px 0 14px 0' }}>
      <div className="title">{title}</div>
      {right ? <div className="row">{right}</div> : null}
    </div>
  )
}

