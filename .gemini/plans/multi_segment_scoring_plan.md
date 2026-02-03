# 🏔️ Plano de Implementação: Etapas com Múltiplos Segmentos Pontuáveis

## ✅ STATUS: IMPLEMENTADO (Fases 1-9 Completas)

**Data:** 2026-02-03  
**Ficheiros Criados/Modificados:**
- ✅ `supabase/migrations/20260203_stage_segments.sql` - Nova migração
- ✅ `src/hooks/useSegments.ts` - Hook completo com tipos e funções
- ✅ `src/components/admin/SegmentManager.tsx` - UI para gerir segmentos
- ✅ `src/components/admin/SegmentResultsEditor.tsx` - UI para validar resultados
- ✅ `src/components/admin/StageManager.tsx` - Integrado com SegmentManager
- ✅ `supabase/functions/strava-process-stage/index.ts` - Atualizado para segmentos
- ✅ `src/components/KOMLeaderboard.tsx` - Leaderboard público com design polka-dot

---

## 📌 Objetivo
Permitir que cada **etapa (Stage)** de um evento tenha **múltiplos segmentos/subidas** associados, cada um com:
- Nome próprio
- Categoria (HC, Cat 1, Cat 2, Cat 3, Cat 4)
- Escala de pontos personalizável (ex: 15/12/10/8 para os 4 primeiros)

## 🎯 Exemplo Real (Imagem do UAE Tour / PolKEO)

```
┌──────────┬──────────────────────────────┬──────────┬────────────────┐
│  Stage   │         Climb Name           │ Category │   KOM Points   │
├──────────┼──────────────────────────────┼──────────┼────────────────┤
│    1     │ Jebel Hafeet (ascent 1)      │  Cat 1   │ 15 / 12 / 10 / 8 │
│    1     │ Jebel Hafeet (ascent 2)      │  Cat 1   │ 15 / 12 / 10 / 8 │
│    2     │ Jebel Jais (Queen climb)     │   HC     │ 20 / 15 / 12 / 10│
│    3     │        –                     │ (No KOM) │        –         │
│    4     │ East Coast Short Hill        │  Cat 4   │  5 /  3 /  2 / 1 │
│    4     │ Returning to Huwayalat Hill  │  Cat 4   │  5 /  3 /  2 / 1 │
└──────────┴──────────────────────────────┴──────────┴────────────────┘
```

---

## 🏗️ Arquitetura da Solução

### Novo Modelo de Dados

```
┌─────────────────────────────────────────────────────────────────────┐
│                           EVENTS                                    │
│  id | title | date | mode (social/competitive) | ...                │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ 1:N
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         EVENT_STAGES                                │
│  id | event_id | name | date | stage_order | image_url              │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ 1:N (NOVO!)
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      STAGE_SEGMENTS (NOVA TABELA)                   │
│  id | stage_id | strava_segment_id | name | category | points_scale │
│                                                                     │
│  Exemplo:                                                           │
│  - strava_segment_id: "12345678"                                    │
│  - name: "Jebel Hafeet (ascent 1)"                                  │
│  - category: "cat1" | "cat2" | "cat3" | "cat4" | "hc"               │
│  - points_scale: [15, 12, 10, 8]  (JSONB - 1º ao 4º lugar)          │
│  - segment_order: 1 (ordem de aparição na etapa)                    │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ 1:N (por participante)
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   SEGMENT_RESULTS (NOVA TABELA)                     │
│  id | stage_id | segment_id | user_id | elapsed_time | position     │
│      | points_earned                                                │
│                                                                     │
│  - Guarda a posição e pontos de cada rider em cada segmento        │
│  - Permite ranking detalhado por segmento                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Fases de Implementação

### **FASE 1: Migração de Base de Dados** ⏱️ ~1h
📁 `supabase/migrations/20260203_stage_segments.sql`

```sql
-- 1. Nova tabela para segmentos de etapa
CREATE TABLE stage_segments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stage_id UUID REFERENCES event_stages(id) ON DELETE CASCADE NOT NULL,
    strava_segment_id TEXT NOT NULL,
    name TEXT NOT NULL,
    distance_meters NUMERIC,
    avg_grade_percent NUMERIC,
    category TEXT CHECK (category IN ('hc', 'cat1', 'cat2', 'cat3', 'cat4')),
    points_scale INTEGER[] DEFAULT ARRAY[15, 12, 10, 8], -- Pontos para 1º, 2º, 3º, 4º
    segment_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(stage_id, strava_segment_id)
);

