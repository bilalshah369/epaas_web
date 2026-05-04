import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { COLORS } from '@/utils/colors';
import { uploadFile } from '@/services/application.service';

interface Props {
  value?:         string;   // storedName (uuid-prefixed) or plain filename
  onChange?:      (storedName: string) => void;
  accept?:        string;
  applicationId?: string;   // when provided, file is uploaded immediately on select
  fieldName?:     string;   // required when applicationId is set
}

// Strip uuid prefix to get a readable display name
function displayName(val: string): string {
  return val.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i, '');
}

export default function UploadBox({
  value, onChange, accept = '.pdf,.jpg,.jpeg,.png',
  applicationId, fieldName,
}: Props) {
  const inputRef  = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (applicationId && fieldName) {
      setUploading(true);
      try {
        const storedName = await uploadFile(file, applicationId, fieldName);
        onChange?.(storedName);
      } catch {
        toast.error('Upload failed — please try again');
      } finally {
        setUploading(false);
        // Reset input so same file can be re-selected if needed
        if (inputRef.current) inputRef.current.value = '';
      }
    } else {
      // No applicationId yet — store plain filename (draft not created yet)
      onChange?.(file.name);
    }
  }

  const label = value ? displayName(value) : null;

  return (
    <div
      onClick={() => !uploading && inputRef.current?.click()}
      style={{
        border:       `2px dashed ${uploading ? COLORS.textMuted : COLORS.primary}`,
        borderRadius: 8,
        padding:      '16px 20px',
        textAlign:    'center',
        cursor:       uploading ? 'wait' : 'pointer',
        background:   COLORS.primaryLight,
        transition:   'opacity 0.15s',
        opacity:      uploading ? 0.7 : 1,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={handleChange}
      />

      {uploading ? (
        <>
          <div style={{ fontSize: 18, marginBottom: 4 }}>⏳</div>
          <div style={{ fontSize: 11, color: COLORS.primary, fontWeight: 600 }}>Uploading…</div>
        </>
      ) : label ? (
        <>
          <div style={{ fontSize: 18, marginBottom: 4 }}>📎</div>
          <div style={{ fontSize: 11, color: COLORS.primary, fontWeight: 600 }}>{label}</div>
          <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>Click to replace</div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 18, marginBottom: 4 }}>⬆️</div>
          <div style={{ fontSize: 11, color: COLORS.primary, fontWeight: 600 }}>UPLOAD FILE</div>
          <div style={{ fontSize: 10, color: COLORS.textMuted }}>PDF / JPG / PNG, max 100 MB</div>
        </>
      )}
    </div>
  );
}

import type React from 'react';
