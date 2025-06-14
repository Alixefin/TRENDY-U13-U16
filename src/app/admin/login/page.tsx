import PinForm from '@/components/admin/PinForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Admin Login | Trendy's Tournament Tracker",
  description: "Access the admin panel for Trendy's Tournament Tracker.",
};

export default function AdminLoginPage() {
  return <PinForm />;
}
