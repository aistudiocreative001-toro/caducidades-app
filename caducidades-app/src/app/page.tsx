import { Metadata } from 'next';
import HomePageClient from '@/components/dashboard/HomePageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Caducidades FitnessZone',
};

export default function HomePage() {
  return <HomePageClient />;
}
