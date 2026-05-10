import { NextResponse } from 'next/server';
import { seedH1BSponsors } from '@/lib/scraper/h1b-seed';

export async function GET() {
  try {
    const result = await seedH1BSponsors();
    if (result.alreadySeeded) {
      return NextResponse.json({ message: 'Already seeded', inserted: 0 });
    }
    return NextResponse.json({ message: 'Seeded successfully', inserted: result.inserted });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Seed failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
