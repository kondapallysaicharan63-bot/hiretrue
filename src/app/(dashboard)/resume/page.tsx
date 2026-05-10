'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function ResumePage() {
  const [skills, setSkills] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('uploading');
    setError('');

    const form = new FormData();
    form.append('resume', file);

    try {
      const res = await fetch('/api/resume/upload', { method: 'POST', body: form });
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || 'Upload failed');
        setStatus('error');
        return;
      }

      setSkills(data.skills ?? []);
      setStatus('success');
    } catch {
      setError('Network error — please try again');
      setStatus('error');
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">My Resume</h1>

      <Card>
        <CardHeader>
          <CardTitle>Upload Resume</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload your resume as PDF (max 5MB). Claude will extract your skills automatically.
          </p>

          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            {status === 'uploading' ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Extracting skills with AI…</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Click to upload PDF</p>
                <p className="text-xs text-muted-foreground">PDF only · max 5MB</p>
              </div>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            className="hidden"
            data-testid="resume-upload"
            onChange={handleUpload}
            disabled={status === 'uploading'}
          />

          {status === 'error' && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle className="h-4 w-4" />
                Resume uploaded successfully!
              </div>
              {skills.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Extracted Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <Button
            onClick={() => fileRef.current?.click()}
            disabled={status === 'uploading'}
            className="w-full"
          >
            {status === 'uploading' ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading…</>
            ) : (
              <><Upload className="h-4 w-4 mr-2" /> Upload Resume</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
