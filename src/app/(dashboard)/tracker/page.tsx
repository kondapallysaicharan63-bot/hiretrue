'use client';

import { useEffect, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Building2, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const COLUMNS = [
  { id: 'saved', label: 'Saved', color: 'bg-slate-100' },
  { id: 'applied', label: 'Applied', color: 'bg-blue-50' },
  { id: 'interview', label: 'Interview', color: 'bg-yellow-50' },
  { id: 'offer', label: 'Offer', color: 'bg-green-50' },
  { id: 'rejected', label: 'Rejected', color: 'bg-red-50' },
] as const;

type Status = typeof COLUMNS[number]['id'];

interface Application {
  id: string;
  status: string;
  match_score: number | null;
  match_reason: string | null;
  tailored_resume: string | null;
  cover_letter: string | null;
  notes: string | null;
  applied_at: string | null;
  created_at: string;
  title: string;
  company: string;
  location: string | null;
  description: string | null;
  apply_url: string | null;
  is_h1b_sponsor: boolean;
}

function ApplicationCard({
  app,
  isDragging,
}: {
  app: Application;
  isDragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: app.id });
  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <Card
        data-testid="application-card"
        className={`cursor-grab active:cursor-grabbing select-none ${isDragging ? 'opacity-50' : 'hover:shadow-md'} transition-shadow`}
      >
        <CardContent className="pt-3 pb-3 space-y-2">
          <p className="font-medium text-sm leading-tight">{app.title}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3" />{app.company}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {app.match_score != null && (
              <Badge
                variant="secondary"
                className={`text-xs ${app.match_score >= 70 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
              >
                {app.match_score}% match
              </Badge>
            )}
            {app.is_h1b_sponsor && (
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">H1B</Badge>
            )}
          </div>
          {app.applied_at && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Applied {format(new Date(app.applied_at), 'MMM d')}
            </div>
          )}
          {!app.applied_at && app.created_at && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Saved {format(new Date(app.created_at), 'MMM d')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Column({
  id,
  label,
  color,
  apps,
  activeId,
}: {
  id: string;
  label: string;
  color: string;
  apps: Application[];
  activeId: string | null;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-2 min-h-[400px] rounded-xl p-3 transition-colors ${color} ${isOver ? 'ring-2 ring-primary' : ''}`}
    >
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-semibold text-sm">{label}</h2>
        <Badge variant="outline" className="text-xs">{apps.length}</Badge>
      </div>
      {apps.map((app) => (
        <ApplicationCard key={app.id} app={app} isDragging={app.id === activeId} />
      ))}
      {apps.length === 0 && (
        <p className="text-xs text-muted-foreground text-center pt-8">No applications</p>
      )}
    </div>
  );
}

export default function TrackerPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    fetch('/api/applications')
      .then((r) => r.json())
      .then((data) => setApplications(data.applications ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const newStatus = over.id as Status;
    const appId = active.id as string;
    const app = applications.find((a) => a.id === appId);
    if (!app || app.status === newStatus) return;

    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
    );

    await fetch('/api/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: appId, status: newStatus }),
    });
  }

  const activeApp = activeId ? applications.find((a) => a.id === activeId) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Application Tracker</h1>
      <p className="text-sm text-muted-foreground">
        Drag cards between columns to update your application status.
      </p>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              id={col.id}
              label={col.label}
              color={col.color}
              apps={applications.filter((a) => a.status === col.id)}
              activeId={activeId}
            />
          ))}
        </div>

        <DragOverlay>
          {activeApp && (
            <Card className="cursor-grabbing shadow-2xl rotate-2 opacity-90">
              <CardContent className="pt-3 pb-3">
                <p className="font-medium text-sm">{activeApp.title}</p>
                <p className="text-xs text-muted-foreground">{activeApp.company}</p>
              </CardContent>
            </Card>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
