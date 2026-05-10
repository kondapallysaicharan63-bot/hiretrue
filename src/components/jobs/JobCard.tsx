'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getJobAgeLabel } from '@/lib/scraper/date-utils';
import { Bookmark, Wand2, MessageSquare, Mail, MapPin, Building2, DollarSign } from 'lucide-react';

export interface JobCardProps {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary_min?: number | null;
  salary_max?: number | null;
  is_h1b_sponsor: boolean;
  is_remote: boolean;
  is_internship: boolean;
  original_posted_at: Date | string;
  apply_url?: string | null;
  apply_email?: string | null;
  matchScore?: number | null;
  matchReason?: string | null;
  matchGaps?: string[];
  onSave?: (id: string) => void;
  onTailorResume?: (id: string) => void;
  onInterviewPrep?: (id: string) => void;
  isSaved?: boolean;
}

export function JobCard({
  id,
  title,
  company,
  location,
  description,
  salary_min,
  salary_max,
  is_h1b_sponsor,
  is_remote,
  is_internship,
  original_posted_at,
  apply_url,
  apply_email,
  matchScore,
  matchReason,
  matchGaps,
  onSave,
  onTailorResume,
  onInterviewPrep,
  isSaved,
}: JobCardProps) {
  const postedDate = original_posted_at instanceof Date ? original_posted_at : new Date(original_posted_at);
  const age = getJobAgeLabel(postedDate);

  return (
    <Card data-testid="job-card" className="hover:shadow-md transition-shadow">
      <CardContent className="pt-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-base leading-tight truncate">{title}</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
              <Building2 className="h-3 w-3 shrink-0" />
              <span className="truncate">{company}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className={`text-xs ${age.isStale ? 'text-orange-500 font-medium' : 'text-muted-foreground'}`}>
              {age.label}
            </span>
          </div>
        </div>

        {/* Location + Salary */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />{location}
          </span>
          {(salary_min || salary_max) && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {salary_min && salary_max
                ? `$${(salary_min / 1000).toFixed(0)}K–$${(salary_max / 1000).toFixed(0)}K`
                : salary_min
                ? `$${(salary_min / 1000).toFixed(0)}K+`
                : `up to $${(salary_max! / 1000).toFixed(0)}K`}
            </span>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          {is_h1b_sponsor && (
            <Badge data-testid="h1b-badge" variant="secondary" className="bg-green-100 text-green-800 text-xs">
              H1B Sponsor
            </Badge>
          )}
          {is_remote && <Badge variant="outline" className="text-xs">Remote</Badge>}
          {is_internship && <Badge variant="outline" className="text-xs">Internship</Badge>}
          {apply_email && (
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <Mail className="h-3 w-3" /> Email Apply
            </Badge>
          )}
        </div>

        {/* Staleness warning */}
        {age.warning && (
          <p className="text-xs text-orange-600 bg-orange-50 rounded px-2 py-1">{age.warning}</p>
        )}

        {/* Match score */}
        {matchScore != null && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium">Match Score</span>
              <span className={matchScore >= 70 ? 'text-green-600 font-bold' : 'text-muted-foreground'}>
                {matchScore}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${matchScore >= 70 ? 'bg-green-500' : matchScore >= 50 ? 'bg-yellow-500' : 'bg-red-400'}`}
                style={{ width: `${matchScore}%` }}
              />
            </div>
            {matchReason && <p className="text-xs text-muted-foreground">{matchReason}</p>}
            {matchGaps && matchGaps.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {matchGaps.map((g) => (
                  <span key={g} className="text-xs bg-red-100 text-red-700 rounded px-1.5 py-0.5">{g}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Description snippet */}
        <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            data-testid="save-job-btn"
            onClick={() => onSave?.(id)}
            disabled={isSaved}
          >
            <Bookmark className="h-3 w-3 mr-1" />
            {isSaved ? 'Saved' : 'Save'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            data-testid="tailor-resume-btn"
            onClick={() => onTailorResume?.(id)}
          >
            <Wand2 className="h-3 w-3 mr-1" />
            Tailor Resume
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            data-testid="interview-prep-btn"
            onClick={() => onInterviewPrep?.(id)}
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            Prep
          </Button>
          {apply_url && (
            <Button asChild size="sm" className="flex-1 text-xs">
              <a href={apply_url} target="_blank" rel="noopener noreferrer">Apply</a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
