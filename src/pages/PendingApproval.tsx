import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, LogOut, RefreshCw } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const PendingApproval = () => {
  const navigate = useNavigate();
  const { user, role, approvalStatus, isLoading, signOut, refreshUserData } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
      return;
    }

    if (!isLoading && role === 'admin') {
      navigate('/admin');
      return;
    }

    if (!isLoading && approvalStatus === 'approved') {
      navigate('/developer');
    }
  }, [user, role, approvalStatus, isLoading, navigate]);

  const handleRefresh = async () => {
    await refreshUserData();
  };

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

  if (approvalStatus === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">❌</span>
            </div>
            <CardTitle className="text-2xl font-bold text-destructive">Pendaftaran Ditolak</CardTitle>
            <CardDescription>
              Maaf, pendaftaran Anda telah ditolak oleh admin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Jika Anda merasa ini adalah kesalahan, silakan hubungi administrator.
            </p>
            <Button onClick={handleSignOut} variant="outline" className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="h-8 w-8 text-amber-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Menunggu Persetujuan</CardTitle>
          <CardDescription>
            Akun Anda sedang menunggu persetujuan dari admin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Setelah akun Anda disetujui, Anda akan dapat mengakses dashboard developer.
            Proses ini biasanya memakan waktu 1-2 hari kerja.
          </p>
          <div className="flex gap-2">
            <Button onClick={handleRefresh} variant="outline" className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Cek Status
            </Button>
            <Button onClick={handleSignOut} variant="outline" className="flex-1">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingApproval;
