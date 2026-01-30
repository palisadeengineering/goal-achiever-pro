'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { MetricQuestion, GenerateMetricQuestionsResponse } from '@/app/api/ai/generate-metric-questions/route';

// Types for the chat flow
export type ChatFlowState =
  | 'vision_input'
  | 'generating_questions'
  | 'asking_questions'
  | 'generating_metrics'
  | 'showing_metrics'
  | 'quarterly_approval'
  | 'generating_breakdown'
  | 'breakdown_approval'
  | 'affirmation_300'
  | 'complete';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    type?: 'vision' | 'question' | 'answer' | 'metrics' | 'plan' | 'approval' | 'edit';
    questionId?: string;
    planSection?: 'quarterly' | 'monthly' | 'weekly' | 'daily';
  };
}

export interface MetricAnswer {
  questionId: string;
  question: string;
  answer: string; // Natural language input like "$1 million", "AU$500k", "20 hours"
  type: 'number' | 'text' | 'currency' | 'percentage' | 'time';
  category: 'outcome' | 'activity';
  unit?: string;
}

export interface TreeNode {
  id: string;
  title: string;
  description?: string;
  level: 'quarterly' | 'monthly' | 'weekly' | 'daily';
  parentId?: string;
  children: TreeNode[];
  kpi?: {
    currentValue: string;
    targetValue: string;
    unit: string;
  };
  isEditing?: boolean;
  status?: 'building' | 'ready' | 'approved';
}

export interface PlannerState {
  // Flow state
  flowState: ChatFlowState;

  // Vision
  visionId: string | null;
  visionText: string;
  visionSummary: string;

  // Questions and answers
  questions: MetricQuestion[];
  currentQuestionIndex: number;
  answers: MetricAnswer[];

  // Generated plan
  plan: GeneratedPlan | null;
  treeNodes: TreeNode[];

  // SMART and affirmation
  smartSummary: SmartSummary | null;
  affirmation: string;
  threeHundredPercent: {
    clarity: number;
    belief: number;
    consistency: number;
  };

  // UI state
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  editingNodeId: string | null;

  // Auto-save
  lastSavedAt: Date | null;
  hasUnsavedChanges: boolean;
}

export interface SmartSummary {
  specific: string;
  measurable: string;
  attainable: string;
  realistic: string;
  timeBound: string;
}

interface PlanKpi {
  currentValue: number;
  targetValue: number;
  unit: string;
}

interface DailyAction {
  title: string;
  description: string;
}

interface WeeklyTarget {
  weekNumber: number;
  title: string;
  description: string;
  dailyActions: DailyAction[];
}

interface MonthlyTarget {
  month: number;
  title: string;
  description: string;
  kpi?: PlanKpi;
  weeklyTargets: WeeklyTarget[];
}

interface QuarterlyTarget {
  quarter: number;
  title: string;
  description: string;
  kpi?: PlanKpi;
  monthlyTargets: MonthlyTarget[];
}

interface DailyHabit {
  title: string;
  description: string;
}

export interface GeneratedPlan {
  quarterlyTargets: QuarterlyTarget[];
  dailyHabits: DailyHabit[];
  smartSummary: SmartSummary;
  suggestedAffirmation: string;
  successFormula: string;
  totalEstimatedHours: number;
}

