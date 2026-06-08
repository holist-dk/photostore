'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function Dashboard() {
  const router = useRouter()
  const [albums, setAlbums] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [creating, setCreating] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setUser(session.user)
      loadAlbums()
    })
  }, [])

  const loadAlbums = async () => {
    const { data, error } = await supabase.from('albums').select('*, files(count)').order('created_at', { ascending: false })
    if (!error) setAlbums(data || [])
    setLoading(false)
  }

  const createAlbum = async () => {
    if (!newName.trim()) return
    setCreating(true)
    const { error } = await supabase.from('albums').insert({
      name: newName.trim(),
      description: newDesc.trim() || null,
      password_hash: newPassword.trim() || null,
      is_public: isPublic
    })
    if (!error) {
      setShowCreate(false)
      setNewName(''); setNewDesc(''); setNewPassword(''); setIsPublic(false)
      loadAlbums()
    }
    setCreating(false)
  }

  const deleteAlbum = async (id) => {
    if (!confirm('Delete this album and all its files?')) return
    await supabase.from('albums').delete().eq('id', id)
    loadAlbums()
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ borderBottom: '1px solid #1a1a1a', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#0a0a0a', zIndex: 10 }}>
        <span style={{ fontSize: '20px', fontWeight: '600' }}>📷 PhotoStore</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: '#555' }}>{user?.email}</span>
          <button onClick={signOut} style={{ background: '#1a1a1a', color: '#888', padding: '8px 14px', borderRadius: '8px', fontSize: '13px' }}>Sign out</button>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '600', letterSpacing: '-0.5px' }}>Albums</h1>
            <p style={{ color: '#555', fontSize: '14px', marginTop: '4px' }}>{albums.length} album{albums.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => setShowCreate(true)} style={{ background: '#f0f0f0', color: '#0a0a0a', padding: '10px 18px', fontWeight: '600', borderRadius: '10px' }}>+ New album</button>
        </div>

        {showCreate && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
            <div style={{ background: '#111', border: '1px solid #222', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '420px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Create album</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input placeholder="Album name *" value={newName} onChange={e => setNewName(e.target.value)} />
                <input placeholder="Description (optional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
                <input placeholder="Password to protect (optional)" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#aaa', cursor: 'pointer' }}>
                  <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} style={{ width: 'auto' }} />
                  Make publicly accessible
                </label>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button onClick={() => setShowCreate(false)} style={{ flex: 1, background: '#1a1a1a', color: '#aaa', padding: '11px' }}>Cancel</button>
                <button onClick={createAlbum} disabled={creating || !newName.trim()} style={{ flex: 2, background: '#f0f0f0', color: '#0a0a0a', padding: '11px', fontWeight: '600' }}>
                  {creating ? 'Creating...' : 'Create album'}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <p style={{ color: '#555', textAlign: 'center', padding: '60px 0' }}>Loading albums...</p>
        ) : albums.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗂️</div>
            <p style={{ color: '#555', fontSize: '16px' }}>No albums yet</p>
            <p style={{ color: '#333', fontSize: '14px', marginTop: '6px' }}>Create your first album to get started</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {albums.map(album => (
              <div key={album.id} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '14px', overflow: 'hidden' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#333'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#1e1e1e'}>
                <Link href={`/album/${album.id}`}>
                  <div style={{ height: '140px', background: '#161616', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>🖼️</div>
                  <div style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '500', fontSize: '15px' }}>{album.name}</span>
                      {album.password_hash && <span style={{ fontSize: '11px' }}>🔒</span>}
                      {album.is_public && <span style={{ fontSize: '10px', background: '#1a3a1a', color: '#4ade80', padding: '2px 6px', borderRadius: '4px' }}>public</span>}
                    </div>
                    {album.description && <p style={{ fontSize: '13px', color: '#555', marginBottom: '6px' }}>{album.description}</p>}
                    <p style={{ fontSize: '12px', color: '#444' }}>{album.files?.[0]?.count || 0} files</p>
                  </div>
                </Link>
                <div style={{ padding: '0 14px 14px', display: 'flex', gap: '8px' }}>
                  <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/share/${album.id}`); alert('Share link copied!') }}
                    style={{ flex: 1, background: '#1a1a1a', color: '#888', padding: '7px', fontSize: '12px', borderRadius: '6px' }}>Share</button>
                  <button onClick={() => deleteAlbum(album.id)} style={{ background: '#1a1a1a', color: '#f87171', padding: '7px 10px', fontSize: '12px', borderRadius: '6px' }}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}