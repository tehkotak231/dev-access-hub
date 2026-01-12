import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LogOut, Code, Rocket } from 'lucide-react';

const DeveloperDashboard = () => {
  const navigate = useNavigate();
  const { user, role, approvalStatus, isLoading, signOut } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
      return;
    }

    if (!isLoading && role === 'admin') {
      navigate('/admin');
      return;
    }

    if (!isLoading && role === 'developer' && approvalStatus !== 'approved') {
      navigate('/pending');
    }
  }, [user, role, approvalStatus, isLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Developer Dashboard</h1>
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Selamat datang, {user?.email}</h2>
          <p className="text-muted-foreground">
            Akun Anda telah disetujui. Anda sekarang memiliki akses penuh ke dashboard developer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Code className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Mulai Development</CardTitle>
                  <CardDescription>Akses tools dan resources</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Akses berbagai tools pengembangan, dokumentasi API, dan resources lainnya untuk memulai project Anda.
              </p>
              <Button variant="outline" className="w-full">
                Lihat Resources
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Rocket className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Deploy Project</CardTitle>
                  <CardDescription>Kelola deployment Anda</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Deploy project Anda dengan mudah dan monitor status deployment secara real-time.
              </p>
              <Button variant="outline" className="w-full">
                Kelola Deployment
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DeveloperDashboard;
