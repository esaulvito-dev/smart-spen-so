import { useState, useMemo } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, Loader2, Plus, Pencil, Trash2, CheckCircle, Clock } from 'lucide-react';
import { useSavingsGoals, useDeleteSavingsGoal, useUpdateSavingsGoal, SavingsGoal } from '@/hooks/useSavingsGoals';
import { AddGoalDialog } from '@/components/dashboard/AddGoalDialog';
import { AddToGoalDialog } from '@/components/dashboard/AddToGoalDialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, differenceInDays, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { useCurrency } from '@/hooks/useCurrency';

export default function Goals() {
  const { formatCurrency } = useCurrency();
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addToGoal, setAddToGoal] = useState<SavingsGoal | null>(null);
  const [addToDialogOpen, setAddToDialogOpen] = useState(false);

  const { data: goals = [], isLoading } = useSavingsGoals();
  const deleteGoal = useDeleteSavingsGoal();
  const updateGoal = useUpdateSavingsGoal();
  const { toast } = useToast();

  const { activeGoals, completedGoals } = useMemo(() => {
    const active = goals.filter(g => !g.is_completed);
    const completed = goals.filter(g => g.is_completed);
    return { activeGoals: active, completedGoals: completed };
  }, [goals]);

  const totalSaved = useMemo(() => {
    return goals.reduce((sum, g) => sum + Number(g.current_amount), 0);
  }, [goals]);

  const totalTarget = useMemo(() => {
    return activeGoals.reduce((sum, g) => sum + Number(g.target_amount), 0);
  }, [activeGoals]);

  const handleDelete = async (id: string) => {
    try {
      await deleteGoal.mutateAsync(id);
      toast({
        title: 'Meta eliminada',
        description: 'La meta ha sido eliminada correctamente.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la meta.',
        variant: 'destructive',
      });
    }
  };

  const handleMarkComplete = async (goal: SavingsGoal) => {
    try {
      await updateGoal.mutateAsync({
        id: goal.id,
        is_completed: true,
        current_amount: goal.target_amount,
      });
      toast({
        title: '¡Meta completada! 🎉',
        description: `Has completado la meta "${goal.name}"`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo completar la meta.',
        variant: 'destructive',
      });
    }
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
        <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 gradient-primary rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Metas de Ahorro</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Alcanza tus objetivos financieros
                </p>
              </div>
            </div>
            <AddGoalDialog />
          </div>

          {/* Summary */}
          {goals.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <Card className="shadow-soft border-border/50">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Total ahorrado</p>
                  <p className="text-xl sm:text-2xl font-bold text-success">
                    {formatCurrency(totalSaved)}
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-soft border-border/50">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Objetivo total</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {formatCurrency(totalTarget)}
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-soft border-border/50 col-span-2 lg:col-span-1">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Metas activas</p>
                  <p className="text-xl sm:text-2xl font-bold">{activeGoals.length}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Active Goals */}
          {activeGoals.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Metas activas</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeGoals.map((goal) => {
                  const percentage = goal.target_amount > 0 
                    ? (Number(goal.current_amount) / Number(goal.target_amount)) * 100 
                    : 0;
                  const remaining = Number(goal.target_amount) - Number(goal.current_amount);
                  const daysLeft = goal.deadline ? differenceInDays(new Date(goal.deadline), new Date()) : null;
                  const isOverdue = goal.deadline ? isPast(new Date(goal.deadline)) : false;

                  return (
                    <Card key={goal.id} className="shadow-soft border-border/50">
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-xl">
                              {goal.icon}
                            </div>
                            <div>
                              <h3 className="font-semibold">{goal.name}</h3>
                              {goal.deadline && (
                                <p className={cn(
                                  "text-xs flex items-center gap-1",
                                  isOverdue ? "text-destructive" : "text-muted-foreground"
                                )}>
                                  <Clock className="w-3 h-3" />
                                  {isOverdue 
                                    ? 'Vencida' 
                                    : `${daysLeft} días restantes`
                                  }
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 text-muted-foreground hover:text-primary"
                              onClick={() => {
                                setEditingGoal(goal);
                                setEditDialogOpen(true);
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDelete(goal.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progreso</span>
                            <span className="font-medium">{percentage.toFixed(1)}%</span>
                          </div>
                          <Progress value={Math.min(percentage, 100)} className="h-2" />
                          <div className="flex justify-between text-sm">
                            <span className="text-success font-medium">
                              {formatCurrency(Number(goal.current_amount))}
                            </span>
                            <span className="text-muted-foreground">
                              de {formatCurrency(Number(goal.target_amount))}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setAddToGoal(goal);
                              setAddToDialogOpen(true);
                            }}
                          >
                            Agregar
                          </Button>
                          {percentage >= 100 && (
                            <Button
                              size="sm"
                              className="flex-1 gradient-primary"
                              onClick={() => handleMarkComplete(goal)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Completar
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            <Card className="shadow-soft border-border/50">
              <CardContent>
                <div className="text-center py-8 sm:py-12">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 gradient-primary rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Target className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">Sin metas de ahorro</h3>
                  <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto px-4 mb-4">
                    Crea metas de ahorro para alcanzar tus objetivos financieros, 
                    como vacaciones, fondo de emergencia o compras importantes.
                  </p>
                  <AddGoalDialog />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Completed Goals */}
          {completedGoals.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-muted-foreground">Metas completadas</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {completedGoals.map((goal) => (
                  <Card key={goal.id} className="shadow-soft border-border/50 bg-success/5 border-success/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center text-xl">
                            {goal.icon}
                          </div>
                          <div>
                            <h3 className="font-semibold flex items-center gap-2">
                              {goal.name}
                              <CheckCircle className="w-4 h-4 text-success" />
                            </h3>
                            <p className="text-sm text-success font-medium">
                              {formatCurrency(Number(goal.target_amount))}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(goal.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Edit Goal Dialog */}
          <AddGoalDialog
            editGoal={editingGoal}
            open={editDialogOpen}
            onOpenChange={(open) => {
              setEditDialogOpen(open);
              if (!open) setEditingGoal(null);
            }}
          />

          {/* Add To Goal Dialog */}
          <AddToGoalDialog
            goal={addToGoal}
            open={addToDialogOpen}
            onOpenChange={(open) => {
              setAddToDialogOpen(open);
              if (!open) setAddToGoal(null);
            }}
          />
        </div>
      </main>
    </div>
  );
}
