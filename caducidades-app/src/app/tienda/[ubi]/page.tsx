import { Metadata } from 'next';
import TiendaPageClient from '@/components/tiendas/TiendaPageClient';

export const metadata: Metadata = {
  title: 'CadFZ - Tienda',
};

interface TiendaPageProps {
  params: Promise<{ ubi: string }>;
}

export default async function TiendaPage({ params }: TiendaPageProps) {
  const { ubi } = await params;
  return <TiendaPageClient ubi={ubi} />;
}
