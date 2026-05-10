'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, AlertTriangle } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';

const VISA_OPTIONS = [
  { value: 'f1', label: 'F-1 Student' },
  { value: 'h1b', label: 'H-1B' },
  { value: 'gc', label: 'Green Card' },
  { value: 'citizen', label: 'US Citizen' },
  { value: 'other', label: 'Other' },
];

interface ProfileData {
  name: string;
  visa_status: string;
  opt_end_date: string;
  target_roles: string;
  target_locations: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    visa_status: '',
    opt_end_date: '',
    target_roles: '',
    target_locations: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => {
        setProfile({
          name: data.name ?? '',
          visa_status: data.visa_status ?? '',
          opt_end_date: data.opt_end_date ? format(new Date(data.opt_end_date), 'yyyy-MM-dd') : '',
          target_roles: (data.target_roles ?? []).join(', '),
          target_locations: (data.target_locations ?? []).join(', '),
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const optDaysLeft = profile.visa_status === 'f1' && profile.opt_end_date
    ? differenceInDays(new Date(profile.opt_end_date), new Date())
    : null;

  async function handleSave() {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const body = {
        name: profile.name,
        visa_status: profile.visa_status,
        opt_end_date: profile.opt_end_date || null,
        target_roles: profile.target_roles.split(',').map((s) => s.trim()).filter(Boolean),
        target_locations: profile.target_locations.split(',').map((s) => s.trim()).filter(Boolean),
      };
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? 'Save failed');
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      <Card>
        <CardHeader><CardTitle>Personal Info</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Full Name</Label>
            <Input
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              placeholder="Your name"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Visa Status</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Visa / Work Authorization</Label>
            <div className="flex flex-wrap gap-2">
              {VISA_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setProfile((p) => ({ ...p, visa_status: opt.value }))}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    profile.visa_status === opt.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border hover:border-primary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {profile.visa_status === 'f1' && (
            <div className="space-y-1">
              <Label>OPT End Date</Label>
              <Input
                type="date"
                value={profile.opt_end_date}
                onChange={(e) => setProfile((p) => ({ ...p, opt_end_date: e.target.value }))}
              />
              {optDaysLeft !== null && (
                <div className={`flex items-center gap-2 mt-2 text-sm rounded px-3 py-2 ${
                  optDaysLeft <= 90
                    ? 'bg-red-50 text-red-700'
                    : optDaysLeft <= 180
                    ? 'bg-orange-50 text-orange-700'
                    : 'bg-blue-50 text-blue-700'
                }`}>
                  {optDaysLeft <= 180 && <AlertTriangle className="h-4 w-4 shrink-0" />}
                  {optDaysLeft < 0
                    ? 'Your OPT has expired — apply for H-1B or OPT extension immediately'
                    : `Your OPT expires in ${optDaysLeft} days — apply to H1B sponsors first`}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Job Preferences</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Target Roles</Label>
            <Input
              value={profile.target_roles}
              onChange={(e) => setProfile((p) => ({ ...p, target_roles: e.target.value }))}
              placeholder="e.g. Software Engineer, Data Scientist"
            />
            <p className="text-xs text-muted-foreground">Comma-separated</p>
          </div>
          <div className="space-y-1">
            <Label>Target Locations</Label>
            <Input
              value={profile.target_locations}
              onChange={(e) => setProfile((p) => ({ ...p, target_locations: e.target.value }))}
              placeholder="e.g. San Francisco, New York, Remote"
            />
            <p className="text-xs text-muted-foreground">Comma-separated</p>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && <p className="text-sm text-green-600">Profile saved successfully!</p>}

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Save Profile
      </Button>
    </div>
  );
}