type PlannerAction =
  | { type: 'SET_FLOW_STATE'; payload: ChatFlowState }
  | { type: 'SET_VISION'; payload: { text: string; id?: string } }
  | { type: 'SET_VISION_SUMMARY'; payload: string }
  | { type: 'SET_QUESTIONS'; payload: MetricQuestion[] }
  | { type: 'NEXT_QUESTION' }
  | { type: 'ADD_ANSWER'; payload: MetricAnswer }
  | { type: 'SET_PLAN'; payload: GeneratedPlan }
  | { type: 'SET_TREE_NODES'; payload: TreeNode[] }
  | { type: 'UPDATE_TREE_NODE'; payload: { id: string; updates: Partial<TreeNode> } }
  | { type: 'SET_EDITING_NODE'; payload: string | null }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SMART_SUMMARY'; payload: SmartSummary }
  | { type: 'SET_AFFIRMATION'; payload: string }
  | { type: 'SET_300_PERCENT'; payload: { clarity?: number; belief?: number; consistency?: number } }
  | { type: 'MARK_SAVED' }
  | { type: 'MARK_UNSAVED' }
  | { type: 'RESET' }
  | { type: 'LOAD_STATE'; payload: Partial<PlannerState> };

const initialState: PlannerState = {
  flowState: 'vision_input',
  visionId: null,
  visionText: '',
  visionSummary: '',
  questions: [],
  currentQuestionIndex: 0,
  answers: [],
  plan: null,
  treeNodes: [],
  smartSummary: null,
  affirmation: '',
  threeHundredPercent: { clarity: 0, belief: 0, consistency: 0 },
  messages: [],
  isLoading: false,
  error: null,
  editingNodeId: null,
  lastSavedAt: null,
  hasUnsavedChanges: false,
};

