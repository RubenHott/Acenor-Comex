import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrackingStageBar } from '@/components/tracking/TrackingStageBar';
import { TrackingChecklist } from '@/components/tracking/TrackingChecklist';
import { TrackingTimeline } from '@/components/tracking/TrackingTimeline';
import { TrackingNoteDialog } from '@/components/tracking/TrackingNoteDialog';
import { SplitPIMDialog } from '@/components/tracking/SplitPIMDialog';
import { DocumentUploadPanel } from '@/components/tracking/DocumentUploadPanel';
import { RequiredDocumentsPanel } from '@/components/tracking/RequiredDocumentsPanel';

import { NonConformityPanel } from '@/components/tracking/NonConformityPanel';
import { StageGateSummary } from '@/components/tracking/StageGateSummary';
import { StageResponsableCard } from '@/components/tracking/StageResponsableCard';

import { StageReadOnlyCard } from '@/components/tracking/StageReadOnlyCard';

import { StageStepFlow } from '@/components/tracking/StageStepFlow';
import { PIMCompletedSummary } from '@/components/tracking/PIMCompletedSummary';
import {
  useTrackingStages,
  useChecklistItems,
  useActivityLog,
  useInitializeTracking,
  useToggleChecklistItem,
  useAdvanceStage,
  useAddNote,
  useSplitPIM,
  useCanAdvanceStage,
  useChildPIMs,
  useParentPIM,
  type SplitItemConfig,
} from '@/hooks/usePIMTracking';
import { useStageDocumentStatus } from '@/hooks/usePIMDocuments';
import { useOpenNCCount } from '@/hooks/useNoConformidades';
import {
  TRACKING_STAGES,
  getStageByKey,
  getFilteredChecklist,
  getRequiredDocuments,
} from '@/lib/trackingChecklists';
import {
  ArrowLeft,
  Scissors,
  MessageSquare,
  CheckCircle,
  ArrowRight,
  Lock,
  GitBranch,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { usePIMPermissions } from '@/hooks/usePermissions';
import type { Department } from '@/types/comex';

export default function PIMTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [pim, setPim] = useState<any>(null);
  const [loadingPim, setLoadingPim] = useState(true);
  const [activeStageKey, setActiveStageKey] = useState('revision_contrato');
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showSplitDialog, setShowSplitDialog] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const { data: stages, isLoading: loadingStages } = useTrackingStages(id);
  const { data: checklistItems } = useChecklistItems(id, activeStageKey);
  const { data: allChecklistItems } = useChecklistItems(id);
  const { data: activityLog } = useActivityLog(id);

  const initTracking = useInitializeTracking();
  const toggleItem = useToggleChecklistItem();
  const advanceStage = useAdvanceStage();
  const addNote = useAddNote();
  const splitPIM = useSplitPIM();

  const modalidadPago = pim?.modalidad_pago || '';
  const activeStageDef = getStageByKey(activeStageKey);
  const requiredDocs = useMemo(
    () => getRequiredDocuments(activeStageKey, modalidadPago),
    [activeStageKey, modalidadPago]
  );

  const { data: canAdvanceResult, isLoading: loadingCanAdvance } = useCanAdvanceStage(
    id,
    activeStageKey,
    modalidadPago
  );
  const { data: docStatus } = useStageDocumentStatus(id, requiredDocs);
  const { data: openNCCount = 0 } = useOpenNCCount(id, activeStageKey);

  // Parent / child PIM navigation
  const { data: childPIMs } = useChildPIMs(id);
  const { data: parentPIM } = useParentPIM(pim?.pim_padre_id);

  const currentUser = user?.name || 'Usuario';
  const currentUserId = user?.id;
  const currentUserRole = user?.role as import('@/types/comex').UserRole | undefined;
  const perms = usePIMPermissions();

  const userDepartment = user?.department as Department | undefined;
  const isParticipant = useMemo(() => {
    if (!activeStageDef || !userDepartment) return true;
    if (['admin', 'manager', 'gerente'].includes(currentUserRole || '')) return true;
    return activeStageDef.departments.includes(userDepartment);
  }, [activeStageDef, userDepartment, currentUserRole]);

  const itemDepartments = useMemo(() => {
    const filtered = getFilteredChecklist(activeStageKey, modalidadPago);
    const map = new Map<string, Department>();
    for (const item of filtered) {
      if (item.department) map.set(item.id, item.department);
    }
    return map;
  }, [activeStageKey, modalidadPago]);

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
    if (stages && stages.length === 0 && id && !initTracking.isPending && pim) {
      initTracking.mutate({
        pimId: id,
        modalidadPago: pim.modalidad_pago || '',
        userId: currentUserId,
        userName: currentUser,
      });
    }
  }, [stages, id, pim]);

  // Check if all stages are complete
  const allStagesComplete = stages && stages.length === TRACKING_STAGES.length &&
    stages.every((s) => s.status === 'completado');

  // Set active stage to first en_progreso when stages load, or show summary if all complete
  useEffect(() => {
    if (stages && stages.length > 0) {
      const enProgreso = stages.find((s) => s.status === 'en_progreso');
      if (enProgreso) {
        setActiveStageKey(enProgreso.stage_key);
        setShowSummary(false);
      } else if (stages.every((s) => s.status === 'completado') && stages.length === TRACKING_STAGES.length) {
        setShowSummary(true);
      }
    }
  }, [stages]);

  const activeStage = stages?.find((s) => s.stage_key === activeStageKey);
  const stageItems = checklistItems || [];

  // Stage completion check
  const stageCompletedCount = stageItems.filter((i) => i.completado).length;
  const stageCriticalItems = stageItems.filter((i) => i.critico);
  const stageCriticalCompleted = stageCriticalItems.filter((i) => i.completado).length;
  const stageCriticalPending = stageCriticalItems.length - stageCriticalCompleted;

  const canAdvance = canAdvanceResult?.canAdvance ?? false;

  const handleToggle = (item: any) => {
    toggleItem.mutate({
      itemId: item.id,
      pimId: id!,
      completado: !item.completado,
      usuario: currentUser,
      usuarioId: currentUserId,
      texto: item.texto,
      stageKey: activeStageKey,
      userRole: currentUserRole,
    });
  };

  const handleAdvanceStage = () => {
    if (!activeStage || !activeStageDef) return;

    advanceStage.mutate(
      {
        pimId: id!,
        currentStageKey: activeStageKey,
        modalidadPago,
        usuario: currentUser,
        usuarioId: currentUserId,
        userRole: currentUserRole,
      },
      {
        onSuccess: ({ nextStageKey }) => {
          toast.success(`Etapa "${activeStageDef.name}" completada`);
          if (nextStageKey) {
            setActiveStageKey(nextStageKey);
          }
        },
        onError: (err) => {
          toast.error(err.message || 'No se puede avanzar');
        },
      }
    );
  };

  const handleAddNote = (text: string) => {
    addNote.mutate({
      pimId: id!,
      stageKey: activeStageKey,
      texto: text,
      usuario: currentUser,
      usuarioId: currentUserId,
      userRole: currentUserRole,
    });
    toast.success('Nota agregada');
  };

  const handleSplit = (splitItems: SplitItemConfig[]) => {
    splitPIM.mutate(
      { originalPimId: id!, splitItems, usuario: currentUser, usuarioId: currentUserId, userRole: currentUserRole },
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
        title={`Seguimiento ${pim.codigo_correlativo || pim.codigo}`}
        subtitle={`${pim.codigo_correlativo ? pim.codigo + ' — ' : ''}${pim.descripcion}`}
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
          {modalidadPago && (
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                modalidadPago === 'carta_credito' && 'border-blue-300 bg-blue-50 text-blue-700',
                modalidadPago === 'pago_contado' && 'border-green-300 bg-green-50 text-green-700',
                modalidadPago === 'anticipo' && 'border-yellow-300 bg-yellow-50 text-yellow-700',
              )}
            >
              {modalidadPago === 'carta_credito' ? 'Carta de Credito' : modalidadPago === 'pago_contado' ? 'Pago Contado' : modalidadPago === 'anticipo' ? 'Anticipo' : modalidadPago}
            </Badge>
          )}
          <div className="flex gap-2">
            {perms.canAddNote && (
              <Button variant="outline" size="sm" onClick={() => setShowNoteDialog(true)}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Nota
              </Button>
            )}
            {perms.canSplitPIM && (
              <Button variant="outline" size="sm" onClick={() => setShowSplitDialog(true)}>
                <Scissors className="h-4 w-4 mr-2" />
                Dividir PIM
              </Button>
            )}
          </div>
        </div>

        {/* Parent/Child navigation */}
        {(parentPIM || (childPIMs && childPIMs.length > 0)) && (
          <div className="flex items-center gap-3 flex-wrap text-sm p-3 bg-muted/50 rounded-lg border">
            <GitBranch className="h-4 w-4 text-muted-foreground shrink-0" />
            {parentPIM && (
              <span>
                PIM Padre:{' '}
                <Link
                  to={`/comex/pim/seguimiento/${parentPIM.id}`}
                  className="text-primary font-medium hover:underline"
                >
                  {parentPIM.codigo}
                </Link>
              </span>
            )}
            {childPIMs && childPIMs.length > 0 && (
              <span>
                Sub-PIMs:{' '}
                {childPIMs.map((child, idx) => (
                  <span key={child.id}>
                    {idx > 0 && ', '}
                    <Link
                      to={`/comex/pim/seguimiento/${child.id}`}
                      className="text-primary font-medium hover:underline"
                    >
                      {child.codigo}
                    </Link>
                  </span>
                ))}
              </span>
            )}
          </div>
        )}

        {/* Stage bar */}
        <TrackingStageBar
          stages={stages || []}
          activeStageKey={activeStageKey}
          onStageClick={(key) => {
            const stageIdx = TRACKING_STAGES.findIndex((s) => s.key === key);
            const clickedStage = stages?.find((s) => s.stage_key === key);
            if (clickedStage?.status === 'pendiente' && stageIdx > 0) {
              const prevKey = TRACKING_STAGES[stageIdx - 1].key;
              const prevStage = stages?.find((s) => s.stage_key === prevKey);
              if (prevStage?.status !== 'completado') {
                toast.error('Debe completar el proceso anterior para acceder a esta etapa');
                return;
              }
            }
            setActiveStageKey(key);
            setShowSummary(false);
          }}
          userDepartment={userDepartment}
          userRole={currentUserRole}
          allStagesComplete={!!allStagesComplete}
          showSummary={showSummary}
          onShowSummary={() => setShowSummary(true)}
        />

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-6">
            {showSummary && allStagesComplete ? (
              <PIMCompletedSummary
                pimId={id!}
                pim={pim}
                stages={stages!}
              />
            ) : !isParticipant ? (
              <StageReadOnlyCard
                stageDef={activeStageDef!}
                stage={activeStage}
                checklistItems={stageItems}
                docsUploaded={docStatus ? requiredDocs.length - (docStatus.missingTypes?.length || 0) : 0}
                docsRequired={requiredDocs.length}
                openNCs={openNCCount}
              />
            ) : activeStageDef?.useStepFlow ? (
              /* ===== STEP-FLOW STAGES (e.g., revision_contrato) ===== */
              <StageStepFlow
                pimId={id!}
                stageKey={activeStageKey}
                pim={pim}
                userId={currentUserId}
                userName={currentUser}
                userRole={currentUserRole}
                userDepartment={userDepartment}
              />
            ) : (
            /* ===== CHECKLIST-BASED STAGES (stages 2-6) ===== */
            <>
            {/* Gate Summary - only show for en_progreso stages */}
            {activeStage?.status === 'en_progreso' && (
              <StageGateSummary
                canAdvanceResult={canAdvanceResult}
                isLoading={loadingCanAdvance}
                criticalCompleted={stageCriticalCompleted}
                criticalTotal={stageCriticalItems.length}
                docsUploaded={docStatus ? requiredDocs.length - docStatus.missingTypes.length : 0}
                docsRequired={requiredDocs.length}
                missingDocs={docStatus?.missingTypes}
                openNCs={openNCCount}
              />
            )}

            {/* Checklist */}
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
                  {perms.canAdvanceStage && activeStage?.status === 'en_progreso' && canAdvance && (
                    <Button
                      size="sm"
                      onClick={handleAdvanceStage}
                      disabled={advanceStage.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {advanceStage.isPending ? 'Avanzando...' : 'Completar Etapa'}
                    </Button>
                  )}
                  {perms.canAdvanceStage && activeStage?.status === 'en_progreso' && !canAdvance && stageCriticalPending === 0 && stageCompletedCount > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAdvanceStage}
                      disabled={advanceStage.isPending}
                    >
                      <ArrowRight className="h-4 w-4 mr-1" />
                      Intentar Avanzar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <TrackingChecklist
                  items={stageItems}
                  onToggle={handleToggle}
                  disabled={activeStage?.status === 'completado' || !perms.canToggleChecklist}
                  userDepartment={userDepartment}
                  itemDepartments={itemDepartments}
                  userRole={currentUserRole}
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

            {/* Non-Conformity Panel */}
            {currentUserId && (
              <NonConformityPanel
                pimId={id!}
                stageKey={activeStageKey}
                stageName={activeStageDef?.name}
                userId={currentUserId}
                userName={currentUser}
                readOnly={!perms.canCreateNC}
              />
            )}

            {/* Documents panel - structured by required docs */}
            <RequiredDocumentsPanel
              pimId={id!}
              stageKey={activeStageKey}
              stageName={activeStageDef?.name}
              requiredDocTypes={requiredDocs}
              usuario={currentUser}
              readOnly={!perms.canUploadDocument}
              pimCodigo={pim.codigo_correlativo || pim.codigo}
            />

            </>
            )}
          </div>

          {/* Right column: Responsable + Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stage Responsable */}
            <StageResponsableCard
              pimId={id!}
              activeStageKey={activeStageKey}
              stages={stages || []}
              canAssign={perms.canAssignStage}
              usuario={currentUser}
              usuarioId={currentUserId}
              userRole={currentUserRole}
            />

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
        pimCodigo={pim.codigo_correlativo || pim.codigo}
        onSplit={handleSplit}
        isSplitting={splitPIM.isPending}
      />
    </div>
  );
}