-- 2. Nova tabela para resultados por segmento
CREATE TABLE segment_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stage_id UUID REFERENCES event_stages(id) ON DELETE CASCADE NOT NULL,
    segment_id UUID REFERENCES stage_segments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    strava_effort_id TEXT,
    elapsed_time_seconds INTEGER NOT NULL,
    position INTEGER,           -- 1º, 2º, 3º...
    points_earned INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'official', 'dq')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(segment_id, user_id)
);

-- 3. Políticas RLS
ALTER TABLE stage_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE segment_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read segments" ON stage_segments FOR SELECT USING (true);
CREATE POLICY "Creators manage segments" ON stage_segments FOR ALL USING (
    EXISTS (
        SELECT 1 FROM event_stages es
        JOIN events e ON e.id = es.event_id
        WHERE es.id = stage_segments.stage_id AND e.creator_id = auth.uid()
    )
);

CREATE POLICY "Public read segment results" ON segment_results FOR SELECT USING (true);
CREATE POLICY "Creators manage segment results" ON segment_results FOR ALL USING (
    EXISTS (
        SELECT 1 FROM stage_segments ss
        JOIN event_stages es ON es.id = ss.stage_id
        JOIN events e ON e.id = es.event_id
        WHERE ss.id = segment_results.segment_id AND e.creator_id = auth.uid()
    )
);
```

---

### **FASE 2: Tipos TypeScript** ⏱️ ~30min
📁 `src/types/index.ts` ou `src/hooks/useStages.ts`

```typescript
// Novo tipo para Segmentos
export interface StageSegment {
    id: string;
    stage_id: string;
    strava_segment_id: string;
    name: string;
    distance_meters?: number;
    avg_grade_percent?: number;
    category: 'hc' | 'cat1' | 'cat2' | 'cat3' | 'cat4';
    points_scale: number[];  // [15, 12, 10, 8]
    segment_order: number;
}

// Novo tipo para Resultados de Segmento
export interface SegmentResult {
    id: string;
    segment_id: string;
    user_id: string;
    elapsed_time_seconds: number;
    position?: number;
    points_earned: number;
    status: 'pending' | 'official' | 'dq';
    profile?: {
        full_name: string;
        avatar_url?: string;
    };
}

// Atualizar EventStage para incluir segmentos
export interface EventStage {
    id: string;
    event_id: string;
    name: string;
    date: string;
    stage_order: number;
    segments?: StageSegment[];  // NOVO
    // Deprecated (manter para backward compatibility)
    mountain_segment_ids?: string[];
}
```

---

### **FASE 3: Hook de Segmentos** ⏱️ ~1h
📁 `src/hooks/useSegments.ts` (NOVO FICHEIRO)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { StageSegment, SegmentResult } from '../types';

// Buscar segmentos de uma etapa
export function useStageSegments(stageId?: string) {
    return useQuery({
        queryKey: ['segments', stageId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('stage_segments')
                .select('*')
                .eq('stage_id', stageId)
                .order('segment_order');
            if (error) throw error;
            return data as StageSegment[];
        },
        enabled: !!stageId
    });
}

// Criar segmento
export function useCreateSegment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (segment: Omit<StageSegment, 'id'>) => {
            const { data, error } = await supabase
                .from('stage_segments')
                .insert(segment)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: ['segments', vars.stage_id] });
        }
    });
}

// Eliminar segmento
export function useDeleteSegment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('stage_segments')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['segments'] });
        }
    });
}

// Buscar resultados de um segmento
export function useSegmentResults(segmentId?: string) {
    return useQuery({
        queryKey: ['segment-results', segmentId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('segment_results')
                .select(`
                    *,
                    profile:profiles(full_name, avatar_url)
                `)
                .eq('segment_id', segmentId)
                .order('elapsed_time_seconds');
            if (error) throw error;
            return data as SegmentResult[];
        },
        enabled: !!segmentId
    });
}

// Constantes de pontos por categoria (default)
export const CATEGORY_DEFAULTS: Record<string, { points: number[], color: string }> = {
    hc:   { points: [20, 15, 12, 10], color: '#ef4444' },  // Red
    cat1: { points: [15, 12, 10, 8],  color: '#f97316' },  // Orange
    cat2: { points: [10, 8, 6, 4],    color: '#eab308' },  // Yellow
    cat3: { points: [6, 4, 2, 1],     color: '#22c55e' },  // Green
    cat4: { points: [5, 3, 2, 1],     color: '#3b82f6' },  // Blue
};
```

