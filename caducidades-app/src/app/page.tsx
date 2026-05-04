import { Metadata } from 'next';
import HomePageClient from '@/components/dashboard/HomePageClient';

export const metadata: Metadata = {
  title: 'CadFZ - Caducidades Fitness Zone',
};

export default function HomePage() {
  return <HomePageClient />;
}