function plannerReducer(state: PlannerState, action: PlannerAction): PlannerState {
  switch (action.type) {
    case 'SET_FLOW_STATE':
      return { ...state, flowState: action.payload, hasUnsavedChanges: true };

    case 'SET_VISION':
      return {
        ...state,
        visionText: action.payload.text,
        visionId: action.payload.id || state.visionId,
        hasUnsavedChanges: true,
      };

    case 'SET_VISION_SUMMARY':
      return { ...state, visionSummary: action.payload };

    case 'SET_QUESTIONS':
      return {
        ...state,
        questions: action.payload,
        currentQuestionIndex: 0,
      };

    case 'NEXT_QUESTION':
      return {
        ...state,
        currentQuestionIndex: Math.min(
          state.currentQuestionIndex + 1,
          state.questions.length - 1
        ),
      };

    case 'ADD_ANSWER':
      return {
        ...state,
        answers: [...state.answers.filter(a => a.questionId !== action.payload.questionId), action.payload],
        hasUnsavedChanges: true,
      };

    case 'SET_PLAN':
      return {
        ...state,
        plan: action.payload,
        smartSummary: action.payload.smartSummary,
        affirmation: action.payload.suggestedAffirmation,
        hasUnsavedChanges: true,
      };

    case 'SET_TREE_NODES':
      return { ...state, treeNodes: action.payload };

    case 'UPDATE_TREE_NODE':
      return {
        ...state,
        treeNodes: updateNodeInTree(state.treeNodes, action.payload.id, action.payload.updates),
        hasUnsavedChanges: true,
      };

    case 'SET_EDITING_NODE':
      return { ...state, editingNodeId: action.payload };

    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_SMART_SUMMARY':
      return { ...state, smartSummary: action.payload, hasUnsavedChanges: true };

    case 'SET_AFFIRMATION':
      return { ...state, affirmation: action.payload, hasUnsavedChanges: true };

    case 'SET_300_PERCENT':
      return {
        ...state,
        threeHundredPercent: { ...state.threeHundredPercent, ...action.payload },
        hasUnsavedChanges: true,
      };

    case 'MARK_SAVED':
      return { ...state, lastSavedAt: new Date(), hasUnsavedChanges: false };

    case 'MARK_UNSAVED':
      return { ...state, hasUnsavedChanges: true };

    case 'RESET':
      return initialState;

    case 'LOAD_STATE':
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

// Helper function to update a node in the tree
function updateNodeInTree(nodes: TreeNode[], id: string, updates: Partial<TreeNode>): TreeNode[] {
  return nodes.map(node => {
    if (node.id === id) {
      return { ...node, ...updates };
    }
    if (node.children.length > 0) {
      return { ...node, children: updateNodeInTree(node.children, id, updates) };
    }
    return node;
  });
}

// Context interface
interface MetricsChatContextValue {
  state: PlannerState;
  dispatch: React.Dispatch<PlannerAction>;

  // Convenience actions
  setVision: (text: string, id?: string) => void;
  submitVision: (visionText?: string) => Promise<void>;
  submitAllAnswers: (answers?: MetricAnswer[]) => Promise<void>;
  approveSection: (section: 'metrics' | 'quarterly' | 'breakdown' | 'complete') => void;
  editNode: (nodeId: string) => void;
  saveNodeEdit: (nodeId: string, updates: Partial<TreeNode>) => void;
  cancelNodeEdit: () => void;
  reset: () => void;
}

const MetricsChatContext = createContext<MetricsChatContextValue | null>(null);

// Storage key for auto-save
const STORAGE_KEY = 'metrics-planner-state';

export function MetricsChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(plannerReducer, initialState);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        // Don't restore if it's in a completed or empty state
        if (parsed.flowState !== 'complete' && parsed.visionText) {
          dispatch({ type: 'LOAD_STATE', payload: parsed });
        }
      }
    } catch (e) {
      console.error('Failed to load saved planner state:', e);
    }
  }, []);

  // Auto-save to localStorage when state changes
  useEffect(() => {
    if (state.hasUnsavedChanges && state.visionText) {
      try {
        const stateToSave = {
          flowState: state.flowState,
          visionId: state.visionId,
          visionText: state.visionText,
          visionSummary: state.visionSummary,
          questions: state.questions,
          currentQuestionIndex: state.currentQuestionIndex,
          answers: state.answers,
          plan: state.plan,
          treeNodes: state.treeNodes,
          smartSummary: state.smartSummary,
          affirmation: state.affirmation,
          threeHundredPercent: state.threeHundredPercent,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
        dispatch({ type: 'MARK_SAVED' });
      } catch (e) {
        console.error('Failed to save planner state:', e);
      }
    }
  }, [state.hasUnsavedChanges, state]);

  // Set vision text
  const setVision = useCallback((text: string, id?: string) => {
    dispatch({ type: 'SET_VISION', payload: { text, id } });
  }, []);

  // Submit vision and get questions
  const submitVision = useCallback(async (visionText?: string) => {
    const vision = visionText || state.visionText;
    if (!vision.trim()) return;

    // Update state with vision if provided
    if (visionText) {
      dispatch({ type: 'SET_VISION', payload: { text: visionText } });
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_FLOW_STATE', payload: 'generating_questions' });
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: crypto.randomUUID(),
        role: 'user',
        content: vision,
        timestamp: new Date(),
        metadata: { type: 'vision' },
      },
    });

    try {
      // First, create a Vision record in the database
      const createVisionResponse = await fetch('/api/visions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: vision.slice(0, 100), // Use first 100 chars as title
          description: vision,
          status: 'draft',
        }),
      });

      let visionId: string | undefined = undefined;
      if (createVisionResponse.ok) {
        const visionData = await createVisionResponse.json();
        // API returns { vision: { id: ... } }
        visionId = visionData.vision?.id || visionData.id;
        dispatch({ type: 'SET_VISION', payload: { text: vision, id: visionId } });
      }

      const response = await fetch('/api/ai/generate-metric-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ vision }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate questions');
      }

      const data: GenerateMetricQuestionsResponse = await response.json();

      dispatch({ type: 'SET_QUESTIONS', payload: data.questions });
      dispatch({ type: 'SET_VISION_SUMMARY', payload: data.visionSummary });
      dispatch({ type: 'SET_FLOW_STATE', payload: 'asking_questions' });
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Great vision! "${data.visionSummary}"\n\nTo create a realistic plan, I need to understand where you are now. Please answer the ${data.questions.length} questions below:`,
          timestamp: new Date(),
          metadata: { type: 'question' },
        },
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to generate questions. Please try again.' });
      dispatch({ type: 'SET_FLOW_STATE', payload: 'vision_input' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.visionText]);

  // Submit all answers and generate plan
  // Accepts answers directly to avoid race condition with React state updates
  const submitAllAnswers = useCallback(async (answersToSubmit?: MetricAnswer[]) => {
    const answers = answersToSubmit || state.answers;
    if (answers.length < 3) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_FLOW_STATE', payload: 'generating_metrics' });
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Perfect! Based on your answers, I\'m now generating a realistic plan tailored to your current situation...',
        timestamp: new Date(),
      },
    });

    try {
      const response = await fetch('/api/ai/generate-plan-from-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          vision: state.visionText,
          metrics: answers,
          visionId: state.visionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate plan');
      }

      const data = await response.json();

      dispatch({ type: 'SET_PLAN', payload: data.plan });
      dispatch({ type: 'SET_TREE_NODES', payload: planToTreeNodes(data.plan) });
      dispatch({ type: 'SET_FLOW_STATE', payload: 'showing_metrics' });
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Here's your personalized plan! It includes ${data.plan.quarterlyTargets?.length || 4} quarterly targets and ${data.plan.dailyHabits?.length || 0} daily habits.\n\nReview the metrics in the tree view. Click any item to edit it. When you're ready, approve to continue.`,
          timestamp: new Date(),
          metadata: { type: 'metrics' },
        },
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to generate plan. Please try again.' });
      dispatch({ type: 'SET_FLOW_STATE', payload: 'asking_questions' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.visionText, state.answers, state.visionId]);

  // Approve a section and move forward
  const approveSection = useCallback((section: 'metrics' | 'quarterly' | 'breakdown' | 'complete') => {
    switch (section) {
      case 'metrics':
        dispatch({ type: 'SET_FLOW_STATE', payload: 'quarterly_approval' });
        dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'Great! Now review your quarterly targets. These are your major milestones for the year.',
            timestamp: new Date(),
            metadata: { type: 'approval', planSection: 'quarterly' },
          },
        });
        break;
      case 'quarterly':
        dispatch({ type: 'SET_FLOW_STATE', payload: 'breakdown_approval' });
        dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'Excellent! Now let\'s look at the monthly and weekly breakdown. These are the stepping stones to your quarterly goals.',
            timestamp: new Date(),
            metadata: { type: 'approval', planSection: 'monthly' },
          },
        });
        break;
      case 'breakdown':
        // Skip 300% Rule (moved to daily check-ins) - go directly to complete
        dispatch({ type: 'SET_FLOW_STATE', payload: 'complete' });
        dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `Your vision plan is complete and saved! You can view and track your progress from the Vision page.\n\nYour daily check-ins will include the 300% Rule to track your confidence over time.`,
            timestamp: new Date(),
          },
        });
        // Clear localStorage on completion
        localStorage.removeItem(STORAGE_KEY);
        break;
      case 'complete':
        dispatch({ type: 'SET_FLOW_STATE', payload: 'complete' });
        dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: '🎉 Your plan is complete and saved! You can view and track your progress from the Vision page. Come back anytime to refine your plan.',
            timestamp: new Date(),
          },
        });
        // Clear localStorage on completion
        localStorage.removeItem(STORAGE_KEY);
        break;
    }
  }, [state.affirmation]);

  // Edit a tree node
  const editNode = useCallback((nodeId: string) => {
    dispatch({ type: 'SET_EDITING_NODE', payload: nodeId });
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: crypto.randomUUID(),
        role: 'system',
        content: 'Editing paused while you make changes...',
        timestamp: new Date(),
        metadata: { type: 'edit' },
      },
    });
  }, []);

  // Save node edit
  const saveNodeEdit = useCallback((nodeId: string, updates: Partial<TreeNode>) => {
    dispatch({ type: 'UPDATE_TREE_NODE', payload: { id: nodeId, updates } });
    dispatch({ type: 'SET_EDITING_NODE', payload: null });
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Got it! I've updated "${updates.title || 'the item'}". The rest of the plan will adapt to this change.`,
        timestamp: new Date(),
      },
    });
  }, []);

  // Cancel node edit
  const cancelNodeEdit = useCallback(() => {
    dispatch({ type: 'SET_EDITING_NODE', payload: null });
  }, []);

  // Set 300% scores
  const set300Percent = useCallback((scores: { clarity?: number; belief?: number; consistency?: number }) => {
    dispatch({ type: 'SET_300_PERCENT', payload: scores });
  }, []);

  // Reset the planner
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value: MetricsChatContextValue = {
    state,
    dispatch,
    setVision,
    submitVision,
    submitAllAnswers,
    approveSection,
    editNode,
    saveNodeEdit,
    cancelNodeEdit,
    reset,
  };

  return (
    <MetricsChatContext.Provider value={value}>
      {children}
    </MetricsChatContext.Provider>
  );
}