---

### **FASE 4: Novo Componente `SegmentManager`** ⏱️ ~2h
📁 `src/components/admin/SegmentManager.tsx` (NOVO)

```
┌────────────────────────────────────────────────────────────────────┐
│  ⛰️ Manage KOM Segments                                   [ X ]   │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ ⛰ Segment 1                                        [ Edit ]  │  │
│  │                                                              │  │
│  │   Name: Jebel Hafeet (ascent 1)                              │  │
│  │   Strava ID: 12345678                                        │  │
│  │   Category: [Cat 1 ▼]  Distance: 12.1 km  Gradient: 6.3%     │  │
│  │   Points: 15 / 12 / 10 / 8                                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ ⛰ Segment 2                                    [🗑️] [ Edit ] │  │
│  │   Name: Jebel Hafeet (ascent 2)                              │  │
│  │   ...                                                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ┐  │
│  │           ➕ Add New Segment                                 │  │
│  └ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ┘  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**Funcionalidades:**
- Lista todos os segmentos de uma etapa
- Permite adicionar/editar/remover segmentos
- Campos: Nome, Strava ID, Categoria (dropdown), Pontos personalizáveis
- Preview dos pontos baseado na categoria

---

### **FASE 5: Integração no `StageManager`** ⏱️ ~1h
📁 `src/components/admin/StageManager.tsx`

**Alterações:**
1. Adicionar botão "Manage Segments" em cada card de etapa
2. Abrir modal `SegmentManager` ao clicar
3. Mostrar count de segmentos: "3 Segments ⛰️"

```diff
// No card de cada etapa, adicionar:
+ <button onClick={() => setSelectedStageForSegments(stage.id)}>
+     <Mountain className="w-4 h-4" /> 
+     Manage Segments ({stage.segments?.length || 0})
+ </button>

// No final do componente:
+ {selectedStageForSegments && (
+     <SegmentManager 
+         stageId={selectedStageForSegments} 
+         onClose={() => setSelectedStageForSegments(null)} 
+     />
+ )}
```

---

### **FASE 6: Atualizar Edge Function** ⏱️ ~2h
📁 `supabase/functions/strava-process-stage/index.ts`

**Nova lógica:**
1. Buscar `stage_segments` em vez de `mountain_segment_ids`
2. Para cada segmento, encontrar o `segment_effort` correspondente
3. Guardar tempo e criar entrada em `segment_results`
4. Após todos sync, calcular posições e atribuir pontos

```typescript
// Pseudo-código da nova lógica
async function processParticipant(p, stage, segments) {
    const activity = await getStravaActivity(p.user_id, stage.date);
    const efforts = activity.segment_efforts || [];
    
    for (const segment of segments) {
        const effort = efforts.find(e => 
            e.segment.id.toString() === segment.strava_segment_id
        );
        
        if (effort) {
            await supabase.from('segment_results').upsert({
                segment_id: segment.id,
                stage_id: stage.id,
                user_id: p.user_id,
                strava_effort_id: effort.id.toString(),
                elapsed_time_seconds: effort.elapsed_time,
                status: 'pending'
            });
        }
    }
}

// Depois de processar todos os participantes:
async function calculatePositionsAndPoints(segmentId, pointsScale) {
    // Ordenar por tempo
    const results = await supabase
        .from('segment_results')
        .select('*')
        .eq('segment_id', segmentId)
        .order('elapsed_time_seconds');
    
    // Atribuir posições e pontos
    for (let i = 0; i < results.length; i++) {
        const points = pointsScale[i] || 0; // 0 se fora do top 4
        await supabase.from('segment_results').update({
            position: i + 1,
            points_earned: points
        }).eq('id', results[i].id);
    }
}
```

---

### **FASE 7: Novo Componente `SegmentResultsEditor`** ⏱️ ~1.5h
📁 `src/components/admin/SegmentResultsEditor.tsx` (NOVO)

Similar ao `ResultsEditor`, mas para validar resultados por segmento:

```
┌──────────────────────────────────────────────────────────────────┐
│  ⛰️ Segment Results: Jebel Hafeet (ascent 1)          [Publish] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Pos │ Athlete          │ Time     │ Points │ Status             │
│ ───────────────────────────────────────────────────────          │
│   1  │ João Silva       │ 32:15    │  15    │ ✅ Official        │
│   2  │ Pedro Costa      │ 33:02    │  12    │ ⚠️ Pending         │
│   3  │ Ana Martins      │ 34:45    │  10    │ ⚠️ Pending         │
│   4  │ Carlos Ferreira  │ 35:22    │   8    │ ⚠️ Pending         │
│   5  │ Maria Santos     │ 36:10    │   0    │ ⚠️ Pending         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

