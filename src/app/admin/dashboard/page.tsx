
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
    const { user } = useAuth();
    const router = useRouter();

    if (!user || user.email !== 'admin@sakuralearn.com') {
        return (
            <div className="container mx-auto">
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p>You do not have permission to view this page.</p>
            </div>
        )
    }

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold font-headline mb-2">Admin Dashboard</h1>
       <p className="text-muted-foreground mb-8">Welcome, administrator. This is your control panel.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Users</CardTitle>
                    <CardDescription>View and manage all registered users.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">User management functionality would be displayed here. This requires a secure backend implementation with the Firebase Admin SDK.</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Content Management</CardTitle>
                    <CardDescription>Edit pre-made decks, grammar, and quizzes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Functionality to edit application-wide content would go here.</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Analytics</CardTitle>
                    <CardDescription>View application usage statistics.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Analytics dashboards and reports would be displayed here, potentially using Firebase Analytics.</p>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
