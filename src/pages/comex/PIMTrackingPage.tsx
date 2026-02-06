import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrackingStageBar } from '@/components/tracking/TrackingStageBar';
import { TrackingChecklist } from '@/components/tracking/TrackingChecklist';
import { TrackingTimeline } from '@/components/tracking/TrackingTimeline';
import { TrackingNoteDialog } from '@/components/tracking/TrackingNoteDialog';
import { SplitPIMDialog } from '@/components/tracking/SplitPIMDialog';
import {
  useTrackingStages,
  useChecklistItems,
  useActivityLog,
  useInitializeTracking,
  useToggleChecklistItem,
  useUpdateStageStatus,
  useAddNote,
  useSplitPIM,
} from '@/hooks/usePIMTracking';
import { TRACKING_STAGES, getStageByKey } from '@/lib/trackingChecklists';
import {
  ArrowLeft,
  Scissors,
  MessageSquare,
  CheckCircle,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function PIMTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [pim, setPim] = useState<any>(null);
  const [loadingPim, setLoadingPim] = useState(true);
  const [activeStageKey, setActiveStageKey] = useState('contrato');
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showSplitDialog, setShowSplitDialog] = useState(false);

  const { data: stages, isLoading: loadingStages } = useTrackingStages(id);
  const { data: checklistItems } = useChecklistItems(id, activeStageKey);
  const { data: allChecklistItems } = useChecklistItems(id);
  const { data: activityLog } = useActivityLog(id);

  const initTracking = useInitializeTracking();
  const toggleItem = useToggleChecklistItem();
  const updateStage = useUpdateStageStatus();
  const addNote = useAddNote();
  const splitPIM = useSplitPIM();

  const currentUser = 'Usuario'; // placeholder until real auth

  // Fetch PIM data
  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoadingPim(true);
      const { data, error } = await supabase
        .from('pims')
        .select('*')
        .eq('id', id)
        .single();
      if (!error) setPim(data);
      setLoadingPim(false);
    })();
  }, [id]);

  // Auto-initialize tracking if no stages exist
  useEffect(() => {
    if (stages && stages.length === 0 && id && !initTracking.isPending) {
      initTracking.mutate(id);
    }
  }, [stages, id]);

  const activeStage = stages?.find((s) => s.stage_key === activeStageKey);
  const activeStageDef = getStageByKey(activeStageKey);
  const stageItems = checklistItems || [];

  // Stage completion check
  const stageCompletedCount = stageItems.filter((i) => i.completado).length;
  const stageCriticalPending = stageItems.filter(
    (i) => i.critico && !i.completado
  ).length;
  const allStageCompleted = stageItems.length > 0 && stageCompletedCount === stageItems.length;

  const handleToggle = (item: any) => {
    toggleItem.mutate({
      itemId: item.id,
      pimId: id!,
      completado: !item.completado,
      usuario: currentUser,
      texto: item.texto,
      stageKey: activeStageKey,
    });
  };

  const handleCompleteStage = () => {
    if (!activeStage || !activeStageDef) return;
    if (stageCriticalPending > 0) {
      toast.error(`Hay ${stageCriticalPending} items críticos pendientes`);
      return;
    }

    updateStage.mutate({
      stageId: activeStage.id,
      pimId: id!,
      status: 'completado',
      usuario: currentUser,
      stageName: activeStageDef.name,
    });

    // Auto-advance next stage
    const currentIdx = TRACKING_STAGES.findIndex((s) => s.key === activeStageKey);
    if (currentIdx < TRACKING_STAGES.length - 1) {
      const nextKey = TRACKING_STAGES[currentIdx + 1].key;
      const nextStage = stages?.find((s) => s.stage_key === nextKey);
      if (nextStage && nextStage.status === 'pendiente') {
        updateStage.mutate({
          stageId: nextStage.id,
          pimId: id!,
          status: 'en_progreso',
          usuario: currentUser,
          stageName: TRACKING_STAGES[currentIdx + 1].name,
        });
        setActiveStageKey(nextKey);
      }
    }

    toast.success(`Etapa "${activeStageDef.name}" completada`);
  };

  const handleAddNote = (text: string) => {
    addNote.mutate({
      pimId: id!,
      stageKey: activeStageKey,
      texto: text,
      usuario: currentUser,
    });
    toast.success('Nota agregada');
  };

  const handleSplit = (itemIds: string[]) => {
    splitPIM.mutate(
      { originalPimId: id!, itemIds, usuario: currentUser },
      {
        onSuccess: ({ newCode }) => {
          toast.success(`PIM dividido. Nuevo PIM: ${newCode}`);
          setShowSplitDialog(false);
        },
        onError: () => toast.error('Error al dividir PIM'),
      }
    );
  };

  if (loadingPim || loadingStages) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Seguimiento de PIM" subtitle="Cargando..." />
        <div className="p-6 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!pim) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="PIM no encontrado" subtitle="" />
        <div className="p-6">
          <Button variant="outline" onClick={() => navigate('/comex/pims')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a PIMs
          </Button>
        </div>
      </div>
    );
  }

  // Overall progress
  const totalChecklist = allChecklistItems?.length || 0;
  const totalCompleted = allChecklistItems?.filter((i) => i.completado).length || 0;
  const overallProgress = totalChecklist > 0 ? Math.round((totalCompleted / totalChecklist) * 100) : 0;

  return (
    <div className="min-h-screen bg-background page-enter">
      <Header
        title={`Seguimiento ${pim.codigo}`}
        subtitle={pim.descripcion}
      />

      <div className="p-6 space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/comex/pims')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Progreso general: {overallProgress}%</span>
            <div className="h-2 w-32 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowNoteDialog(true)}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Nota
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowSplitDialog(true)}>
              <Scissors className="h-4 w-4 mr-2" />
              Dividir PIM
            </Button>
          </div>
        </div>

        {/* Stage bar */}
        <TrackingStageBar
          stages={stages || []}
          activeStageKey={activeStageKey}
          onStageClick={setActiveStageKey}
        />

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Checklist panel */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {activeStageDef && (
                    <activeStageDef.icon
                      className="h-5 w-5"
                      style={{ color: activeStageDef.color }}
                    />
                  )}
                  {activeStageDef?.name} — Checklist
                </CardTitle>
                <div className="flex gap-2">
                  {activeStage?.status === 'en_progreso' && allStageCompleted && (
                    <Button size="sm" onClick={handleCompleteStage}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Completar Etapa
                    </Button>
                  )}
                  {activeStage?.status === 'en_progreso' && !allStageCompleted && stageCriticalPending === 0 && stageCompletedCount > 0 && (
                    <Button size="sm" variant="outline" onClick={handleCompleteStage}>
                      <ArrowRight className="h-4 w-4 mr-1" />
                      Avanzar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <TrackingChecklist
                  items={stageItems}
                  onToggle={handleToggle}
                  disabled={activeStage?.status === 'completado'}
                />
                {activeStage?.status === 'completado' && (
                  <div className="mt-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Etapa completada
                  </div>
                )}
                {activeStage?.status === 'pendiente' && (
                  <div className="mt-4 p-3 rounded-lg bg-muted text-muted-foreground text-sm flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Etapa pendiente — complete la etapa anterior para desbloquear
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Timeline panel */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Historial de Actividad</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[600px] overflow-y-auto">
                <TrackingTimeline logs={activityLog || []} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <TrackingNoteDialog
        open={showNoteDialog}
        onOpenChange={setShowNoteDialog}
        onSubmit={handleAddNote}
        stageName={activeStageDef?.name}
      />
      <SplitPIMDialog
        open={showSplitDialog}
        onOpenChange={setShowSplitDialog}
        pimId={id!}
        pimCodigo={pim.codigo}
        onSplit={handleSplit}
        isSplitting={splitPIM.isPending}
      />
    </div>
  );
}
