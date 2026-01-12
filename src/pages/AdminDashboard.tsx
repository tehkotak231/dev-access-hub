import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogOut, CheckCircle, XCircle, Users, Clock, UserCheck } from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
}

interface DeveloperApproval {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  profile?: Profile;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, role, isLoading, signOut } = useAuth();
  const { toast } = useToast();
  
  const [approvals, setApprovals] = useState<DeveloperApproval[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/admin/login');
      return;
    }

    if (!isLoading && role !== 'admin') {
      toast({
        title: 'Akses ditolak',
        description: 'Anda tidak memiliki akses ke halaman ini.',
        variant: 'destructive',
      });
      navigate('/auth');
    }
  }, [user, role, isLoading, navigate, toast]);

  useEffect(() => {
    if (role === 'admin') {
      fetchApprovals();
    }
  }, [role]);

  const fetchApprovals = async () => {
    setIsLoadingData(true);
    try {
      // Fetch approvals
      const { data: approvalsData, error: approvalsError } = await supabase
        .from('developer_approvals')
        .select('id, user_id, status, created_at')
        .order('created_at', { ascending: false });

      if (approvalsError) throw approvalsError;

      // Fetch profiles for all user_ids
      const userIds = approvalsData.map(a => a.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combine data
      const combinedData: DeveloperApproval[] = approvalsData.map(approval => ({
        ...approval,
        profile: profilesData?.find(p => p.id === approval.user_id) || undefined,
      }));

      setApprovals(combinedData);
    } catch (error) {
      console.error('Error fetching approvals:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data developer.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const updateApprovalStatus = async (approvalId: string, status: 'approved' | 'rejected') => {
    setProcessingId(approvalId);
    try {
      const { error } = await supabase
        .from('developer_approvals')
        .update({
          status,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', approvalId);

      if (error) throw error;

      toast({
        title: status === 'approved' ? 'Developer disetujui!' : 'Developer ditolak',
        description: status === 'approved' 
          ? 'Developer sekarang dapat mengakses dashboard.'
          : 'Developer telah ditolak aksesnya.',
      });

      fetchApprovals();
    } catch (error) {
      console.error('Error updating approval:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengupdate status.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800">Pending</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const stats = {
    total: approvals.length,
    pending: approvals.filter(a => a.status === 'pending').length,
    approved: approvals.filter(a => a.status === 'approved').length,
  };

  if (isLoading || isLoadingData) {
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
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Developer</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Menunggu Persetujuan</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Disetujui</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>
        </div>

        {/* Approvals Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Developer</CardTitle>
            <CardDescription>Kelola persetujuan akun developer</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal Daftar</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Belum ada developer yang terdaftar.
                    </TableCell>
                  </TableRow>
                ) : (
                  approvals.map((approval) => (
                    <TableRow key={approval.id}>
                      <TableCell className="font-medium">
                        {approval.profile?.full_name || '-'}
                      </TableCell>
                      <TableCell>{approval.profile?.email || '-'}</TableCell>
                      <TableCell>{getStatusBadge(approval.status)}</TableCell>
                      <TableCell>
                        {new Date(approval.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        {approval.status === 'pending' && (
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              onClick={() => updateApprovalStatus(approval.id, 'approved')}
                              disabled={processingId === approval.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {processingId === approval.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateApprovalStatus(approval.id, 'rejected')}
                              disabled={processingId === approval.id}
                            >
                              {processingId === approval.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;