### **FASE 8: Atualizar Mountain Classification** ⏱️ ~1h
📁 `src/hooks/useResults.ts` ou criar `useKOMClassification.ts`

**Nova query:**
```sql
SELECT 
    user_id,
    SUM(points_earned) as total_points,
    COUNT(*) as segments_completed,
    profiles.full_name,
    profiles.avatar_url
FROM segment_results
JOIN stage_segments ON stage_segments.id = segment_results.segment_id
JOIN event_stages ON event_stages.id = stage_segments.stage_id
WHERE event_stages.event_id = $event_id
  AND segment_results.status = 'official'
GROUP BY user_id, profiles.full_name, profiles.avatar_url
ORDER BY total_points DESC;
```

---

### **FASE 9: UI Pública - KOM Leaderboard** ⏱️ ~1.5h
📁 `src/components/KOMLeaderboard.tsx` (NOVO ou atualizar `Leaderboard.tsx`)

```
┌─────────────────────────────────────────────────────────────────┐
│  👕 PolKEO - KOM Classification                                 │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  🥇  João Silva          │  47 pts  │  8 segments         │  │
│  │  🥈  Pedro Costa         │  35 pts  │  7 segments         │  │
│  │  🥉  Ana Martins         │  28 pts  │  6 segments         │  │
│  │  4.  Carlos Ferreira     │  22 pts  │  5 segments         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  📊 Breakdown by Stage                                          │
│  ──────────────────────────────────────────────────────────     │
│  Stage 1: Jebel Hafeet x2                                       │
│   - Jebel Hafeet (ascent 1): 🥇João (15pts)                     │
│   - Jebel Hafeet (ascent 2): 🥇Pedro (15pts)                    │
│                                                                 │
│  Stage 2: Jebel Jais                                            │
│   - Queen Climb (HC): 🥇João (20pts)                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Resumo das Entregas

| Fase | Ficheiro | Tipo | Tempo Est. |
|------|----------|------|------------|
| 1 | `20260203_stage_segments.sql` | Migration | 1h |
| 2 | `src/types/index.ts` | Types | 30min |
| 3 | `src/hooks/useSegments.ts` | Hook (NOVO) | 1h |
| 4 | `src/components/admin/SegmentManager.tsx` | Component (NOVO) | 2h |
| 5 | `src/components/admin/StageManager.tsx` | Update | 1h |
| 6 | `strava-process-stage/index.ts` | Edge Fn Update | 2h |
| 7 | `src/components/admin/SegmentResultsEditor.tsx` | Component (NOVO) | 1.5h |
| 8 | `src/hooks/useKOMClassification.ts` | Hook (NOVO) | 1h |
| 9 | `src/components/KOMLeaderboard.tsx` | Component (NOVO) | 1.5h |

**⏱️ Tempo Total Estimado: ~11.5 horas**

---

## ✅ Exemplo Prático: Criar Evento com 4 Etapas

### Passo 1: Criar Evento
- Título: "PolKEO UAE Tour 2026"
- Mode: Competitive
- Data Início: 01/03/2026

### Passo 2: Adicionar Etapas
| Stage | Nome | Data |
|-------|------|------|
| 1 | Jebel Hafeet Double Assault | 01/03 |
| 2 | Jebel Jais Summit | 02/03 |
| 3 | Coastal Cruise (No KOM) | 03/03 |
| 4 | Huwayalat Hills | 04/03 |

### Passo 3: Configurar Segmentos para Stage 1
| Segment | Strava ID | Categoria | Pontos |
|---------|-----------|-----------|--------|
| Jebel Hafeet (ascent 1) | 628341 | Cat 1 | 15/12/10/8 |
| Jebel Hafeet (ascent 2) | 628341 | Cat 1 | 15/12/10/8 |

### Passo 4: Repetir para Stage 2 e 4...

---

## 🎯 Próximos Passos

1. **Aprovar plano** - Confirmar estrutura
2. **Fase 1** - Criar migração SQL
3. **Fase 2-3** - Tipos e Hooks
4. **Fase 4-5** - UI Admin
5. **Fase 6** - Edge Function
6. **Fase 7-9** - Resultados e Leaderboard

**Queres que avance com a implementação?** 🚀
