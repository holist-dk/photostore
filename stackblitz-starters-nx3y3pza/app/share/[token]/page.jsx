'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase'

export default function SharePage() {
  const { token } = useParams();
  const [state, setState] = useState('loading');
  const [shareLink, setShareLink] = useState(null);
  const [album, setAlbum] = useState(null);
  const [files, setFiles] = useState([]);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    loadShare();
  }, [token]);

  const loadShare = async () => {
    const { data: link } = await supabase
      .from('share_links')
      .select('*, albums(*)')
      .eq('token', token)
      .single();
    if (!link) {
      setState('error');
      return;
    }
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      setState('error');
      return;
    }
    setShareLink(link);
    setAlbum(link.albums);
    if (link.password_hash || link.albums.password_hash) {
      setState('password');
    } else {
      await loadFiles(link.album_id);
      setState('gallery');
    }
  };

  const loadFiles = async (albumId) => {
    const { data } = await supabase
      .from('files')
      .select('*')
      .eq('album_id', albumId)
      .order('created_at', { ascending: false });
    setFiles(data || []);
  };

  const checkPassword = async () => {
    const stored = shareLink?.password_hash || album?.password_hash;
    if (password === stored) {
      await loadFiles(shareLink.album_id);
      setState('gallery');
    } else setPasswordError('Incorrect password');
  };

  const getUrl = (path) =>
    supabase.storage.from('media').getPublicUrl(path).data.publicUrl;

  const downloadFile = async (file) => {
    const { data } = await supabase.storage
      .from('media')
      .download(file.file_path);
    if (data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const isImage = (type) => type?.startsWith('image/');
  const isVideo = (type) => type?.startsWith('video/');

  if (state === 'loading')
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ color: '#555' }}>Loading...</p>
      </div>
    );

  if (state === 'error')
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ fontSize: '48px' }}>🔗</div>
        <h1 style={{ fontSize: '20px', fontWeight: '600' }}>Link not found</h1>
        <p style={{ color: '#555', fontSize: '14px' }}>
          This share link is invalid or has expired.
        </p>
      </div>
    );

  if (state === 'password')
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '360px',
            background: '#111',
            border: '1px solid #222',
            borderRadius: '16px',
            padding: '28px',
          }}
        >
          <div
            style={{
              fontSize: '32px',
              textAlign: 'center',
              marginBottom: '16px',
            }}
          >
            🔒
          </div>
          <h1
            style={{
              fontSize: '18px',
              fontWeight: '600',
              textAlign: 'center',
              marginBottom: '6px',
            }}
          >
            {album?.name}
          </h1>
          <p
            style={{
              color: '#555',
              fontSize: '14px',
              textAlign: 'center',
              marginBottom: '24px',
            }}
          >
            Enter the password to view this gallery
          </p>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && checkPassword()}
          />
          {passwordError && (
            <p style={{ color: '#f87171', fontSize: '13px', marginTop: '8px' }}>
              {passwordError}
            </p>
          )}
          <button
            onClick={checkPassword}
            style={{
              width: '100%',
              marginTop: '14px',
              background: '#f0f0f0',
              color: '#0a0a0a',
              padding: '12px',
              fontWeight: '600',
              borderRadius: '10px',
            }}
          >
            View gallery
          </button>
        </div>
      </div>
    );

  return (
    <div style={{ minHeight: '100vh' }}>
      <div
        style={{
          borderBottom: '1px solid #1a1a1a',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <span style={{ fontSize: '18px', fontWeight: '600' }}>
            📷 {album?.name}
          </span>
          {album?.description && (
            <p style={{ color: '#555', fontSize: '13px', marginTop: '2px' }}>
              {album.description}
            </p>
          )}
        </div>
        <span style={{ fontSize: '13px', color: '#444' }}>
          {files.length} files
        </span>
      </div>

      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            {isImage(selected.file_type) ? (
              <img
                src={getUrl(selected.file_path)}
                alt={selected.file_name}
                style={{
                  maxWidth: '90vw',
                  maxHeight: '72vh',
                  objectFit: 'contain',
                  borderRadius: '8px',
                }}
              />
            ) : isVideo(selected.file_type) ? (
              <video
                src={getUrl(selected.file_path)}
                controls
                style={{ maxWidth: '90vw', maxHeight: '72vh' }}
              />
            ) : (
              <div
                style={{
                  background: '#111',
                  borderRadius: '12px',
                  padding: '40px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📄</div>
                <p style={{ color: '#aaa' }}>{selected.file_name}</p>
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => downloadFile(selected)}
                style={{
                  background: '#1a1a1a',
                  color: '#f0f0f0',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              >
                ⬇ Download
              </button>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: '#1a1a1a',
                  color: '#888',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px 24px' }}
      >
        {files.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ color: '#555' }}>No files in this album yet</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '12px',
            }}
          >
            {files.map((file) => (
              <div
                key={file.id}
                onClick={() => setSelected(file)}
                style={{
                  background: '#111',
                  border: '1px solid #1e1e1e',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = '#333')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = '#1e1e1e')
                }
              >
                <div
                  style={{
                    height: '140px',
                    background: '#161616',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {isImage(file.file_type) ? (
                    <img
                      src={getUrl(file.file_path)}
                      alt={file.file_name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : isVideo(file.file_type) ? (
                    <span style={{ fontSize: '36px' }}>🎬</span>
                  ) : (
                    <span style={{ fontSize: '36px' }}>📄</span>
                  )}
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <p
                    style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {file.file_name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
