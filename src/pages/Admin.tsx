import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  useIsAdmin,
  useUsers,
  useInvitations,
  useCreateInvitation,
  useToggleUserAccess,
  useDeleteUser,
  useDeleteInvitation,
  useResendInvitation,
} from '@/hooks/useUserManagement';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  Mail,
  UserPlus,
  Trash2,
  Power,
  RefreshCw,
  Loader2,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Admin() {
  const { user } = useAuth();
  const { data: isAdmin, isLoading: checkingAdmin } = useIsAdmin();
  const { data: users, isLoading: loadingUsers } = useUsers();
  const { data: invitations, isLoading: loadingInvitations } = useInvitations();
  
  const createInvitation = useCreateInvitation();
  const toggleAccess = useToggleUserAccess();
  const deleteUser = useDeleteUser();
  const deleteInvitation = useDeleteInvitation();
  const resendInvitation = useResendInvitation();
  
  const [newEmail, setNewEmail] = useState('');

  if (checkingAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    
    try {
      await createInvitation.mutateAsync(newEmail.trim());
      toast.success('Invitación enviada correctamente');
      setNewEmail('');
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Este email ya ha sido invitado');
      } else {
        toast.error('Error al enviar la invitación');
      }
    }
  };

  const handleToggleAccess = async (userId: string, isActive: boolean, email: string) => {
    try {
      await toggleAccess.mutateAsync({ userId, isActive });
      toast.success(isActive ? `Acceso desactivado para ${email}` : `Acceso reactivado para ${email}`);
    } catch (error) {
      toast.error('Error al cambiar el acceso');
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    try {
      await deleteUser.mutateAsync(userId);
      toast.success(`Usuario ${email} eliminado`);
    } catch (error) {
      toast.error('Error al eliminar el usuario');
    }
  };

  const handleDeleteInvitation = async (invitationId: string) => {
    try {
      await deleteInvitation.mutateAsync(invitationId);
      toast.success('Invitación eliminada');
    } catch (error) {
      toast.error('Error al eliminar la invitación');
    }
  };

  const handleResendInvitation = async (email: string, invitationId: string) => {
    try {
      await resendInvitation.mutateAsync({ email, invitationId });
      toast.success('Invitación reenviada');
    } catch (error) {
      toast.error('Error al reenviar la invitación');
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.charAt(0).toUpperCase();
  };

  const activeUsers = users?.filter(u => u.is_active) || [];
  const pendingInvitations = invitations?.filter(i => !i.is_accepted && i.is_active) || [];
  const acceptedInvitations = invitations?.filter(i => i.is_accepted) || [];

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="lg:ml-64 pt-14 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">Panel de Administración</h1>
            </div>
            <p className="text-muted-foreground">
              Gestiona los usuarios y controla el acceso a la aplicación
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{activeUsers.length}</p>
                    <p className="text-xs text-muted-foreground">Usuarios activos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <Clock className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{pendingInvitations.length}</p>
                    <p className="text-xs text-muted-foreground">Pendientes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{acceptedInvitations.length}</p>
                    <p className="text-xs text-muted-foreground">Aceptadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Mail className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{invitations?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Total invitaciones</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invite Form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Invitar nuevo usuario
              </CardTitle>
              <CardDescription>
                Envía una invitación por correo electrónico para dar acceso a la aplicación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInvite} className="flex gap-3">
                <Input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="flex-1"
                  required
                />
                <Button type="submit" disabled={createInvitation.isPending}>
                  {createInvitation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4 mr-2" />
                  )}
                  Enviar invitación
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="users" className="space-y-4">
            <TabsList>
              <TabsTrigger value="users" className="gap-2">
                <Users className="w-4 h-4" />
                Usuarios ({activeUsers.length})
              </TabsTrigger>
              <TabsTrigger value="invitations" className="gap-2">
                <Mail className="w-4 h-4" />
                Invitaciones ({invitations?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>Usuarios con acceso</CardTitle>
                  <CardDescription>
                    Lista de todos los usuarios que tienen acceso a la aplicación
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingUsers ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : activeUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay usuarios registrados
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Usuario</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead>Desde</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activeUsers.map((u) => (
                            <TableRow key={u.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-8 h-8">
                                    <AvatarImage src={u.avatar_url || undefined} />
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                      {getInitials(u.full_name, u.email)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{u.full_name || 'Sin nombre'}</p>
                                    <p className="text-xs text-muted-foreground">{u.email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                                  {u.role === 'admin' ? 'Admin' : 'Usuario'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {format(new Date(u.created_at), 'dd MMM yyyy', { locale: es })}
                              </TableCell>
                              <TableCell className="text-right">
                                {u.id !== user?.id && u.role !== 'admin' && (
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleToggleAccess(u.id, u.is_active, u.email)}
                                    >
                                      <Power className="w-4 h-4" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="text-destructive">
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Esto eliminará el acceso de {u.email} a la aplicación. Esta acción no se puede deshacer.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleDeleteUser(u.id, u.email)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          >
                                            Eliminar
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                )}
                                {u.id === user?.id && (
                                  <Badge variant="outline">Tú</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="invitations">
              <Card>
                <CardHeader>
                  <CardTitle>Historial de invitaciones</CardTitle>
                  <CardDescription>
                    Todas las invitaciones enviadas y su estado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingInvitations ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : !invitations || invitations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay invitaciones enviadas
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invitations.map((inv) => (
                            <TableRow key={inv.id}>
                              <TableCell className="font-medium">{inv.email}</TableCell>
                              <TableCell>
                                {inv.is_accepted ? (
                                  <Badge variant="default" className="gap-1 bg-green-500">
                                    <CheckCircle className="w-3 h-3" />
                                    Aceptada
                                  </Badge>
                                ) : inv.is_active ? (
                                  <Badge variant="secondary" className="gap-1">
                                    <Clock className="w-3 h-3" />
                                    Pendiente
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="gap-1 text-destructive">
                                    <XCircle className="w-3 h-3" />
                                    Cancelada
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {format(new Date(inv.created_at), 'dd MMM yyyy', { locale: es })}
                              </TableCell>
                              <TableCell className="text-right">
                                {!inv.is_accepted && inv.is_active && (
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleResendInvitation(inv.email, inv.id)}
                                      disabled={resendInvitation.isPending}
                                    >
                                      <RefreshCw className="w-4 h-4" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="text-destructive">
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>¿Cancelar invitación?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Esto cancelará la invitación para {inv.email}. Podrás enviar una nueva invitación después.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleDeleteInvitation(inv.id)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          >
                                            Eliminar
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
