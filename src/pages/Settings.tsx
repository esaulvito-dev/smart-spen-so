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
import { Settings as SettingsIcon, User, Palette, Loader2, Check, Upload, Trash2, Camera, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrency, CurrencyCode, CURRENCY_CONFIG } from '@/hooks/useCurrency';

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
  const { exchangeRate } = useCurrency();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('emerald');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('PEN');
  const [cropperOpen, setCropperOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setSelectedTheme(profile.theme_color || 'emerald');
      setSelectedCurrency((profile.currency as CurrencyCode) || 'PEN');
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
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveCroppedImage = async (blob: Blob) => {
    if (!user?.id) return;
    
    setUploading(true);
    try {
      const fileName = `${user.id}/avatar-${Date.now()}.jpg`;
      
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/avatars/')[1];
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

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
      const urlParts = profile.avatar_url.split('/avatars/');
      if (urlParts[1]) {
        await supabase.storage.from('avatars').remove([urlParts[1]]);
      }

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

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background">
      <Sidebar />
      <main className="lg:pl-64 p-3 sm:p-4 lg:p-8 pt-[72px] lg:pt-8 pb-6">
        <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 gradient-primary rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
              <SettingsIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Configuración</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">
                Personaliza tu experiencia
              </p>
            </div>
          </div>

          {/* Profile Settings */}
          <Card className="shadow-soft border-border/50">
            <CardHeader className="pb-2 sm:pb-4">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <div>
                  <CardTitle className="text-base sm:text-lg">Perfil</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Información de tu cuenta</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6">
              {/* Avatar Section */}
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                <div className="relative group">
                  <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-primary/20">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl sm:text-2xl font-medium">
                      {getInitials(fullName || profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div 
                    className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>

                <div className="flex flex-col gap-2 w-full sm:w-auto">
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
                    className="w-full sm:w-auto h-10 sm:h-9"
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
                      className="w-full sm:w-auto h-10 sm:h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
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
                  
                  <p className="text-xs text-muted-foreground text-center sm:text-left">
                    JPG, PNG o GIF. Máximo 5MB.
                  </p>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="fullName" className="text-sm">Nombre completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Tu nombre"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-11 sm:h-10 text-base sm:text-sm"
                />
              </div>

              {/* Email (read-only) */}
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="email" className="text-sm">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="h-11 sm:h-10 text-base sm:text-sm bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  El correo electrónico no se puede cambiar
                </p>
              </div>

              <Button 
                onClick={handleSaveProfile}
                disabled={updateProfile.isPending}
                className="w-full sm:w-auto h-11 sm:h-10 gradient-primary text-primary-foreground hover:opacity-90"
              >
                {updateProfile.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Guardar cambios
              </Button>
            </CardContent>
          </Card>

          {/* Theme Settings */}
          <Card className="shadow-soft border-border/50">
            <CardHeader className="pb-2 sm:pb-4">
              <div className="flex items-center gap-3">
                <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <div>
                  <CardTitle className="text-base sm:text-lg">Tema</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Personaliza los colores</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4">
                {themeColors.map((theme) => {
                  const isSelected = selectedTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => handleSaveTheme(theme.id)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all active:scale-95',
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-glow'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <div className={cn(
                        'w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-md transition-transform',
                        theme.color,
                        isSelected && 'scale-110'
                      )}>
                        {isSelected && (
                          <Check className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                        )}
                      </div>
                      <span className={cn(
                        'text-xs sm:text-sm font-medium truncate w-full text-center',
                        isSelected && 'text-primary'
                      )}>
                        {theme.name}
                      </span>
                    </button>
                  );
                })}
              </div>
              
              <p className="text-xs sm:text-sm text-muted-foreground mt-4 text-center">
                El tema se aplica a todo tu dashboard
              </p>
            </CardContent>
          </Card>

          {/* Currency Settings */}
          <Card className="shadow-soft border-border/50">
            <CardHeader className="pb-2 sm:pb-4">
              <div className="flex items-center gap-3">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <div>
                  <CardTitle className="text-base sm:text-lg">Moneda</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Selecciona tu moneda preferida</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                {(Object.entries(CURRENCY_CONFIG) as [CurrencyCode, typeof CURRENCY_CONFIG[CurrencyCode]][]).map(([code, config]) => {
                  const isSelected = selectedCurrency === code;
                  return (
                    <button
                      key={code}
                      onClick={async () => {
                        setSelectedCurrency(code);
                        try {
                          await updateProfile.mutateAsync({ currency: code } as any);
                          toast({ title: 'Moneda actualizada', description: `Se cambió a ${config.name}` });
                        } catch {
                          toast({ title: 'Error', description: 'No se pudo actualizar la moneda.', variant: 'destructive' });
                        }
                      }}
                      className={cn(
                        'flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all active:scale-95',
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-glow'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <div className={cn(
                        'w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-md transition-transform bg-primary/10 text-primary font-bold text-lg sm:text-xl',
                        isSelected && 'scale-110 bg-primary text-primary-foreground'
                      )}>
                        {config.symbol}
                      </div>
                      <span className={cn(
                        'text-xs sm:text-sm font-medium',
                        isSelected && 'text-primary'
                      )}>
                        {config.name}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-4 text-center">
                La moneda se aplica a todos los paneles con tipo de cambio en tiempo real
              </p>
              <p className="text-xs text-muted-foreground mt-1 text-center">
                Tipo de cambio actual: 1 USD = {exchangeRate.toFixed(2)} PEN
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <AvatarCropper
        open={cropperOpen}
        onOpenChange={setCropperOpen}
        imageUrl={tempImageUrl}
        onSave={handleSaveCroppedImage}
      />
    </div>
  );
}
