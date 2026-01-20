import { useState, useRef, useEffect } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarCropper } from '@/components/settings/AvatarCropper';
import { useToast } from '@/hooks/use-toast';
import { Settings as SettingsIcon, User, Palette, Loader2, Check, Upload, Trash2, Camera } from 'lucide-react';
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
  const { data: profile, isLoading, refetch } = useProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('emerald');
  const [cropperOpen, setCropperOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Initialize state when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setSelectedTheme(profile.theme_color || 'emerald');
    }
  }, [profile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Por favor selecciona un archivo de imagen.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'La imagen debe ser menor a 5MB.',
        variant: 'destructive',
      });
      return;
    }

    const url = URL.createObjectURL(file);
    setTempImageUrl(url);
    setCropperOpen(true);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveCroppedImage = async (blob: Blob) => {
    if (!user?.id) return;
    
    setUploading(true);
    try {
      const fileName = `${user.id}/avatar-${Date.now()}.jpg`;
      
      // Delete old avatar if exists
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/avatars/')[1];
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile
      await updateProfile.mutateAsync({
        avatar_url: publicUrl,
      });

      toast({
        title: 'Avatar actualizado',
        description: 'Tu foto de perfil ha sido guardada.',
      });
      
      refetch();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Error',
        description: 'No se pudo subir la imagen.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      URL.revokeObjectURL(tempImageUrl);
      setTempImageUrl('');
    }
  };

  const handleDeleteAvatar = async () => {
    if (!user?.id || !profile?.avatar_url) return;
    
    setDeleting(true);
    try {
      // Extract file path from URL
      const urlParts = profile.avatar_url.split('/avatars/');
      if (urlParts[1]) {
        await supabase.storage.from('avatars').remove([urlParts[1]]);
      }

      // Update profile to remove avatar
      await updateProfile.mutateAsync({
        avatar_url: null,
      });

      toast({
        title: 'Avatar eliminado',
        description: 'Tu foto de perfil ha sido eliminada.',
      });
      
      refetch();
    } catch (error) {
      console.error('Error deleting avatar:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la imagen.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync({
        full_name: fullName,
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

  const currentThemeClass = selectedTheme !== 'emerald' ? `theme-${selectedTheme}` : '';

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background ${currentThemeClass}`}>
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
              {/* Avatar Section */}
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative group">
                  <Avatar className="w-24 h-24 border-4 border-primary/20">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-medium">
                      {getInitials(fullName || profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Overlay on hover */}
                  <div 
                    className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Subir foto
                  </Button>
                  
                  {profile?.avatar_url && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={handleDeleteAvatar}
                      disabled={deleting}
                    >
                      {deleting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      Eliminar foto
                    </Button>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG o GIF. Máximo 5MB.
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
                  value={fullName}
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
                {themeColors.map((theme) => {
                  const isSelected = selectedTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => handleSaveTheme(theme.id)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:scale-105',
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-glow'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <div className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-transform',
                        theme.color,
                        isSelected && 'scale-110'
                      )}>
                        {isSelected && (
                          <Check className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <span className={cn(
                        'text-sm font-medium',
                        isSelected && 'text-primary'
                      )}>
                        {theme.name}
                      </span>
                    </button>
                  );
                })}
              </div>
              
              <p className="text-sm text-muted-foreground mt-4 text-center">
                El tema seleccionado se aplica a todo tu dashboard
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Avatar Cropper Dialog */}
      <AvatarCropper
        open={cropperOpen}
        onOpenChange={setCropperOpen}
        imageUrl={tempImageUrl}
        onSave={handleSaveCroppedImage}
      />
    </div>
  );
}