export function useMetricsChat() {
  const context = useContext(MetricsChatContext);
  if (!context) {
    throw new Error('useMetricsChat must be used within a MetricsChatProvider');
  }
  return context;
}

// Helper function to convert plan to tree nodes
function planToTreeNodes(plan: GeneratedPlan | null): TreeNode[] {
  if (!plan) return [];

  const nodes: TreeNode[] = [];

  // Add quarterly targets
  for (const qt of plan.quarterlyTargets || []) {
    const quarterlyNode: TreeNode = {
      id: `q${qt.quarter}`,
      title: qt.title,
      description: qt.description,
      level: 'quarterly',
      children: [],
      kpi: qt.kpi ? {
        currentValue: qt.kpi.currentValue,
        targetValue: qt.kpi.targetValue,
        unit: qt.kpi.unit,
      } : undefined,
      status: 'ready',
    };

    // Add monthly targets
    for (const mt of qt.monthlyTargets || []) {
      const monthlyNode: TreeNode = {
        id: `q${qt.quarter}-m${mt.month}`,
        title: mt.title,
        description: mt.description,
        level: 'monthly',
        parentId: quarterlyNode.id,
        children: [],
        kpi: mt.kpi ? {
          currentValue: mt.kpi.currentValue,
          targetValue: mt.kpi.targetValue,
          unit: mt.kpi.unit,
        } : undefined,
        status: 'ready',
      };

      // Add weekly targets
      for (const wt of mt.weeklyTargets || []) {
        const weeklyNode: TreeNode = {
          id: `q${qt.quarter}-m${mt.month}-w${wt.weekNumber}`,
          title: wt.title,
          description: wt.description,
          level: 'weekly',
          parentId: monthlyNode.id,
          children: [],
          status: 'ready',
        };

        // Add daily actions as leaf nodes
        for (let i = 0; i < (wt.dailyActions || []).length; i++) {
          const da = wt.dailyActions[i];
          weeklyNode.children.push({
            id: `q${qt.quarter}-m${mt.month}-w${wt.weekNumber}-d${i}`,
            title: da.title,
            description: da.description,
            level: 'daily',
            parentId: weeklyNode.id,
            children: [],
            status: 'ready',
          });
        }

        monthlyNode.children.push(weeklyNode);
      }

      quarterlyNode.children.push(monthlyNode);
    }

    nodes.push(quarterlyNode);
  }

  // Add daily habits as separate root nodes
  for (let i = 0; i < (plan.dailyHabits || []).length; i++) {
    const habit = plan.dailyHabits[i];
    nodes.push({
      id: `habit-${i}`,
      title: `🔄 ${habit.title}`,
      description: habit.description,
      level: 'daily',
      children: [],
      status: 'ready',
    });
  }

  return nodes;
}
