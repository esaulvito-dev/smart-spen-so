import { useState } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Settings as SettingsIcon, User, Palette, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const themeColors = [
  { id: 'emerald', name: 'Esmeralda', color: 'bg-[hsl(160,84%,39%)]' },
  { id: 'blue', name: 'Azul', color: 'bg-[hsl(217,91%,60%)]' },
  { id: 'purple', name: 'Púrpura', color: 'bg-[hsl(271,91%,65%)]' },
  { id: 'orange', name: 'Naranja', color: 'bg-[hsl(24,95%,53%)]' },
  { id: 'teal', name: 'Turquesa', color: 'bg-[hsl(174,72%,40%)]' },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();

  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('emerald');

  // Initialize state when profile loads
  useState(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setAvatarUrl(profile.avatar_url || '');
      setSelectedTheme(profile.theme_color || 'emerald');
    }
  });

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync({
        full_name: fullName,
        avatar_url: avatarUrl || null,
      });
      toast({
        title: 'Perfil actualizado',
        description: 'Tus cambios han sido guardados.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el perfil.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveTheme = async (themeId: string) => {
    setSelectedTheme(themeId);
    try {
      await updateProfile.mutateAsync({
        theme_color: themeId,
      });
      toast({
        title: 'Tema actualizado',
        description: 'El color del tema ha sido cambiado.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el tema.',
        variant: 'destructive',
      });
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background ${selectedTheme !== 'emerald' ? `theme-${selectedTheme}` : ''}`}>
      <Sidebar />
      <main className="lg:pl-64 p-4 lg:p-8 pt-20 lg:pt-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                <SettingsIcon className="w-5 h-5 text-primary-foreground" />
              </div>
              Configuración
            </h1>
            <p className="text-muted-foreground mt-1">
              Personaliza tu experiencia
            </p>
          </div>

          {/* Profile Settings */}
          <Card className="shadow-soft border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-primary" />
                <div>
                  <CardTitle className="text-lg">Perfil</CardTitle>
                  <CardDescription>Información de tu cuenta</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Preview */}
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20 border-2 border-primary/20">
                  <AvatarImage src={avatarUrl || profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
                    {getInitials(fullName || profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Label htmlFor="avatar">URL del avatar</Label>
                  <Input
                    id="avatar"
                    type="url"
                    placeholder="https://ejemplo.com/avatar.jpg"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Ingresa una URL de imagen para tu avatar
                  </p>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Tu nombre"
                  value={fullName || profile?.full_name || ''}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  El correo electrónico no se puede cambiar
                </p>
              </div>

              <Button 
                onClick={handleSaveProfile}
                disabled={updateProfile.isPending}
                className="gradient-primary text-primary-foreground hover:opacity-90"
              >
                {updateProfile.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Guardar cambios
              </Button>
            </CardContent>
          </Card>

          {/* Theme Settings */}
          <Card className="shadow-soft border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Palette className="w-5 h-5 text-primary" />
                <div>
                  <CardTitle className="text-lg">Tema</CardTitle>
                  <CardDescription>Personaliza los colores de tu dashboard</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {themeColors.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => handleSaveTheme(theme.id)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                      (selectedTheme || profile?.theme_color || 'emerald') === theme.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      theme.color
                    )}>
                      {(selectedTheme || profile?.theme_color || 'emerald') === theme.id && (
                        <Check className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <span className="text-sm font-medium">{theme.name}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
