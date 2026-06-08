'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'

export default function AlbumPage() {
  const router = useRouter()
  const { id } = useParams()
  const [album, setAlbum] = useState(null)
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selected, setSelected] = useState(null)
  const [showShare, setShowShare] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const fileRef = useRef()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      loadAlbum(); loadFiles()
    })
  }, [id])

  const loadAlbum = async () => {
    const { data } = await supabase.from('albums').select('*').eq('id', id).single()
    setAlbum(data)
  }

  const loadFiles = async () => {
    const { data } = await supabase.from('files').select('*').eq('album_id', id).order('created_at', { ascending: false })
    setFiles(data || [])
    setLoading(false)
  }

  const handleUpload = async (e) => {
    const uploadFiles = Array.from(e.target.files)
    if (!uploadFiles.length) return
    setUploading(true); setUploadProgress(0)
    for (let i = 0; i < uploadFiles.length; i++) {
      const file = uploadFiles[i]
      const ext = file.name.split('.').pop()
      const path = `${id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error: storageError } = await supabase.storage.from('media').upload(path, file)
      if (!storageError) {
        await supabase.from('files').insert({ album_id: id, file_name: file.name, file_path: path, file_type: file.type, size: file.size })
      }
      setUploadProgress(Math.round(((i + 1) / uploadFiles.length) * 100))
    }
    setUploading(false); setUploadProgress(0)
    loadFiles()
    fileRef.current.value = ''
  }

  const getUrl = (path) => supabase.storage.from('media').getPublicUrl(path).data.publicUrl

  const downloadFile = async (file) => {
    const { data } = await supabase.storage.from('media').download(file.file_path)
    if (data) {
      const url = URL.createObjectURL(data)
      const a = document.createElement('a'); a.href = url; a.download = file.file_name; a.click()
      URL.revokeObjectURL(url)
    }
  }

  const deleteFile = async (file) => {
    if (!confirm('Delete this file?')) return
    await supabase.storage.from('media').remove([file.file_path])
    await supabase.from('files').delete().eq('id', file.id)
    setSelected(null); loadFiles()
  }

  const generateShareLink = async () => {
    const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
    await supabase.from('share_links').insert({ album_id: id, token })
    setShareLink(`${window.location.origin}/share/${token}`)
    setShowShare(true)
  }

  const isImage = (type) => type?.startsWith('image/')
  const isVideo = (type) => type?.startsWith('video/')
  const formatSize = (bytes) => bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)}MB` : `${(bytes / 1024).toFixed(0)}KB`

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ borderBottom: '1px solid #1a1a1a', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#0a0a0a', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link href="/dashboard" style={{ color: '#555', fontSize: '13px' }}>← Albums</Link>
          <span style={{ color: '#222' }}>|</span>
          <span style={{ fontWeight: '500' }}>{album?.name || '...'}</span>
          {album?.password_hash && <span>🔒</span>}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={generateShareLink} style={{ background: '#1a1a1a', color: '#aaa', padding: '8px 14px', borderRadius: '8px', fontSize: '13px' }}>🔗 Share</button>
          <button onClick={() => fileRef.current.click()} disabled={uploading} style={{ background: '#f0f0f0', color: '#0a0a0a', padding: '8px 16px', fontWeight: '600', borderRadius: '8px', fontSize: '13px' }}>
            {uploading ? `Uploading ${uploadProgress}%` : '+ Upload'}
          </button>
          <input ref={fileRef} type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx" onChange={handleUpload} style={{ display: 'none' }} />
        </div>
      </div>

      {showShare && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#111', border: '1px solid #222', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '440px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Share link created</h2>
            <div style={{ background: '#1a1a1a', borderRadius: '8px', padding: '12px', wordBreak: 'break-all', fontSize: '13px', color: '#aaa', marginBottom: '16px' }}>{shareLink}</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { navigator.clipboard.writeText(shareLink); alert('Copied!') }} style={{ flex: 2, background: '#f0f0f0', color: '#0a0a0a', padding: '11px', fontWeight: '600' }}>Copy link</button>
              <button onClick={() => setShowShare(false)} style={{ flex: 1, background: '#1a1a1a', color: '#aaa', padding: '11px' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            {isImage(selected.file_type) ? (
              <img src={getUrl(selected.file_path)} alt={selected.file_name} style={{ maxWidth: '90vw', maxHeight: '70vh', objectFit: 'contain', borderRadius: '8px' }} />
            ) : isVideo(selected.file_type) ? (
              <video src={getUrl(selected.file_path)} controls style={{ maxWidth: '90vw', maxHeight: '70vh' }} />
            ) : (
              <div style={{ background: '#111', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📄</div>
                <p style={{ color: '#aaa' }}>{selected.file_name}</p>
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => downloadFile(selected)} style={{ background: '#1a1a1a', color: '#f0f0f0', padding: '10px 20px', borderRadius: '8px', fontSize: '13px' }}>⬇ Download original</button>
              <button onClick={() => deleteFile(selected)} style={{ background: '#1a1a1a', color: '#f87171', padding: '10px 20px', borderRadius: '8px', fontSize: '13px' }}>🗑 Delete</button>
              <button onClick={() => setSelected(null)} style={{ background: '#1a1a1a', color: '#888', padding: '10px 20px', borderRadius: '8px', fontSize: '13px' }}>✕ Close</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px 24px' }}>
        <div onClick={() => fileRef.current.click()}
          style={{ border: '1px dashed #2a2a2a', borderRadius: '12px', padding: '28px', textAlign: 'center', cursor: 'pointer', marginBottom: '28px' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#444'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#2a2a2a'}
          onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#666' }}
          onDragLeave={e => e.currentTarget.style.borderColor = '#2a2a2a'}
          onDrop={e => { e.preventDefault(); const dt = new DataTransfer(); Array.from(e.dataTransfer.files).forEach(f => dt.items.add(f)); fileRef.current.files = dt.files; handleUpload({ target: fileRef.current }) }}>
          {uploading ? (
            <div>
              <div style={{ background: '#1a1a1a', borderRadius: '6px', height: '6px', width: '200px', margin: '0 auto 12px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#f0f0f0', width: `${uploadProgress}%`, transition: 'width 0.3s' }} />
              </div>
              <p style={{ color: '#555', fontSize: '14px' }}>Uploading... {uploadProgress}%</p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>☁️</div>
              <p style={{ color: '#555', fontSize: '14px' }}>Drag & drop files here or <span style={{ color: '#aaa', textDecoration: 'underline' }}>click to browse</span></p>
              <p style={{ color: '#333', fontSize: '12px', marginTop: '6px' }}>Photos, videos, documents — up to 50MB each</p>
            </>
          )}
        </div>

        {loading ? (
          <p style={{ color: '#555', textAlign: 'center', padding: '40px 0' }}>Loading files...</p>
        ) : files.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
            <p style={{ color: '#555' }}>No files yet — upload something!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
            {files.map(file => (
              <div key={file.id} onClick={() => setSelected(file)}
                style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#333'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#1e1e1e'}>
                <div style={{ height: '140px', background: '#161616', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {isImage(file.file_type) ? (
                    <img src={getUrl(file.file_path)} alt={file.file_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : isVideo(file.file_type) ? <span style={{ fontSize: '36px' }}>🎬</span> : <span style={{ fontSize: '36px' }}>📄</span>}
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.file_name}</p>
                  <p style={{ fontSize: '11px', color: '#444', marginTop: '2px' }}>{formatSize(file.size)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}