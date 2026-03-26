import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { EstimatorApp } from '@/components/EstimatorApp';

export const metadata = {
  title: 'Project Estimator - AI-Powered Project Estimation Tool',
  description: 'Create accurate project estimates with AI assistance. Analyze requirements, break down features, and get detailed cost estimates.',
};

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return <EstimatorApp />;
}
