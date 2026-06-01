'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import {
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Pencil,
  Trash2,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  DollarSign,
  PiggyBank,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Star,
  Crown,
  PartyPopper,
  Wallet,
  Activity,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  LogOut,
  RefreshCw,
  Eye,
  EyeOff,
  Cloud,
  CloudOff,
  Settings as SettingsIcon,
  Key,
  AlertTriangle,
  RotateCcw,
  Calculator,
  Clock,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
// Sheet/Menu removed - using bottom nav on mobile instead
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { DynamicIcon } from '@/components/dynamic-icon';

import { Settings, Transaction, Category, Goal, GoalItem, Stats, Account } from '@/lib/types';
import * as api from '@/lib/api';
import * as sync from '@/lib/sync';
import { formatCurrency, formatDate, formatDateShort, formatPercent, getMonthYear } from '@/lib/format';

// ─── Helpers ───────────────────────────────────────────────────
const FADE_IN = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.3 },
};

const GOAL_COLORS = [
  '#ec4899', '#8b5cf6', '#06b6d4', '#22c55e', '#f97316',
  '#ef4444', '#eab308', '#6366f1', '#14b8a6', '#f43f5e',
];

// ─── Main App ──────────────────────────────────────────────────
export default function Home() {
  // ── Auth State ──
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authToken, setAuthToken] = useState('');
  const [gistId, setGistId] = useState('');
  const [githubUser, setGithubUser] = useState('');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [isFirstTime, setIsFirstTime] = useState(true); // true = create password, false = login

  // Login form state
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ── State ──
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'goals' | 'plan'>('dashboard');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Account dialog
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [newAccount, setNewAccount] = useState({ name: '', icon: 'Wallet', color: '#3b82f6', balance: '' });

  // Transaction filters
  const [txFilterType, setTxFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [txFilterMonth, setTxFilterMonth] = useState('');
  const [txSearch, setTxSearch] = useState('');

  // Expanded goal
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);

  // Dialogs
  const [showAddTx, setShowAddTx] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddSavings, setShowAddSavings] = useState<Goal | null>(null);
  const [showEditBalance, setShowEditBalance] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: string; name?: string } | null>(null);
  const [showAddItem, setShowAddItem] = useState<string | null>(null);

  // Settings dialog
  const [showSettings, setShowSettings] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showChangeToken, setShowChangeToken] = useState(false);
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [changePassError, setChangePassError] = useState('');
  const [changePassLoading, setChangePassLoading] = useState(false);
  const [showChangePassFields, setShowChangePassFields] = useState(false);
  const [newToken, setNewToken] = useState('');
  const [newTokenError, setNewTokenError] = useState('');
  const [newTokenLoading, setNewTokenLoading] = useState(false);
  const [showSyncSetup, setShowSyncSetup] = useState(false);
  const [syncSetupToken, setSyncSetupToken] = useState('');
  const [syncSetupError, setSyncSetupError] = useState('');
  const [syncSetupLoading, setSyncSetupLoading] = useState(false);

  // Form states
  const [newTx, setNewTx] = useState({ type: 'expense' as 'income' | 'expense', amount: '', description: '', categoryId: '', accountId: '', date: new Date() });

  // Quick add helpers
  const openAddExpense = () => {
    setNewTx({ type: 'expense', amount: '', description: '', categoryId: '', accountId: accounts.length > 0 ? accounts[0].id : '', date: new Date() });
    setShowAddTx(true);
  };
  const openAddIncome = () => {
    setNewTx({ type: 'income', amount: '', description: '', categoryId: '', accountId: accounts.length > 0 ? accounts[0].id : '', date: new Date() });
    setShowAddTx(true);
  };
  const [newGoal, setNewGoal] = useState({ name: '', description: '', targetAmount: '', deadline: undefined as Date | undefined, color: '#6366f1' });
  const [savingsAmount, setSavingsAmount] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [newItem, setNewItem] = useState({ name: '', estimatedCost: '' });

  // Excel import state
  const [showImportExcel, setShowImportExcel] = useState(false);
  const [importPreview, setImportPreview] = useState<{ date: Date; amount: number; description: string }[]>([]);
  const [importCategory, setImportCategory] = useState('');
  const [importError, setImportError] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [editingItemCost, setEditingItemCost] = useState<{ goalId: string; itemId: string; cost: string } | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // ── Data loading ──
  const loadAllData = useCallback(async () => {
    try {
      const [s, t, c, g, st] = await Promise.all([
        api.getSettings(),
        api.getTransactions(),
        api.getCategories(),
        api.getGoals(),
        api.getStats(),
      ]);
      setSettings(s);
      setTransactions(t);
      setCategories(c);
      setGoals(g);
      setAccounts(api.getAccounts());
      setStats(st);
    } catch {
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, []);

  // Trigger sync after any data change
  const triggerSync = useCallback(() => {
    if (authToken && gistId) {
      sync.scheduleSync(authToken, gistId, setSyncStatus);
    }
  }, [authToken, gistId]);

  // Wrapper that loads data AND syncs to cloud
  const loadAndSync = useCallback(async () => {
    await loadAllData();
    triggerSync();
  }, [loadAllData, triggerSync]);

  // ── Login / Auto-login ──
  const handleLogin = async (password: string) => {
    setLoginLoading(true);
    setLoginError('');
    try {
      if (isFirstTime) {
        // Create new password
        if (password.length < 4) {
          setLoginError('La contraseña debe tener al menos 4 caracteres.');
          setLoginLoading(false);
          return;
        }
        await sync.createPassword(password);
        setIsLoggedIn(true);
        setGithubUser('');
        toast.success('Cuenta creada. Bienvenido a MiFinanzas!');
      } else {
        // Verify existing password
        const valid = await sync.verifyPassword(password);
        if (!valid) {
          setLoginError('Contraseña incorrecta.');
          setLoginLoading(false);
          return;
        }
        setIsLoggedIn(true);
        setGithubUser('');
        toast.success('Bienvenido de vuelta!');
      }
      // Check if there's a stored sync token
      const stored = sync.getStoredAuth();
      if (stored) {
        setAuthToken(stored.token);
        setGistId(stored.gistId);
        setGithubUser(stored.username);
        const remoteData = await sync.loadFromGist(stored.token, stored.gistId);
        if (remoteData) {
          sync.applyRemoteData(remoteData);
        }
        // CRITICAL: Reload data after sync to update React state with corrected data
        await loadAllData();
        // Push corrected data (with projected incomes) to Gist immediately
        try {
          const correctedData = sync.gatherLocalData();
          await sync.saveToGist(stored.token, stored.gistId, correctedData);
        } catch {}
      }
    } catch {
      setLoginError('Error inesperado. Intenta de nuevo.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    sync.cancelPendingSync();
    sync.clearStoredAuth();
    setAuthToken('');
    setGistId('');
    setGithubUser('');
    setIsLoggedIn(false);
    setSyncStatus('idle');
    setIsFirstTime(false);
    toast.info('Sesion cerrada.');
  };

  const handleForceSync = async () => {
    if (!authToken || !gistId) return;
    setSyncStatus('syncing');
    try {
      const data = sync.gatherLocalData();
      const ok = await sync.saveToGist(authToken, gistId, data);
      if (ok) {
        toast.success('Datos sincronizados');
        setSyncStatus('synced');
      } else {
        toast.error('Error al sincronizar');
        setSyncStatus('error');
      }
    } catch {
      toast.error('Error de conexion');
      setSyncStatus('error');
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await api.seedData();
      } catch {}
      // Check if password exists → determine first time vs returning user
      const hasPass = sync.hasPassword();
      if (hasPass) {
        setIsFirstTime(false);
        // Auto-login if there's a stored session marker
        const sessionActive = localStorage.getItem('mf_session');
        if (sessionActive) {
          setIsLoggedIn(true);
          const stored = sync.getStoredAuth();
          if (stored) {
            setAuthToken(stored.token);
            setGistId(stored.gistId);
            setGithubUser(stored.username);
            const remoteData = await sync.loadFromGist(stored.token, stored.gistId);
            if (remoteData) {
              sync.applyRemoteData(remoteData);
            }
          } else {
            setGithubUser('');
          }
        }
      } else {
        setIsFirstTime(true);
      }
      await loadAllData();

      // CRITICAL: After migrations fix localStorage, immediately push corrected data to Gist
      // This prevents the sync loop where Gist keeps overwriting fixed data
      const st = sync.getStoredAuth();
      if (st) {
        try {
          const correctedData = sync.gatherLocalData();
          await sync.saveToGist(st.token, st.gistId, correctedData);
        } catch {}
      }
    })();
  }, [loadAllData]);

  // ── Transaction CRUD ──
  const handleCreateTx = async () => {
    if (!newTx.amount || !newTx.description) {
      toast.error('Completa todos los campos requeridos');
      return;
    }
    try {
      await api.createTransaction({
        type: newTx.type,
        amount: parseFloat(newTx.amount),
        description: newTx.description,
        categoryId: newTx.categoryId || undefined,
        accountId: newTx.accountId || undefined,
        date: newTx.date.toISOString(),
      });
      toast.success('Transacción creada');
      setShowAddTx(false);
      setNewTx({ type: 'expense', amount: '', description: '', categoryId: '', accountId: accounts.length > 0 ? accounts[0].id : '', date: new Date() });
      await loadAndSync();
    } catch {
      toast.error('Error al crear transacción');
    }
  };

  const handleDeleteTx = async (id: string) => {
    try {
      await api.deleteTransaction(id);
      toast.success('Transacción eliminada');
      setDeleteConfirm(null);
      await loadAndSync();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleSaveEditTx = async () => {
    if (!editingTx) return;
    try {
      await api.updateTransaction(editingTx.id, {
        type: editingTx.type,
        amount: editingTx.amount,
        description: editingTx.description,
        categoryId: editingTx.categoryId,
        accountId: editingTx.accountId,
        date: editingTx.date,
      });
      toast.success('Transacción actualizada');
      setEditingTx(null);
      await loadAndSync();
    } catch {
      toast.error('Error al actualizar');
    }
  };

  // ── Account CRUD ──
  const handleCreateAccount = async () => {
    if (!newAccount.name || newAccount.balance === '') {
      toast.error('Completa nombre y saldo inicial');
      return;
    }
    try {
      await api.createAccount({
        name: newAccount.name,
        icon: newAccount.icon,
        color: newAccount.color,
        balance: parseFloat(newAccount.balance) || 0,
      });
      toast.success('Cuenta creada');
      setShowAddAccount(false);
      setNewAccount({ name: '', icon: 'Wallet', color: '#3b82f6', balance: '' });
      setAccounts(api.getAccounts());
    } catch {
      toast.error('Error al crear cuenta');
    }
  };

  const handleUpdateAccount = async () => {
    if (!editingAccount || !newAccount.name || newAccount.balance === '') return;
    try {
      await api.updateAccount(editingAccount.id, {
        name: newAccount.name,
        icon: newAccount.icon,
        color: newAccount.color,
        balance: parseFloat(newAccount.balance) || 0,
      });
      toast.success('Cuenta actualizada');
      setEditingAccount(null);
      setNewAccount({ name: '', icon: 'Wallet', color: '#3b82f6', balance: '' });
      setAccounts(api.getAccounts());
    } catch {
      toast.error('Error al actualizar cuenta');
    }
  };

  const handleDeleteAccount = async (id: string) => {
    try {
      await api.deleteAccount(id);
      toast.success('Cuenta eliminada');
      setDeleteConfirm(null);
      setAccounts(api.getAccounts());
    } catch {
      toast.error('Error al eliminar cuenta');
    }
  };

  // ── Goal CRUD ──
  const handleCreateGoal = async () => {
    if (!newGoal.name || !newGoal.targetAmount) {
      toast.error('Completa nombre y monto objetivo');
      return;
    }
    try {
      await api.createGoal({
        name: newGoal.name,
        description: newGoal.description || undefined,
        targetAmount: parseFloat(newGoal.targetAmount),
        deadline: newGoal.deadline?.toISOString(),
        color: newGoal.color,
      });
      toast.success('Meta creada');
      setShowAddGoal(false);
      setNewGoal({ name: '', description: '', targetAmount: '', deadline: undefined, color: '#6366f1' });
      await loadAndSync();
    } catch {
      toast.error('Error al crear meta');
    }
  };

  const handleAddSavings = async () => {
    if (!showAddSavings || !savingsAmount) return;
    try {
      const newSaved = showAddSavings.savedAmount + parseFloat(savingsAmount);
      await api.updateGoal({ id: showAddSavings.id, savedAmount: newSaved });
      toast.success('Ahorro agregado');
      setShowAddSavings(null);
      setSavingsAmount('');
      await loadAndSync();
    } catch {
      toast.error('Error al agregar ahorro');
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      await api.deleteGoal(id);
      toast.success('Meta eliminada');
      setDeleteConfirm(null);
      await loadAndSync();
    } catch {
      toast.error('Error al eliminar meta');
    }
  };

  // ── Goal Item CRUD ──
  const handleToggleItemPaid = async (goalId: string, item: GoalItem) => {
    try {
      await api.updateGoalItem(goalId, {
        itemId: item.id,
        isPaid: !item.isPaid,
      });
      toast.success(item.isPaid ? 'Item desmarcado' : 'Item marcado como pagado');
      await loadAndSync();
    } catch {
      toast.error('Error al actualizar item');
    }
  };

  const handleToggleProjectedIncome = async (goalId: string, incomeId: string, desc: string) => {
    try {
      await api.toggleProjectedIncome(goalId, incomeId);
      toast.success(`Ingreso "${desc}" marcado como recibido`);
      await loadAndSync();
    } catch {
      toast.error('Error al actualizar ingreso proyectado');
    }
  };

  const handleUpdateItemCost = async () => {
    if (!editingItemCost) return;
    try {
      const item = goals.find(g => g.id === editingItemCost.goalId)?.items.find(i => i.id === editingItemCost.itemId);
      if (!item) return;
      await api.updateGoalItem(editingItemCost.goalId, {
        itemId: editingItemCost.itemId,
        actualCost: parseFloat(editingItemCost.cost),
        isPaid: true,
      });
      toast.success('Costo actualizado');
      setEditingItemCost(null);
      await loadAndSync();
    } catch {
      toast.error('Error al actualizar costo');
    }
  };

  const handleCreateItem = async () => {
    if (!showAddItem || !newItem.name || !newItem.estimatedCost) return;
    try {
      await api.createGoalItem(showAddItem, {
        name: newItem.name,
        estimatedCost: parseFloat(newItem.estimatedCost),
      });
      toast.success('Item agregado');
      setShowAddItem(null);
      setNewItem({ name: '', estimatedCost: '' });
      await loadAndSync();
    } catch {
      toast.error('Error al crear item');
    }
  };

  // ── Excel Import ──
  const handleExcelFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    setImportPreview([]);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: (string | number | undefined)[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

      if (rows.length < 2) {
        setImportError('El archivo está vacío o no tiene datos suficientes.');
        return;
      }

      const parsed: { date: Date; amount: number; description: string }[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rawDate = row[0];
        const rawAmount = row[1];

        // Skip header row or empty rows
        if (!rawDate && !rawAmount) continue;
        if (typeof rawDate === 'string' && rawDate.toLowerCase().match(/fecha|date|columna|col/)) continue;
        if (typeof rawAmount === 'string' && rawAmount.toLowerCase().match(/gasto|amount|monto|columna|col/)) continue;

        // Parse date - supports Excel serial dates, Date objects, and string formats
        let parsedDate: Date | null = null;
        if (typeof rawDate === 'number') {
          // Excel serial date
          parsedDate = new Date((rawDate - 25569) * 86400 * 1000);
        } else if (rawDate instanceof Date) {
          parsedDate = rawDate;
        } else if (typeof rawDate === 'string' && rawDate.trim()) {
          // Try common date formats
          const trimmed = rawDate.trim();
          // dd/mm/yyyy or dd-mm-yyyy
          const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
          if (dmyMatch) {
            const day = parseInt(dmyMatch[1]);
            const month = parseInt(dmyMatch[2]) - 1;
            let year = parseInt(dmyMatch[3]);
            if (year < 100) year += 2000;
            parsedDate = new Date(year, month, day);
          } else {
            const fallback = new Date(trimmed);
            if (!isNaN(fallback.getTime())) parsedDate = fallback;
          }
        }

        // Parse amount
        let amount = 0;
        if (typeof rawAmount === 'number') {
          amount = Math.abs(rawAmount);
        } else if (typeof rawAmount === 'string') {
          const cleaned = rawAmount.replace(/[$,.\s]/g, (match, offset, str) => {
            // Keep only the last period as decimal separator
            const lastDot = str.lastIndexOf('.');
            const lastComma = str.lastIndexOf(',');
            if (match === '.' && offset === lastDot && lastDot > lastComma) return '.';
            if (match === ',' && offset === lastComma && lastComma > lastDot) return '.';
            return '';
          });
          const num = parseFloat(cleaned);
          if (!isNaN(num)) amount = Math.abs(num);
        }

        if (parsedDate && !isNaN(parsedDate.getTime()) && amount > 0) {
          parsed.push({
            date: parsedDate,
            amount: Math.round(amount * 100) / 100,
            description: `Importado Excel (fila ${i + 1})`,
          });
        }
      }

      if (parsed.length === 0) {
        setImportError('No se encontraron filas válidas. Asegurate que la columna A tenga fechas y la columna B tenga montos.');
        return;
      }

      // Sort by date ascending
      parsed.sort((a, b) => a.date.getTime() - b.date.getTime());
      setImportPreview(parsed);
      setImportCategory(expenseCategories.length > 0 ? expenseCategories[0].id : '');
    } catch (err) {
      setImportError('Error al leer el archivo. Asegurate que sea un .xlsx o .csv válido.');
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImportExcel = async () => {
    if (importPreview.length === 0 || !importCategory) return;
    setImporting(true);
    try {
      let imported = 0;
      for (const item of importPreview) {
        await api.createTransaction({
          type: 'expense',
          amount: item.amount,
          description: item.description,
          categoryId: importCategory,
          date: item.date.toISOString(),
        });
        imported++;
      }
      toast.success(`${imported} gastos importados correctamente`);
      setShowImportExcel(false);
      setImportPreview([]);
      setImportError('');
      await loadAndSync();
    } catch {
      toast.error('Error al importar gastos');
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteItem = async (goalId: string, itemId: string) => {
    try {
      await api.deleteGoalItem(goalId, itemId);
      toast.success('Item eliminado');
      await loadAndSync();
    } catch {
      toast.error('Error al eliminar item');
    }
  };

  // ── Settings ──
  const handleResetAllData = async () => {
    // Clear ALL localStorage data including password
    const allKeys = ['mf_settings', 'mf_categories', 'mf_transactions', 'mf_goals', 'mf_accounts', 'mf_seeded', 'mf_auth_token', 'mf_gist_id', 'mf_github_user', 'mf_last_sync', 'mf_pass_hash', 'mf_pass_salt', 'mf_session'];
    for (const key of allKeys) {
      localStorage.removeItem(key);
    }
    // Reset state
    sync.cancelPendingSync();
    setAuthToken('');
    setGistId('');
    setGithubUser('');
    setIsLoggedIn(false);
    setSyncStatus('idle');
    setIsFirstTime(true);
    setSettings(null);
    setTransactions([]);
    setCategories([]);
    setGoals([]);
    setStats(null);
    setShowResetConfirm(false);
    setShowSettings(false);
    toast.success('Todos los datos fueron eliminados. La app se reinicio.');
  };

  const handleChangePassword = async () => {
    setChangePassError('');
    if (!showChangePassFields) {
      // Step 1: verify current password
      if (!currentPassInput) {
        setChangePassError('Ingresa tu contraseña actual.');
        return;
      }
      setChangePassLoading(true);
      const valid = await sync.verifyPassword(currentPassInput);
      setChangePassLoading(false);
      if (!valid) {
        setChangePassError('Contraseña actual incorrecta.');
        return;
      }
      setShowChangePassFields(true);
      return;
    }
    // Step 2: set new password
    if (!newPassInput || newPassInput.length < 4) {
      setChangePassError('La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }
    if (newPassInput !== confirmPassInput) {
      setChangePassError('Las contraseñas no coinciden.');
      return;
    }
    setChangePassLoading(true);
    const ok = await sync.changePassword(currentPassInput, newPassInput);
    setChangePassLoading(false);
    if (ok) {
      setShowChangePassword(false);
      setCurrentPassInput('');
      setNewPassInput('');
      setConfirmPassInput('');
      setShowChangePassFields(false);
      toast.success('Contraseña cambiada correctamente.');
    } else {
      setChangePassError('Error al cambiar la contraseña.');
    }
  };

  const handleSetupSync = async () => {
    if (!syncSetupToken.trim()) {
      setSyncSetupError('Ingresa un token de GitHub.');
      return;
    }
    setSyncSetupLoading(true);
    setSyncSetupError('');
    try {
      const username = await sync.getGitHubUser(syncSetupToken.trim());
      const gid = await sync.findOrCreateGist(syncSetupToken.trim());
      sync.setStoredAuth(syncSetupToken.trim(), gid, username);
      setAuthToken(syncSetupToken.trim());
      setGistId(gid);
      setGithubUser(username);

      // CRITICAL: First try to LOAD remote data before saving local
      const remoteData = await sync.loadFromGist(syncSetupToken.trim(), gid);
      if (remoteData) {
        // Check if remote has actual data (not empty)
        const hasRemoteData = Object.values(remoteData).some(v => v !== null && v !== undefined);
        if (hasRemoteData) {
          sync.applyRemoteData(remoteData);
          await loadAllData();
          // CRITICAL: Push corrected data (with projected incomes) back to Gist
          try {
            const correctedData = sync.gatherLocalData();
            await sync.saveToGist(syncSetupToken.trim(), gid, correctedData);
          } catch {}
          toast.success(`Datos restaurados desde GitHub como ${username}.`);
          setShowSyncSetup(false);
          setSyncSetupToken('');
          return;
        }
      }

      // No remote data or empty gist → push local data
      const data = sync.gatherLocalData();
      await sync.saveToGist(syncSetupToken.trim(), gid, data);
      setShowSyncSetup(false);
      setSyncSetupToken('');
      toast.success(`Sincronizacion configurada como ${username}.`);
    } catch (err: any) {
      if (err.message === 'TOKEN_INVALID') {
        setSyncSetupError('Token invalido.');
      } else if (err.message === 'TOKEN_FORBIDDEN' || err.message === 'GIST_CREATE_FORBIDDEN') {
        setSyncSetupError('Sin permisos de gist. Necesitas el scope gist.');
      } else {
        setSyncSetupError('Error de conexion.');
      }
    } finally {
      setSyncSetupLoading(false);
    }
  };

  const handleDisconnectSync = () => {
    sync.cancelPendingSync();
    sync.clearStoredAuth();
    setAuthToken('');
    setGistId('');
    setGithubUser('');
    setSyncStatus('idle');
    setShowSettings(false);
    toast.info('Sincronizacion desactivada. Tus datos siguen en este dispositivo.');
  };

  const handleUpdateBalance = async () => {
    try {
      await api.updateSettings({ initialBalance: parseFloat(initialBalance) || 0 });
      toast.success('Saldo inicial actualizado');
      setShowEditBalance(false);
      localStorage.setItem('mf_session', '1');
      await loadAndSync();
    } catch {
      toast.error('Error al actualizar saldo');
    }
  };

  // ── Filtered transactions ──
  const filteredTransactions = transactions.filter((t) => {
    if (txFilterType !== 'all' && t.type !== txFilterType) return false;
    if (txSearch && !t.description.toLowerCase().includes(txSearch.toLowerCase())) return false;
    if (txFilterMonth) {
      const tMonth = getMonthYear(new Date(t.date));
      if (tMonth !== txFilterMonth) return false;
    }
    return true;
  });

  const filteredTotalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const filteredTotalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');
  const txCategories = newTx.type === 'income' ? incomeCategories : expenseCategories;

  const currentBalance = settings
    ? settings.initialBalance + (stats?.balance ?? 0)
    : 0;

  // ── Sidebar Navigation ──
  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: BarChart3 },
    { id: 'transactions' as const, label: 'Transacciones', icon: Activity },
    { id: 'plan' as const, label: 'Plan de Ahorro', icon: PiggyBank },
    { id: 'goals' as const, label: 'Metas', icon: Target },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">MiFinanzas <span className="text-[9px] text-muted-foreground font-normal">{APP_VERSION}</span></h1>
            <p className="text-xs text-muted-foreground">Control personal</p>
          </div>
        </div>
      </div>
      <Separator />
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant={activeTab === item.id ? 'secondary' : 'ghost'}
            className={`w-full justify-start gap-3 h-11 px-4 font-medium transition-all ${
              activeTab === item.id ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : ''
            }`}
            onClick={() => setActiveTab(item.id)}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Button>
        ))}
      </nav>
      <div className="p-4 border-t space-y-3">
        {/* Sync status */}
        {githubUser && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {syncStatus === 'syncing' ? (
                <RefreshCw className="h-3 w-3 animate-spin text-amber-500" />
              ) : syncStatus === 'synced' ? (
                <Cloud className="h-3 w-3 text-emerald-500" />
              ) : syncStatus === 'error' ? (
                <CloudOff className="h-3 w-3 text-red-500" />
              ) : (
                <Cloud className="h-3 w-3 text-muted-foreground" />
              )}
              <span>
                {syncStatus === 'syncing' ? 'Sincronizando...' : syncStatus === 'synced' ? 'Sincronizado' : syncStatus === 'error' ? 'Error de sync' : githubUser}
              </span>
            </div>
            {syncStatus !== 'syncing' && (
              <button onClick={handleForceSync} className="text-muted-foreground hover:text-foreground">
                <RefreshCw className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {/* Balance */}
        <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <PiggyBank className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Saldo Actual</span>
          </div>
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
            {loading ? <Skeleton className="h-6 w-24" /> : formatCurrency(currentBalance)}
          </p>
        </div>

        {/* Settings + Logout */}
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)} className="flex-1 justify-start gap-2 text-muted-foreground hover:text-foreground h-9">
            <SettingsIcon className="h-4 w-4" />
            Configuracion
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="justify-start gap-2 text-muted-foreground hover:text-red-600 h-9 px-3">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  // ── LOGIN SCREEN ──
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-lg border-slate-200">
            <CardContent className="p-6 sm:p-8 space-y-6">
              {/* Logo */}
              <div className="text-center">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Wallet className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">MiFinanzas</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {isFirstTime ? 'Creá tu contraseña para empezar' : 'Ingresá tu contraseña'}
                </p>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Label htmlFor="login-password">{isFirstTime ? 'Nueva contraseña' : 'Contraseña'}</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Tu contraseña"
                    value={loginPassword}
                    onChange={(e) => { setLoginPassword(e.target.value); setLoginError(''); }}
                    className="pr-10 text-sm"
                    onKeyDown={(e) => { if (e.key === 'Enter' && loginPassword) handleLogin(loginPassword); }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {loginError && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Login Button */}
              <Button
                onClick={() => handleLogin(loginPassword)}
                disabled={!loginPassword || loginLoading}
                className="w-full h-12 text-base gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                {loginLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {isFirstTime ? 'Creando...' : 'Verificando...'}
                  </>
                ) : (
                  <>
                    {isFirstTime ? <Check className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
                    {isFirstTime ? 'Crear cuenta' : 'Ingresar'}
                  </>
                )}
              </Button>

              {/* Skip option (only for first time) */}
              {isFirstTime && (
                <div className="text-center">
                  <button
                    onClick={() => {
                      setIsLoggedIn(true);
                      setGithubUser('');
                      toast.info('Modo sin contraseña. Tus datos se guardan sin proteccion.');
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    Usar sin contraseña
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ── Loading state ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <p className="text-muted-foreground text-sm">Cargando MiFinanzas...</p>
        </div>
      </div>
    );
  }

  // ─── RENDER ───────────────────────────────────────────────
  // Cache-bust version - forces new chunk hash on every deploy
  const APP_VERSION = 'v3.7-inline-fix';

  return (
    <div className="min-h-screen flex bg-slate-50" data-app-version={APP_VERSION}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r bg-white flex-col fixed h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-base font-bold tracking-tight">MiFinanzas <span className="text-[9px] text-muted-foreground font-normal ml-1">{APP_VERSION}</span></h1>
          </div>
          <div className="flex items-center gap-1.5">
            {githubUser && (
              <div className="flex items-center">
                {syncStatus === 'syncing' ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-500" />
                ) : syncStatus === 'synced' ? (
                  <Cloud className="h-3.5 w-3.5 text-emerald-500" />
                ) : syncStatus === 'error' ? (
                  <CloudOff className="h-3.5 w-3.5 text-red-500" />
                ) : null}
              </div>
            )}
            <button onClick={() => setShowSettings(true)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <SettingsIcon className="h-4.5 w-4.5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t shadow-[0_-2px_10px_rgba(0,0,0,0.06)] safe-area-bottom">
        <div className="flex items-center justify-around h-14">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors ${activeTab === 'dashboard' ? 'text-emerald-600' : 'text-gray-400'}`}
          >
            <BarChart3 className="h-5 w-5" />
            <span className="text-[10px] font-medium">Inicio</span>
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors ${activeTab === 'transactions' ? 'text-emerald-600' : 'text-gray-400'}`}
          >
            <Activity className="h-5 w-5" />
            <span className="text-[10px] font-medium">Movimientos</span>
          </button>
          <button
            onClick={() => setActiveTab('plan')}
            className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors ${activeTab === 'plan' ? 'text-emerald-600' : 'text-gray-400'}`}
          >
            <PiggyBank className="h-5 w-5" />
            <span className="text-[10px] font-medium">Plan</span>
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors ${activeTab === 'goals' ? 'text-emerald-600' : 'text-gray-400'}`}
          >
            <Target className="h-5 w-5" />
            <span className="text-[10px] font-medium">Metas</span>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors text-gray-400"
          >
            <SettingsIcon className="h-5 w-5" />
            <span className="text-[10px] font-medium">Ajustes</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        <div className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-8 pt-14 lg:pt-8 pb-20 lg:pb-8">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" {...FADE_IN}>
                <DashboardTab
                  settings={settings}
                  stats={stats}
                  transactions={transactions}
                  categories={categories}
                  goals={goals}
                  currentBalance={currentBalance}
                  githubUser={githubUser}
                  syncStatus={syncStatus}
                  onEditBalance={() => {
                    setInitialBalance(String(settings?.initialBalance ?? 0));
                    setShowEditBalance(true);
                  }}
                  onViewAllTx={() => setActiveTab('transactions')}
                  onAddIncome={openAddIncome}
                  onAddExpense={openAddExpense}
                  onSetupSync={() => { setShowSyncSetup(true); setSyncSetupToken(''); setSyncSetupError(''); }}
                />
              </motion.div>
            )}
            {activeTab === 'transactions' && (
              <motion.div key="transactions" {...FADE_IN}>
                <TransactionsTab
                  transactions={filteredTransactions}
                  categories={categories}
                  txFilterType={txFilterType}
                  setTxFilterType={setTxFilterType}
                  txFilterMonth={txFilterMonth}
                  setTxFilterMonth={setTxFilterMonth}
                  txSearch={txSearch}
                  setTxSearch={setTxSearch}
                  filteredTotalIncome={filteredTotalIncome}
                  filteredTotalExpense={filteredTotalExpense}
                  onAddTx={() => setShowAddTx(true)}
                  onDeleteTx={(id, desc) => setDeleteConfirm({ type: 'transaction', id, name: desc })}
                  onEditTx={(tx) => setEditingTx({ ...tx })}
                  onImportExcel={() => { setShowImportExcel(true); setImportError(''); setImportPreview([]); }}
                />
              </motion.div>
            )}
            {activeTab === 'goals' && (
              <motion.div key="goals" {...FADE_IN}>
                <GoalsTab
                  goals={goals}
                  expandedGoal={expandedGoal}
                  setExpandedGoal={setExpandedGoal}
                  onAddGoal={() => setShowAddGoal(true)}
                  onAddSavings={(g) => {
                    setShowAddSavings(g);
                    setSavingsAmount('');
                  }}
                  onDeleteGoal={(id, name) => setDeleteConfirm({ type: 'goal', id, name })}
                  onToggleItem={handleToggleItemPaid}
                  onToggleProjectedIncome={handleToggleProjectedIncome}
                  onEditItemCost={(goalId, itemId, cost) => setEditingItemCost({ goalId, itemId, cost: String(cost) })}
                  onDeleteItem={(goalId, itemId) => setDeleteConfirm({ type: 'goalItem', id: itemId, name: goalId + ':' + itemId })}
                  onAddItem={(goalId) => {
                    setShowAddItem(goalId);
                    setNewItem({ name: '', estimatedCost: '' });
                  }}
                />
              </motion.div>
            )}
            {activeTab === 'plan' && (
              <motion.div key="plan" {...FADE_IN}>
                <PlanTab
                  goals={goals}
                  onToggleProjectedIncome={handleToggleProjectedIncome}
                  onAddSavings={(g) => {
                    setShowAddSavings(g);
                    setSavingsAmount('');
                  }}
                  onToggleItem={handleToggleItemPaid}
                  onEditItemCost={(goalId, itemId, cost) => setEditingItemCost({ goalId, itemId, cost: String(cost) })}
                  onDeleteItem={(goalId, itemId) => setDeleteConfirm({ type: 'goalItem', id: itemId, name: goalId + ':' + itemId })}
                  onAddItem={(goalId) => {
                    setShowAddItem(goalId);
                    setNewItem({ name: '', estimatedCost: '' });
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ── DIALOGS ── */}
      {/* Add Transaction */}
      <Dialog open={showAddTx} onOpenChange={setShowAddTx}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Transacción</DialogTitle>
            <DialogDescription>Agrega un ingreso o gasto nuevo</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={newTx.type === 'expense' ? 'destructive' : 'outline'}
                  className={newTx.type === 'expense' ? '' : 'hover:text-rose-600'}
                  onClick={() => setNewTx({ ...newTx, type: 'expense', categoryId: '' })}
                >
                  <ArrowDownRight className="h-4 w-4 mr-2" />
                  Gasto
                </Button>
                <Button
                  type="button"
                  variant={newTx.type === 'income' ? 'default' : 'outline'}
                  className={newTx.type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'hover:text-emerald-600'}
                  onClick={() => setNewTx({ ...newTx, type: 'income', categoryId: '' })}
                >
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Ingreso
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-amount">Monto</Label>
              <Input
                id="tx-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={newTx.amount}
                onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-desc">Descripción</Label>
              <Input
                id="tx-desc"
                placeholder="Ej: Compra en supermercado"
                value={newTx.description}
                onChange={(e) => setNewTx({ ...newTx, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select
                value={newTx.categoryId}
                onValueChange={(v) => setNewTx({ ...newTx, categoryId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {txCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color }} />
                        {c.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cuenta</Label>
              {accounts.length > 0 ? (
                <Select
                  value={newTx.accountId}
                  onValueChange={(v) => setNewTx({ ...newTx, accountId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cuenta" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: a.color }} />
                          {a.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">No hay cuentas creadas. Ve a la sección de Cuentas para agregar una.</p>
              )}
              <p className="text-xs text-muted-foreground">La cuenta afecta el saldo de tu cuenta bancaria</p>
            </div>
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {format(newTx.date, "PPP", { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={newTx.date}
                    onSelect={(d) => d && setNewTx({ ...newTx, date: d })}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTx(false)}>Cancelar</Button>
            <Button onClick={handleCreateTx} className={newTx.type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}>
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Goal */}
      <Dialog open={showAddGoal} onOpenChange={setShowAddGoal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Meta</DialogTitle>
            <DialogDescription>Crea una meta de ahorro</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="goal-name">Nombre</Label>
              <Input
                id="goal-name"
                placeholder="Ej: Vacaciones de verano"
                value={newGoal.name}
                onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-desc">Descripción</Label>
              <Textarea
                id="goal-desc"
                placeholder="Descripción opcional"
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-amount">Monto Objetivo</Label>
              <Input
                id="goal-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={newGoal.targetAmount}
                onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha Límite</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {newGoal.deadline ? format(newGoal.deadline, "PPP", { locale: es }) : 'Seleccionar fecha'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={newGoal.deadline}
                    onSelect={(d) => setNewGoal({ ...newGoal, deadline: d ?? undefined })}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {GOAL_COLORS.map((c) => (
                  <button
                    key={c}
                    className="h-8 w-8 rounded-full border-2 transition-all hover:scale-110"
                    style={{
                      backgroundColor: c,
                      borderColor: newGoal.color === c ? c : 'transparent',
                      boxShadow: newGoal.color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : 'none',
                    }}
                    onClick={() => setNewGoal({ ...newGoal, color: c })}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddGoal(false)}>Cancelar</Button>
            <Button onClick={handleCreateGoal}>Crear Meta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Savings */}
      <Dialog open={!!showAddSavings} onOpenChange={() => setShowAddSavings(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Agregar Ahorro</DialogTitle>
            <DialogDescription>
              Añadir ahorro a: <strong>{showAddSavings?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Ahorrado: {formatCurrency(showAddSavings?.savedAmount ?? 0)}</span>
              <span>Meta: {formatCurrency(showAddSavings?.targetAmount ?? 0)}</span>
            </div>
            <Progress
              value={formatPercent(showAddSavings?.savedAmount ?? 0, showAddSavings?.targetAmount ?? 1)}
              className="h-2"
            />
            <Label htmlFor="savings-amount">Monto a agregar</Label>
            <Input
              id="savings-amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={savingsAmount}
              onChange={(e) => setSavingsAmount(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSavings(null)}>Cancelar</Button>
            <Button onClick={handleAddSavings}>Agregar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Initial Balance */}
      <Dialog open={showEditBalance} onOpenChange={setShowEditBalance}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Saldo Inicial</DialogTitle>
            <DialogDescription>Establece tu saldo inicial para calcular el balance total</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="init-balance">Saldo Inicial</Label>
            <Input
              id="init-balance"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditBalance(false)}>Cancelar</Button>
            <Button onClick={handleUpdateBalance}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Goal Item */}
      <Dialog open={!!showAddItem} onOpenChange={() => setShowAddItem(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nuevo Item</DialogTitle>
            <DialogDescription>Agrega un item a la meta</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item-name">Titulo / Nombre</Label>
              <Input
                id="item-name"
                placeholder="Ej: Salon, Catering, Musica..."
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-cost">Costo Estimado</Label>
              <Input
                id="item-cost"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={newItem.estimatedCost}
                onChange={(e) => setNewItem({ ...newItem, estimatedCost: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddItem(null)}>Cancelar</Button>
            <Button onClick={handleCreateItem}>Agregar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Transaction */}
      <Dialog open={!!editingTx} onOpenChange={() => setEditingTx(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Transacción</DialogTitle>
            <DialogDescription>Modifica los datos de la transacción</DialogDescription>
          </DialogHeader>
          {editingTx && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={editingTx.type === 'expense' ? 'destructive' : 'outline'}
                    className={editingTx.type === 'expense' ? '' : 'hover:text-rose-600'}
                    onClick={() => setEditingTx({ ...editingTx, type: 'expense' })}
                  >
                    <ArrowDownRight className="h-4 w-4 mr-2" />
                    Gasto
                  </Button>
                  <Button
                    type="button"
                    variant={editingTx.type === 'income' ? 'default' : 'outline'}
                    className={editingTx.type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'hover:text-emerald-600'}
                    onClick={() => setEditingTx({ ...editingTx, type: 'income' })}
                  >
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Ingreso
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Monto</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingTx.amount}
                  onChange={(e) => setEditingTx({ ...editingTx, amount: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input
                  value={editingTx.description}
                  onChange={(e) => setEditingTx({ ...editingTx, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select
                  value={editingTx.categoryId || ''}
                  onValueChange={(v) => setEditingTx({ ...editingTx, categoryId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {(editingTx.type === 'income' ? incomeCategories : expenseCategories).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color }} />
                          {c.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {accounts.length > 0 && (
                <div className="space-y-2">
                  <Label>Cuenta</Label>
                  <Select
                    value={editingTx.accountId || ''}
                    onValueChange={(v) => setEditingTx({ ...editingTx, accountId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin cuenta" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: a.color }} />
                            {a.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {format(new Date(editingTx.date), "PPP", { locale: es })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={new Date(editingTx.date)}
                      onSelect={(d) => d && setEditingTx({ ...editingTx, date: d.toISOString() })}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTx(null)}>Cancelar</Button>
            <Button onClick={handleSaveEditTx} className={editingTx?.type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Account */}
      <Dialog open={showAddAccount || !!editingAccount} onOpenChange={() => { setShowAddAccount(false); setEditingAccount(null); setNewAccount({ name: '', icon: 'Wallet', color: '#3b82f6', balance: '' }); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta'}</DialogTitle>
            <DialogDescription>{editingAccount ? 'Modifica los datos de la cuenta' : 'Agrega una cuenta bancaria o efectivo'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                placeholder="Ej: Santander"
                value={newAccount.name}
                onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Saldo inicial</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newAccount.balance}
                onChange={(e) => setNewAccount({ ...newAccount, balance: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280'].map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 transition-transform ${newAccount.color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setNewAccount({ ...newAccount, color: c })}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddAccount(false); setEditingAccount(null); }}>Cancelar</Button>
            <Button onClick={editingAccount ? handleUpdateAccount : handleCreateAccount}>
              {editingAccount ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Cost */}
      <Dialog open={!!editingItemCost} onOpenChange={() => setEditingItemCost(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar Costo Real</DialogTitle>
            <DialogDescription>Actualiza el costo real del item</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="edit-cost">Costo Real</Label>
            <Input
              id="edit-cost"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={editingItemCost?.cost ?? ''}
              onChange={(e) => editingItemCost && setEditingItemCost({ ...editingItemCost, cost: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItemCost(null)}>Cancelar</Button>
            <Button onClick={handleUpdateItemCost}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Excel */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleExcelFile}
      />
      <Dialog open={showImportExcel} onOpenChange={(open) => { setShowImportExcel(open); if (!open) { setImportPreview([]); setImportError(''); } }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              Importar Gastos desde Excel
            </DialogTitle>
            <DialogDescription>
              Subí un archivo Excel (.xlsx) o CSV con fechas y montos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-y-auto">
            {importPreview.length === 0 ? (
              <>
                {/* Upload area */}
                <div
                  className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-all"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium text-sm">Hacé clic para seleccionar archivo</p>
                  <p className="text-xs text-muted-foreground mt-1">.xlsx, .xls o .csv</p>
                  <p className="text-xs text-muted-foreground mt-3 bg-muted rounded-lg px-3 py-2 inline-block">
                    Columna A: Fecha &nbsp;|&nbsp; Columna B: Monto del gasto
                  </p>
                </div>

                {importError && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{importError}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Category selector */}
                <div className="space-y-2">
                  <Label>Categoría para todos los gastos</Label>
                  <Select value={importCategory} onValueChange={setImportCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color }} />
                            {c.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Preview table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Vista previa ({importPreview.length} gastos)</Label>
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground underline"
                      onClick={() => { setImportPreview([]); setImportError(''); }}
                    >
                      Cambiar archivo
                    </button>
                  </div>
                  <div className="border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium text-xs text-muted-foreground">Fecha</th>
                          <th className="text-right px-3 py-2 font-medium text-xs text-muted-foreground">Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.map((item, idx) => (
                          <tr key={idx} className="border-t last:border-0">
                            <td className="px-3 py-2 text-xs">{formatDate(item.date.toISOString())}</td>
                            <td className="px-3 py-2 text-xs text-right font-semibold text-rose-600">{formatCurrency(item.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-muted/30 sticky bottom-0">
                        <tr className="border-t">
                          <td className="px-3 py-2 text-xs font-bold">Total</td>
                          <td className="px-3 py-2 text-xs text-right font-bold text-rose-600">
                            {formatCurrency(importPreview.reduce((s, i) => s + i.amount, 0))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>

          {importPreview.length > 0 && (
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => { setShowImportExcel(false); setImportPreview([]); }}>
                Cancelar
              </Button>
              <Button
                onClick={handleImportExcel}
                disabled={!importCategory || importing}
                className="gap-2"
              >
                {importing ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Importar {importPreview.length} gastos
                  </>
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.type === 'transaction' && `¿Eliminar la transacción "${deleteConfirm.name}"? Esta acción no se puede deshacer.`}
              {deleteConfirm?.type === 'goal' && `¿Eliminar la meta "${deleteConfirm.name}"? Se eliminarán todos sus items también.`}
              {deleteConfirm?.type === 'goalItem' && '¿Eliminar este item? Esta acción no se puede deshacer.'}
              {deleteConfirm?.type === 'account' && `¿Eliminar la cuenta "${deleteConfirm.name}"? Las transacciones no se eliminarán.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleteConfirm) return;
                if (deleteConfirm.type === 'transaction') {
                  handleDeleteTx(deleteConfirm.id);
                } else if (deleteConfirm.type === 'goal') {
                  handleDeleteGoal(deleteConfirm.id);
                } else if (deleteConfirm.type === 'goalItem') {
                  const [goalId, itemId] = deleteConfirm.name!.split(':');
                  handleDeleteItem(goalId, itemId);
                } else if (deleteConfirm.type === 'account') {
                  handleDeleteAccount(deleteConfirm.id);
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Settings Dialog ── */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configuracion</DialogTitle>
            <DialogDescription>Ajustes de la aplicacion</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Edit initial balance */}
            <div
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => { setShowSettings(false); setInitialBalance(String(settings?.initialBalance ?? 0)); setShowEditBalance(true); }}
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Saldo inicial</p>
                  <p className="text-xs text-muted-foreground">Cambiar el monto inicial</p>
                </div>
              </div>
              <span className="text-sm font-medium">{formatCurrency(settings?.initialBalance ?? 0)}</span>
            </div>

            {/* Change password */}
            <div
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => { setShowSettings(false); setShowChangePassword(true); setCurrentPassInput(''); setNewPassInput(''); setConfirmPassInput(''); setShowChangePassFields(false); setChangePassError(''); }}
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Key className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Cambiar contraseña</p>
                  <p className="text-xs text-muted-foreground">Modificar tu contraseña de acceso</p>
                </div>
              </div>
            </div>

            {/* Sync with GitHub */}
            {githubUser ? (
              <>
                {/* Force sync */}
                <div
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => { setShowSettings(false); handleForceSync(); }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <RefreshCw className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Forzar sincronizacion</p>
                      <p className="text-xs text-muted-foreground">Subir datos ahora ({githubUser})</p>
                    </div>
                  </div>
                </div>

                {/* Disconnect sync */}
                <div
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={handleDisconnectSync}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <CloudOff className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Desactivar sincronizacion</p>
                      <p className="text-xs text-muted-foreground">Dejar de sincronizar con GitHub</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => { setShowSettings(false); setShowSyncSetup(true); setSyncSetupToken(''); setSyncSetupError(''); }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Cloud className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Sincronizar entre dispositivos</p>
                    <p className="text-xs text-muted-foreground">Conectar con GitHub para sincronizar</p>
                  </div>
                </div>
              </div>
            )}

            {/* Accounts section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Cuentas</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => { setNewAccount({ name: '', icon: 'Wallet', color: '#3b82f6', balance: '' }); setShowAddAccount(true); }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Agregar
                </Button>
              </div>
              {accounts.length === 0 ? (
                <p className="text-xs text-muted-foreground">No hay cuentas configuradas</p>
              ) : (
                <div className="space-y-2">
                  {accounts.map(a => {
                    const acctStats = api.getAccountStats().find(s => s.account.id === a.id);
                    const currentBal = acctStats?.currentBalance ?? a.balance;
                    return (
                      <div key={a.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: a.color }} />
                          <div>
                            <p className="text-sm font-medium">{a.name}</p>
                            <p className={`text-xs ${currentBal >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              Saldo: {formatCurrency(currentBal)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => { setEditingAccount(a); setNewAccount({ name: a.name, icon: a.icon, color: a.color, balance: String(a.balance) }); }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteConfirm({ type: 'account', id: a.id, name: a.name })}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Separator />

            {/* Reset all data */}
            <div
              className="flex items-center justify-between p-3 rounded-lg border border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer transition-colors"
              onClick={() => { setShowSettings(false); setShowResetConfirm(true); }}
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <RotateCcw className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-600">Restaurar app a cero</p>
                  <p className="text-xs text-muted-foreground">Eliminar todos los datos y configuracion</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Reset Confirm Dialog ── */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Eliminar todos los datos
            </DialogTitle>
            <DialogDescription>
              Esta accion no se puede deshacer. Se van a eliminar:
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3 space-y-1 text-sm text-red-700 dark:text-red-400">
            <p>Todas las transacciones (ingresos y gastos)</p>
            <p>Todas las metas y sus items</p>
            <p>Saldo inicial y categorias personalizadas</p>
            <p>Token de GitHub y sesion</p>
          </div>
          <p className="text-xs text-muted-foreground">
            La app va a volver al estado inicial, como recien instalada.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowResetConfirm(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleResetAllData} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Si, eliminar todo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Change Password Dialog ── */}
      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-blue-600" />
              Cambiar contraseña
            </DialogTitle>
            <DialogDescription>
              {!showChangePassFields
                ? 'Primero verificamos que sos vos ingresando tu contraseña actual.'
                : 'Ahora ingresá tu nueva contraseña.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!showChangePassFields ? (
              <div className="space-y-2">
                <Label htmlFor="current-pass">Contraseña actual</Label>
                <Input
                  id="current-pass"
                  type="password"
                  placeholder="Tu contraseña actual"
                  value={currentPassInput}
                  onChange={(e) => { setCurrentPassInput(e.target.value); setChangePassError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && currentPassInput) handleChangePassword(); }}
                  autoFocus
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="new-pass">Nueva contraseña</Label>
                  <Input
                    id="new-pass"
                    type="password"
                    placeholder="Mínimo 4 caracteres"
                    value={newPassInput}
                    onChange={(e) => { setNewPassInput(e.target.value); setChangePassError(''); }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-pass">Confirmar contraseña</Label>
                  <Input
                    id="confirm-pass"
                    type="password"
                    placeholder="Repetí la nueva contraseña"
                    value={confirmPassInput}
                    onChange={(e) => { setConfirmPassInput(e.target.value); setChangePassError(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && newPassInput && confirmPassInput) handleChangePassword(); }}
                  />
                </div>
              </div>
            )}
            {changePassError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{changePassError}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangePassword(false)}>
              {showChangePassFields ? 'Atras' : 'Cancelar'}
            </Button>
            <Button onClick={handleChangePassword} disabled={changePassLoading} className="gap-2 bg-blue-600 hover:bg-blue-700">
              {changePassLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {showChangePassFields ? 'Guardar' : 'Continuar'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Sync Setup Dialog ── */}
      <Dialog open={showSyncSetup} onOpenChange={setShowSyncSetup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-purple-600" />
              Sincronizar entre dispositivos
            </DialogTitle>
            <DialogDescription>
              Conectá con GitHub para respaldar tus datos. Si ya configuraste sync antes, se restauraran automaticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sync-token">Token de GitHub</Label>
              <Input
                id="sync-token"
                type="password"
                placeholder="ghp_xxxxxxxxxxxx"
                value={syncSetupToken}
                onChange={(e) => { setSyncSetupToken(e.target.value); setSyncSetupError(''); }}
                className="font-mono text-sm"
                onKeyDown={(e) => { if (e.key === 'Enter' && syncSetupToken.trim()) handleSetupSync(); }}
                autoFocus
              />
            </div>
            {syncSetupError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{syncSetupError}</span>
              </div>
            )}
            <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 space-y-2">
              <p className="font-medium text-foreground">Como crear el token:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Andá a github.com → Settings → Developer settings</li>
                <li>Personal access tokens → Tokens (classic)</li>
                <li>Generate new token, marca solo <strong>gist</strong></li>
                <li>Copia el token que empieza con <code className="bg-muted px-1 rounded">ghp_</code></li>
              </ol>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 p-3 text-xs text-blue-800 dark:text-blue-300">
              <p className="font-medium mb-1">Si ya tenias sync configurado:</p>
              <p>Usa el mismo token y tus datos se restauraran automaticamente desde GitHub. No vas a perder nada.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSyncSetup(false)}>Cancelar</Button>
            <Button onClick={handleSetupSync} disabled={!syncSetupToken.trim() || syncSetupLoading} className="gap-2 bg-purple-600 hover:bg-purple-700">
              {syncSetupLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Cloud className="h-4 w-4" />
                  Conectar y restaurar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── DASHBOARD TAB ────────────────────────────────────────────
function DashboardTab({
  settings,
  stats,
  transactions,
  categories,
  goals,
  currentBalance,
  githubUser,
  syncStatus,
  onEditBalance,
  onViewAllTx,
  onAddIncome,
  onAddExpense,
  onSetupSync,
}: {
  settings: Settings | null;
  stats: Stats | null;
  transactions: Transaction[];
  categories: Category[];
  goals: Goal[];
  currentBalance: number;
  githubUser: string;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  onEditBalance: () => void;
  onViewAllTx: () => void;
  onAddIncome: () => void;
  onAddExpense: () => void;
  onSetupSync: () => void;
}) {
  const isBalanceZero = !settings || settings.initialBalance === 0;
  const recentTransactions = transactions.slice(0, 5);
  const activeGoals = goals.filter(g => g.savedAmount < g.targetAmount);
  const chartData = stats?.last6Months ?? [];

  return (
    <div className="space-y-5">
      {/* Header + Quick Actions */}
      <div className="hidden lg:flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground text-xs sm:text-sm">Resumen de tus finanzas</p>
        </div>
      </div>

      {/* Sync Warning Banner */}
      {!githubUser && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.02 }}
        >
          <Card className="border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center shrink-0">
                  <CloudOff className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-amber-900 dark:text-amber-200">Tus datos NO estan respaldados</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 truncate">Si borras el cache del navegador perdes todo. Conecta con GitHub para guardar.</p>
                </div>
              </div>
              <Button
                onClick={onSetupSync}
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
              >
                <Cloud className="h-4 w-4 mr-1.5" />
                Conectar
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick Action Buttons - Gasto & Ingreso */}
      <motion.div
        className="grid grid-cols-2 gap-2.5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <button
          onClick={onAddExpense}
          className="relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 p-3 sm:p-4 text-left shadow-md active:scale-[0.97] transition-transform"
        >
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <ArrowDownRight className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm sm:text-base">Gasto</p>
              <p className="text-rose-100 text-[10px] sm:text-xs">Registrar gasto</p>
            </div>
          </div>
        </button>
        <button
          onClick={onAddIncome}
          className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 sm:p-4 text-left shadow-md active:scale-[0.97] transition-transform"
        >
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <ArrowUpRight className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm sm:text-base">Ingreso</p>
              <p className="text-emerald-100 text-[10px] sm:text-xs">Registrar ingreso</p>
            </div>
          </div>
        </button>
      </motion.div>

      {/* Daily Food Spending Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <DailyFoodIndicator transactions={transactions} />
      </motion.div>

      {/* Initial Balance Card */}
      {isBalanceZero && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">Configura tu saldo inicial</p>
                  <p className="text-xs text-muted-foreground">Para calcular tu balance total correctamente</p>
                </div>
              </div>
              <Button onClick={onEditBalance} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                Configurar
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3 sm:px-6 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Saldo</CardTitle>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEditBalance}>
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-lg sm:text-2xl font-bold">{formatCurrency(currentBalance)}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3 sm:px-6 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Ingresos</CardTitle>
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
              <p className="text-lg sm:text-2xl font-bold text-emerald-600">{formatCurrency(stats?.currentMonthIncome ?? 0)}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">del mes</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3 sm:px-6 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Gastos</CardTitle>
              <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
              <p className="text-lg sm:text-2xl font-bold text-rose-600">{formatCurrency(stats?.currentMonthExpense ?? 0)}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">del mes</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3 sm:px-6 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Metas</CardTitle>
              <Target className="h-3.5 w-3.5 text-violet-500" />
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
              <p className="text-lg sm:text-2xl font-bold">{activeGoals.length}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {goals.length > 0 && goals.every(g => g.savedAmount >= g.targetAmount) ? '¡Completadas!' : `${goals.length - activeGoals.length} listas`}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Accounts summary */}
      {api.getAccounts().length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span className="text-lg">💳</span>
                  Saldos por Cuenta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {api.getAccountStats().map(({ account, income, expense, currentBalance }) => (
                  <div key={account.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: account.color }} />
                      <span className="text-sm font-medium">{account.name}</span>
                    </div>
                    <span className={`text-sm font-bold ${currentBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCurrency(currentBalance)}
                    </span>
                  </div>
                ))}
                <Separator />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Total en cuentas</span>
                  <span className="font-bold text-foreground">
                    {formatCurrency(api.getAccountStats().reduce((s, a) => s + a.currentBalance, 0))}
                  </span>
                </div>
              </CardContent>
            </Card>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expense Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ingresos vs Gastos</CardTitle>
              <CardDescription>Últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                      <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #e2e8f0' }}
                        formatter={(value: number, name: string) => [formatCurrency(value), name === 'income' ? 'Ingresos' : 'Gastos']}
                      />
                      <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} name="income" />
                      <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="expense" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                  No hay datos para mostrar
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Expense Categories */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Categorías de Gasto</CardTitle>
              <CardDescription>Categorías con mayor gasto total</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.topExpenseCategories && stats.topExpenseCategories.length > 0 ? (
                <div className="space-y-3">
                  {stats.topExpenseCategories.map((cat, idx) => {
                    const maxTotal = stats.topExpenseCategories[0].total;
                    return (
                      <div key={cat.name} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground font-medium w-5">#{idx + 1}</span>
                            <DynamicIcon name={cat.icon} className="h-4 w-4" style={{ color: cat.color }} />
                            <span className="font-medium">{cat.name}</span>
                          </div>
                          <span className="font-semibold">{formatCurrency(cat.total)}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: cat.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${(cat.total / maxTotal) * 100}%` }}
                            transition={{ duration: 0.8, delay: idx * 0.1 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                  No hay gastos registrados
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Daily Food Spending Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <DailyFoodChart transactions={transactions} />
      </motion.div>

      {/* Monthly Averages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Promedio Ingreso Mensual</p>
                <p className="text-lg font-bold text-emerald-600">{formatCurrency(stats?.averageMonthlyIncome ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Promedio Gasto Mensual</p>
                <p className="text-lg font-bold text-rose-600">{formatCurrency(stats?.averageMonthlyExpense ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Transacciones Recientes</CardTitle>
            <CardDescription>Últimas 5 transacciones</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onViewAllTx}>
            Ver todas
          </Button>
        </CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <div className="space-y-2">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-9 w-9 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: (tx.category?.color ?? '#6b7280') + '20' }}
                    >
                      <DynamicIcon
                        name={tx.category?.icon ?? 'Tag'}
                        className="h-4 w-4"
                        style={{ color: tx.category?.color ?? '#6b7280' }}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDateShort(tx.date)}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No hay transacciones. ¡Agrega tu primera!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── DAILY FOOD SPENDING INDICATOR ────────────────────────────
const DAILY_FOOD_GOAL = 400;

function DailyFoodIndicator({ transactions }: { transactions: Transaction[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const currentMonth = year + '-' + String(month + 1).padStart(2, '0');
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const currentDay = Math.min(now.getDate(), daysInMonth);
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const monthLabel = monthNames[month] + ' ' + year;

  // Find food category dynamically (matches "Comida" or "Alimentación")
  const foodCategory = transactions.find(t =>
    t.type === 'expense' && t.category &&
    (t.category.name.toLowerCase() === 'comida' || t.category.name.toLowerCase() === 'alimentación')
  )?.category;

  // Get food expenses for current month using the category id or name match
  const foodExpenses = transactions.filter(t => {
    if (t.type !== 'expense') return false;
    if (foodCategory) {
      if (t.categoryId !== foodCategory.id) return false;
    } else {
      if (!t.category || (t.category.name.toLowerCase() !== 'comida' && t.category.name.toLowerCase() !== 'alimentación')) return false;
    }
    const d = new Date(t.date);
    const m = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    return m === currentMonth;
  });

  const totalFoodThisMonth = foodExpenses.reduce((s, t) => s + t.amount, 0);
  const monthlyBudget = DAILY_FOOD_GOAL * daysInMonth;

  // Count unique days with spending for accurate daily average
  const daysWithSpending = new Set(foodExpenses.map(t => new Date(t.date).getDate())).size;
  const dailyAverage = daysWithSpending > 0 ? totalFoodThisMonth / daysWithSpending : 0;

  // Monthly percentage (vs monthly budget, not daily)
  const monthlyPercentage = Math.min(100, Math.round((totalFoodThisMonth / monthlyBudget) * 100));
  const isOverMonthlyBudget = totalFoodThisMonth > monthlyBudget;
  const monthlyRemaining = Math.max(0, monthlyBudget - totalFoodThisMonth);

  // Remaining daily budget for rest of month
  const daysLeft = Math.max(0, daysInMonth - currentDay);
  const remainingDailyBudget = daysLeft > 0 ? Math.max(0, monthlyBudget - totalFoodThisMonth) / daysLeft : 0;

  // Get today's spending
  const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  const todayFoodSpending = foodExpenses
    .filter(t => t.date.startsWith(todayStr))
    .reduce((s, t) => s + t.amount, 0);

  // Status based on monthly budget
  const barColor = isOverMonthlyBudget
    ? '#dc2626'
    : monthlyPercentage > 80 ? '#eab308'
    : '#22c55e';
  const statusBg = isOverMonthlyBudget
    ? 'bg-red-50 border-red-200'
    : monthlyPercentage > 80 ? 'bg-yellow-50 border-yellow-200'
    : 'bg-emerald-50 border-emerald-200';
  const statusIcon = isOverMonthlyBudget
    ? '🔴'
    : monthlyPercentage > 80 ? '🟡'
    : '🟢';
  const statusText = isOverMonthlyBudget
    ? 'Presupuesto excedido'
    : monthlyPercentage > 80 ? 'Cerca del limite'
    : 'Dentro del presupuesto';

  return (
    <Card className={`border ${statusBg}`}>
      <CardContent className="p-4 space-y-4">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{statusIcon}</span>
            <div>
              <p className="font-bold text-sm">Gasto Mensual en Comida</p>
              <p className="text-xs text-muted-foreground">{monthLabel} — Meta: {formatCurrency(DAILY_FOOD_GOAL)}/día ({formatCurrency(monthlyBudget)}/mes)</p>
            </div>
          </div>
          <Badge
            className="text-xs font-semibold px-2.5 py-1"
            variant={isOverMonthlyBudget ? 'destructive' : 'default'}
          >
            {statusText}
          </Badge>
        </div>

        {/* Monthly progress */}
        <div className="space-y-1.5">
          <div className="flex items-end gap-1.5">
            <span className={`text-3xl font-bold ${isOverMonthlyBudget ? 'text-red-600' : 'text-emerald-600'}`}>
              {formatCurrency(totalFoodThisMonth)}
            </span>
            <span className="text-sm text-muted-foreground mb-1">de {formatCurrency(monthlyBudget)} mensual</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {monthlyPercentage}% del presupuesto mensual
            </span>
            <span className="text-muted-foreground">
              {isOverMonthlyBudget
                ? `+${formatCurrency(totalFoodThisMonth - monthlyBudget)} sobre`
                : `${formatCurrency(monthlyRemaining)} disponible`}
            </span>
          </div>
          <div className="h-3 bg-white/80 rounded-full overflow-hidden border border-black/5">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: barColor }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(monthlyPercentage, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 pt-1">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Hoy</p>
            <p className={`text-sm font-bold ${todayFoodSpending > DAILY_FOOD_GOAL ? 'text-red-600' : 'text-foreground'}`}>
              {formatCurrency(todayFoodSpending)}
            </p>
          </div>
          <div className="text-center border-x border-black/5">
            <p className="text-xs text-muted-foreground">Promedio/día</p>
            <p className={`text-sm font-bold ${dailyAverage > DAILY_FOOD_GOAL ? 'text-red-600' : 'text-emerald-600'}`}>
              {formatCurrency(dailyAverage)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Resto del mes</p>
            <p className={`text-sm font-bold ${remainingDailyBudget < DAILY_FOOD_GOAL ? 'text-amber-600' : 'text-emerald-600'}`}>
              {formatCurrency(remainingDailyBudget)}/día
            </p>
          </div>
        </div>

        {/* Info row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground bg-white/60 rounded-lg px-3 py-2">
          <span>{daysWithSpending} {daysWithSpending === 1 ? 'día con gasto' : 'días con gasto'} de {currentDay} transcurridos</span>
          <span>Quedan {daysLeft} {daysLeft === 1 ? 'día' : 'días'}</span>
        </div>

        {/* Tip */}
        {isOverMonthlyBudget && (
          <p className="text-xs text-muted-foreground bg-white/50 rounded-lg px-3 py-2">
            💡 Superaste el presupuesto mensual de comida (<strong className="text-red-600">{formatCurrency(monthlyBudget)}</strong>). Tu promedio por día con gasto es <strong className="text-red-600">{formatCurrency(dailyAverage)}</strong>.
          </p>
        )}
        {!isOverMonthlyBudget && dailyAverage > DAILY_FOOD_GOAL && (
          <p className="text-xs text-muted-foreground bg-white/50 rounded-lg px-3 py-2">
            ⚠️ Tu promedio por día con gasto (<strong className="text-amber-600">{formatCurrency(dailyAverage)}</strong>) supera la meta de {formatCurrency(DAILY_FOOD_GOAL)}/día. ¡Intenta ajustar!
          </p>
        )}
        {!isOverMonthlyBudget && dailyAverage <= DAILY_FOOD_GOAL && totalFoodThisMonth > 0 && (
          <p className="text-xs text-muted-foreground bg-white/50 rounded-lg px-3 py-2">
            ✨ ¡Vas bien! Podes gastar hasta <strong className="text-emerald-600">{formatCurrency(remainingDailyBudget)}</strong>/día el resto del mes para quedar dentro del presupuesto.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── DAILY FOOD CHART ──────────────────────────────────────────
function DailyFoodChart({ transactions }: { transactions: Transaction[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const currentMonthKey = year + '-' + String(month + 1).padStart(2, '0');
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const currentDay = Math.min(now.getDate(), daysInMonth);

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const monthLabel = `${monthNames[month]} ${year}`;

  // Find food category
  const foodCategory = transactions.find(t =>
    t.type === 'expense' && t.category &&
    (t.category.name.toLowerCase() === 'comida' || t.category.name.toLowerCase() === 'alimentación')
  )?.category;

  // Filter food expenses for current month
  const foodExpenses = transactions.filter(t => {
    if (t.type !== 'expense') return false;
    if (foodCategory) {
      if (t.categoryId !== foodCategory.id) return false;
    } else {
      if (!t.category || (t.category.name.toLowerCase() !== 'comida' && t.category.name.toLowerCase() !== 'alimentación')) return false;
    }
    const d = new Date(t.date);
    const m = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    return m === currentMonthKey;
  });

  // Group by day of month
  const dayMap = new Map<number, number>();
  foodExpenses.forEach(t => {
    const day = new Date(t.date).getDate();
    dayMap.set(day, (dayMap.get(day) || 0) + t.amount);
  });

  // Build chart data: day 1 to daysInMonth
  const chartData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const amount = dayMap.get(day) || 0;
    return {
      day: String(day),
      gasto: Math.round(amount * 100) / 100,
      fill: day > currentDay ? '#f1f5f9' : amount === 0 ? '#f1f5f9' : amount > 400 ? '#ef4444' : '#22c55e',
    };
  });

  const totalThisMonth = foodExpenses.reduce((s, t) => s + t.amount, 0);
  const daysWithSpending = new Set(foodExpenses.map(t => new Date(t.date).getDate())).size;
  const avgDaily = daysWithSpending > 0 ? Math.round(totalThisMonth / daysWithSpending) : 0;
  const maxSpend = Math.max(...chartData.map(d => d.gasto), 400);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="text-lg">🍔</span>
              Gasto Diario en Comida
            </CardTitle>
            <CardDescription>{monthLabel} — Dia por dia</CardDescription>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
              <span className="text-muted-foreground">Bien</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm bg-red-500" />
              <span className="text-muted-foreground">Exceso</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-0.5 w-4 bg-amber-500 border-dashed border-t border-t-amber-500" />
              <span className="text-muted-foreground">Meta</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary badges */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 text-sm">
            <span className="text-muted-foreground text-xs">Total mes: </span>
            <span className="font-bold text-emerald-600">{formatCurrency(totalThisMonth)}</span>
          </div>
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 text-sm">
            <span className="text-muted-foreground text-xs">Promedio/dia: </span>
            <span className="font-bold text-blue-600">{formatCurrency(avgDaily)}</span>
          </div>
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 text-sm">
            <span className="text-muted-foreground text-xs">Meta diaria: </span>
            <span className="font-bold text-amber-600">{formatCurrency(400)}</span>
          </div>
        </div>

        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10 }}
                className="fill-muted-foreground"
                interval={daysInMonth > 28 ? 1 : 0}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #e2e8f0' }}
                formatter={(value: number) => [formatCurrency(value), 'Gasto en comida']}
                labelFormatter={(label: string) => `Dia ${label}`}
              />
              <ReferenceLine
                y={400}
                stroke="#f59e0b"
                strokeDasharray="6 4"
                strokeWidth={1.5}
                label={{ value: 'Meta $400', position: 'insideTopRight', fontSize: 10, fill: '#d97706' }}
              />
              <Bar dataKey="gasto" radius={[3, 3, 0, 0]} maxBarSize={20}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Footer note */}
        <p className="text-xs text-muted-foreground text-center mt-2">
          {currentDay < daysInMonth
            ? `Mostrando dias 1-${currentDay} (hoy). Dias futuros aparecen vacios.`
            : `Mes completo. Total: ${formatCurrency(totalThisMonth)} en comida.`
          }
        </p>
      </CardContent>
    </Card>
  );
}

// ─── TRANSACTIONS TAB ─────────────────────────────────────────
function TransactionsTab({
  transactions,
  categories,
  txFilterType,
  setTxFilterType,
  txFilterMonth,
  setTxFilterMonth,
  txSearch,
  setTxSearch,
  filteredTotalIncome,
  filteredTotalExpense,
  onAddTx,
  onDeleteTx,
  onEditTx,
  onImportExcel,
}: {
  transactions: Transaction[];
  categories: Category[];
  txFilterType: 'all' | 'income' | 'expense';
  setTxFilterType: (v: 'all' | 'income' | 'expense') => void;
  txFilterMonth: string;
  setTxFilterMonth: (v: string) => void;
  txSearch: string;
  setTxSearch: (v: string) => void;
  filteredTotalIncome: number;
  filteredTotalExpense: number;
  onAddTx: () => void;
  onDeleteTx: (id: string, desc: string) => void;
  onEditTx: (tx: Transaction) => void;
  onImportExcel: () => void;
}) {
  const accountsList = api.getAccounts();

  // Generate month options
  const monthOptions: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthOptions.push(getMonthYear(d));
  }

  const monthLabel = (key: string) => {
    const [y, m] = key.split('-');
    const d = new Date(parseInt(y), parseInt(m) - 1, 1);
    return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="hidden lg:flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Transacciones</h2>
          <p className="text-muted-foreground text-sm">Historial de ingresos y gastos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onImportExcel} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Importar
          </Button>
          <Button onClick={onAddTx} className="gap-2">
            <Plus className="h-4 w-4" />
            Agregar
          </Button>
        </div>
      </div>

      {/* Mobile Action Buttons */}
      <div className="lg:hidden flex gap-2">
        <button
          onClick={onAddTx}
          className="flex-1 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 text-center shadow-md active:scale-[0.97] transition-transform"
        >
          <Plus className="h-5 w-5 text-white mx-auto mb-1" />
          <span className="text-white text-xs font-bold">Agregar</span>
        </button>
        <button
          onClick={onImportExcel}
          className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-3 text-center shadow-md active:scale-[0.97] transition-transform"
          style={{ width: '56px' }}
        >
          <FileSpreadsheet className="h-5 w-5 text-white mx-auto mb-1" />
          <span className="text-white text-[10px] font-bold">Excel</span>
        </button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                className="pl-9 h-10"
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={txFilterType} onValueChange={(v) => setTxFilterType(v as 'all' | 'income' | 'expense')}>
                <SelectTrigger className="flex-1 min-w-0 sm:w-36 h-10">
                  <Filter className="h-4 w-4 mr-1.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="income">Ingresos</SelectItem>
                  <SelectItem value="expense">Gastos</SelectItem>
                </SelectContent>
              </Select>
              <Select value={txFilterMonth} onValueChange={setTxFilterMonth}>
                <SelectTrigger className="flex-1 min-w-0 sm:w-44 h-10">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Mes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {monthOptions.map((m) => (
                    <SelectItem key={m} value={m}>
                      {monthLabel(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <div className="space-y-2">
        {transactions.length > 0 ? (
          transactions.map((tx, idx) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.03, 0.3) }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div
                        className="h-9 w-9 sm:h-11 sm:w-11 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: (tx.category?.color ?? '#6b7280') + '20' }}
                      >
                        <DynamicIcon
                          name={tx.category?.icon ?? 'Tag'}
                          className="h-4 w-4 sm:h-5 sm:w-5"
                          style={{ color: tx.category?.color ?? '#6b7280' }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{tx.description}</p>
                        <div className="flex items-center gap-1 sm:gap-2 text-[11px] sm:text-xs text-muted-foreground">
                          <span>{formatDateShort(tx.date)}</span>
                          {tx.category && (
                            <>
                              <span>·</span>
                              <span>{tx.category.name}</span>
                            </>
                          )}
                          {tx.accountId && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-0.5">
                                <Wallet className="h-2.5 w-2.5" />
                                {accountsList.find(a => a.id === tx.accountId)?.name || 'Cuenta'}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-3 shrink-0">
                      <span
                        className={`text-sm sm:text-base font-bold whitespace-nowrap ${
                          tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-blue-600"
                        onClick={() => onEditTx(tx)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => onDeleteTx(tx.id, tx.description)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground text-sm mb-3">No hay transacciones que mostrar</p>
              <Button onClick={onAddTx} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Agregar transacción
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Summary */}
      {transactions.length > 0 && (
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
              <div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">Ingresos</p>
                <p className="font-bold text-sm sm:text-base text-emerald-600">{formatCurrency(filteredTotalIncome)}</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">Gastos</p>
                <p className="font-bold text-sm sm:text-base text-rose-600">{formatCurrency(filteredTotalExpense)}</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">Balance Neto</p>
                <p className={`font-bold text-sm sm:text-base ${filteredTotalIncome - filteredTotalExpense >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatCurrency(filteredTotalIncome - filteredTotalExpense)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── PLAN DE AHORRO TAB ────────────────────────────────────────
// Fallback projected incomes - always available regardless of migrations/Gist
const FALLBACK_QUINCE_INCOMES: Array<{ id: string; date: string; amount: number; description: string; received: boolean }> = [
  { id: 'pi-1', date: '2026-06-05', amount: 41760, description: 'Sueldo', received: false },
  { id: 'pi-2', date: '2026-06-20', amount: 21000, description: '1/2 Aguinaldo', received: false },
  { id: 'pi-3', date: '2026-07-01', amount: 40000, description: 'Sueldo', received: false },
  { id: 'pi-4', date: '2026-07-30', amount: 9000, description: 'Ingreso extra', received: false },
  { id: 'pi-5', date: '2026-08-03', amount: 40000, description: 'Sueldo', received: false },
];

function PlanTab({
  goals,
  onToggleProjectedIncome,
  onAddSavings,
  onToggleItem,
  onEditItemCost,
  onDeleteItem,
  onAddItem,
}: {
  goals: Goal[];
  onToggleProjectedIncome: (goalId: string, incomeId: string, desc: string) => void;
  onAddSavings: (g: Goal) => void;
  onToggleItem: (goalId: string, item: GoalItem) => void;
  onEditItemCost: (goalId: string, itemId: string, cost: number) => void;
  onDeleteItem: (goalId: string, itemId: string) => void;
  onAddItem: (goalId: string) => void;
}) {
  // ALWAYS use hardcoded projected incomes for Quinceañera goal
  // This is completely independent of localStorage/Gist - data is embedded in JS
  const safeGoals = goals.map(g => {
    if (g.id === 'quinceanera-2026') {
      // Merge: use hardcoded data, but preserve 'received' state from stored data
      const stored = g.projectedIncomes || [];
      const merged = FALLBACK_QUINCE_INCOMES.map(fi => {
        const match = stored.find(s => s.id === fi.id && s.received);
        return match ? { ...fi, received: true } : fi;
      });
      return { ...g, projectedIncomes: merged };
    }
    return g;
  });

  const goalsWithPlan = safeGoals.filter(g => g.deadline && g.savedAmount < g.targetAmount);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="hidden lg:flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Plan de Ahorro</h2>
          <p className="text-muted-foreground text-sm">Proyección de ingresos y metas</p>
        </div>
      </div>

      {goalsWithPlan.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <PiggyBank className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No hay metas activas con plan de ahorro</p>
          </CardContent>
        </Card>
      ) : (
        goalsWithPlan.map((goal, idx) => {
          const isQuin = goal.id === 'quinceanera-2026';
          const remaining = goal.targetAmount - goal.savedAmount;
          const now = new Date();
          const deadlineDate = new Date(goal.deadline!);
          const diffMs = deadlineDate.getTime() - now.getTime();
          const monthsLeft = diffMs > 0 ? Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30.44))) : 0;
          const monthlyNeeded = monthsLeft > 0 ? remaining / monthsLeft : 0;

          const projectedIncomes = goal.projectedIncomes ?? [];
          const totalProjected = projectedIncomes.reduce((s, pi) => s + pi.amount, 0);
          const receivedProjected = projectedIncomes.filter(pi => pi.received).reduce((s, pi) => s + pi.amount, 0);
          const pendingProjected = totalProjected - receivedProjected;
          const projectedWithSavings = goal.savedAmount + pendingProjected;
          const willReachGoal = projectedWithSavings >= goal.targetAmount;
          const surplus = projectedWithSavings - goal.targetAmount;
          const pct = formatPercent(goal.savedAmount, goal.targetAmount);

          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="space-y-3"
            >
              {/* Goal Header */}
              <Card className={`overflow-hidden ${isQuin ? 'border-pink-300 ring-1 ring-pink-200' : ''}`}>
                {isQuin && (
                  <div className="bg-gradient-to-r from-pink-500 to-fuchsia-500 p-3 sm:p-4 text-white">
                    <div className="flex items-center gap-2">
                      <PartyPopper className="h-5 w-5" />
                      <Crown className="h-4 w-4" />
                      <span className="text-sm font-semibold">Plan de Ahorro - Quinceañera</span>
                    </div>
                  </div>
                )}
                <CardContent className="p-3 sm:p-5 space-y-4">
                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-xs sm:text-sm mb-1.5">
                      <span className="text-muted-foreground truncate mr-2">{formatCurrency(goal.savedAmount)} de {formatCurrency(goal.targetAmount)}</span>
                      <span className="font-semibold shrink-0" style={{ color: goal.color }}>{pct}%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: goal.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(pct, 100)}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                  </div>

                  {/* Monthly savings plan */}
                  <div className={`rounded-xl p-3 space-y-2.5 ${isQuin ? 'bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-800' : 'bg-muted/50 border border-border'}`}>
                    <div className="flex items-center gap-2">
                      <Calculator className={`h-4 w-4 ${isQuin ? 'text-pink-600' : 'text-primary'}`} />
                      <span className={`text-xs font-semibold ${isQuin ? 'text-pink-700 dark:text-pink-300' : ''}`}>Resumen Mensual</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="space-y-0.5">
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Falta ahorrar</p>
                        <p className={`text-xs sm:text-sm font-bold ${isQuin ? 'text-pink-700 dark:text-pink-300' : ''}`}>{formatCurrency(remaining)}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Meses</p>
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <p className={`text-xs sm:text-sm font-bold ${isQuin ? 'text-pink-700 dark:text-pink-300' : ''}`}>{monthsLeft}</p>
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Promedio/mes</p>
                        <p className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(monthlyNeeded)}</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center">
                      {formatDateShort(now.toISOString())} → {formatDate(goal.deadline!)}
                    </p>
                  </div>

                  {/* Agregar ahorro button */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-9 text-xs gap-1"
                    style={{ borderColor: goal.color, color: goal.color }}
                    onClick={() => onAddSavings(goal)}
                  >
                    <Plus className="h-3 w-3" />
                    Agregar ahorro manual
                  </Button>
                </CardContent>
              </Card>

              {/* Projected Incomes Card */}
              {projectedIncomes.length > 0 && (
                <Card className={`overflow-hidden ${isQuin ? 'border-fuchsia-200' : ''}`}>
                  <CardContent className="p-3 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className={`h-4 w-4 ${willReachGoal ? 'text-emerald-600' : 'text-amber-600'}`} />
                        <span className="text-xs sm:text-sm font-semibold">Proyección de Ingresos</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${willReachGoal ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}>
                        {willReachGoal ? '✓ Llegás a la meta' : '✗ Faltan fondos'}
                      </span>
                    </div>

                    {/* Income list */}
                    <div className="space-y-1.5">
                      {projectedIncomes.map((pi) => {
                        const isPast = new Date(pi.date) <= new Date();
                        return (
                          <div
                            key={pi.id}
                            className={`flex items-center gap-2 text-xs sm:text-sm rounded-lg px-2.5 sm:px-3 py-2 transition-colors ${
                              pi.received
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-muted-foreground'
                                : isPast
                                  ? 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800'
                                  : 'bg-background'
                            }`}
                          >
                            <Checkbox
                              checked={pi.received}
                              onCheckedChange={() => onToggleProjectedIncome(goal.id, pi.id, pi.description)}
                              className={pi.received ? 'border-emerald-500' : ''}
                            />
                            <span className={`flex-1 min-w-0 truncate ${pi.received ? 'line-through' : 'font-medium'}`}>
                              {pi.description}
                            </span>
                            <span className="text-muted-foreground shrink-0">
                              {formatDateShort(pi.date)}
                            </span>
                            <span className={`font-bold shrink-0 ${pi.received ? 'text-muted-foreground' : 'text-emerald-600 dark:text-emerald-400'}`}>
                              {formatCurrency(pi.amount)}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Summary */}
                    <Separator />
                    <div className="space-y-1.5 text-xs sm:text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pendiente por cobrar</span>
                        <span className="font-semibold">{formatCurrency(pendingProjected)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ahorrado + pendiente</span>
                        <span className={`font-bold ${willReachGoal ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {formatCurrency(projectedWithSavings)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Meta</span>
                        <span className="font-semibold">{formatCurrency(goal.targetAmount)}</span>
                      </div>
                      {willReachGoal ? (
                        <div className="flex justify-between bg-emerald-50 dark:bg-emerald-950/30 rounded-lg px-3 py-2 mt-1">
                          <span className="text-emerald-700 dark:text-emerald-300 font-medium">Sobrante estimado</span>
                          <span className="text-emerald-700 dark:text-emerald-300 font-bold">{formatCurrency(surplus)}</span>
                        </div>
                      ) : (
                        <div className="flex justify-between bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2 mt-1">
                          <span className="text-amber-700 dark:text-amber-300 font-medium">Faltaría</span>
                          <span className="text-amber-700 dark:text-amber-300 font-bold">{formatCurrency(-surplus)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Items breakdown */}
              {goal.items.length > 0 && (
                <Card>
                  <CardContent className="p-3 sm:p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs sm:text-sm font-semibold">Items de la meta</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground px-1">
                      <span>Estimado: {formatCurrency(goal.items.reduce((s, i) => s + i.estimatedCost, 0))}</span>
                      <span>Pagado: {formatCurrency(goal.items.filter(i => i.isPaid).reduce((s, i) => s + i.actualCost, 0))}</span>
                    </div>
                    <div className="space-y-1.5 max-h-60 overflow-y-auto">
                      {goal.items.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-xs sm:text-sm transition-colors ${
                            item.isPaid
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                              : 'bg-background border-border'
                          }`}
                        >
                          <Checkbox
                            checked={item.isPaid}
                            onCheckedChange={() => onToggleItem(goal.id, item)}
                            className={item.isPaid ? 'border-emerald-500' : ''}
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs sm:text-sm ${item.isPaid ? 'line-through text-muted-foreground' : 'font-medium'}`}>
                              {item.name}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-muted-foreground text-xs">{formatCurrency(item.estimatedCost)}</span>
                            {item.isPaid && (
                              <span className="text-emerald-600 text-xs font-medium">{formatCurrency(item.actualCost)}</span>
                            )}
                            {!item.isPaid && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => onEditItemCost(goal.id, item.id, item.estimatedCost)}
                              >
                                <span className="text-xs font-medium" style={{ color: goal.color }}>$</span>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={() => onDeleteItem(goal.id, item.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-xs gap-1"
                      style={{ borderColor: goal.color, color: goal.color }}
                      onClick={() => onAddItem(goal.id)}
                    >
                      <Plus className="h-3 w-3" />
                      Agregar item
                    </Button>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          );
        })
      )}
    </div>
  );
}

// ─── GOALS TAB ────────────────────────────────────────────────
function GoalsTab({
  goals,
  expandedGoal,
  setExpandedGoal,
  onAddGoal,
  onAddSavings,
  onDeleteGoal,
  onToggleItem,
  onEditItemCost,
  onDeleteItem,
  onAddItem,
  onToggleProjectedIncome,
}: {
  goals: Goal[];
  expandedGoal: string | null;
  setExpandedGoal: (id: string | null) => void;
  onAddGoal: () => void;
  onAddSavings: (g: Goal) => void;
  onDeleteGoal: (id: string, name: string) => void;
  onToggleItem: (goalId: string, item: GoalItem) => void;
  onEditItemCost: (goalId: string, itemId: string, cost: number) => void;
  onDeleteItem: (goalId: string, itemId: string) => void;
  onAddItem: (goalId: string) => void;
  onToggleProjectedIncome: (goalId: string, incomeId: string, desc: string) => void;
}) {
  const isQuinceañera = (g: Goal) => g.id === 'quinceanera-2026';

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div className="hidden lg:block">
          <h2 className="text-2xl font-bold tracking-tight">Metas de Ahorro</h2>
          <p className="text-muted-foreground text-sm">Sigue tus metas y ahorros</p>
        </div>
        <Button onClick={onAddGoal} className="gap-2 h-9 sm:h-10">
          <Plus className="h-4 w-4" />
          Nueva Meta
        </Button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((goal, idx) => {
          const pct = formatPercent(goal.savedAmount, goal.targetAmount);
          const isQuin = isQuinceañera(goal);
          const isExpanded = expandedGoal === goal.id;
          const isComplete = goal.savedAmount >= goal.targetAmount;

          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
            >
              <Card
                className={`overflow-hidden transition-shadow hover:shadow-lg ${
                  isQuin
                    ? 'border-pink-300 dark:border-pink-800 ring-1 ring-pink-200 dark:ring-pink-800'
                    : isComplete
                    ? 'border-emerald-300 dark:border-emerald-800'
                    : ''
                }`}
              >
                {/* Special header for Quinceañera */}
                {isQuin && (
                  <div className="bg-gradient-to-r from-pink-500 to-fuchsia-500 p-4 text-white">
                    <div className="flex items-center gap-2">
                      <PartyPopper className="h-5 w-5" />
                      <Crown className="h-4 w-4" />
                      <span className="text-sm font-semibold">Meta Especial</span>
                      {isComplete && (
                        <Badge className="bg-white/20 text-white border-0 ml-auto">
                          <Star className="h-3 w-3 mr-1" />
                          ¡Completada!
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {isComplete && !isQuin && (
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-3 text-white">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      <span className="text-sm font-semibold">Meta Completada</span>
                    </div>
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: goal.color + '20' }}
                      >
                        <Target className="h-4 w-4" style={{ color: goal.color }} />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">{goal.name}</CardTitle>
                        {goal.description && (
                          <CardDescription className="text-xs">{goal.description}</CardDescription>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => onDeleteGoal(goal.id, goal.name)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-muted-foreground">
                        {formatCurrency(goal.savedAmount)} de {formatCurrency(goal.targetAmount)}
                      </span>
                      <span className="font-semibold" style={{ color: goal.color }}>{pct}%</span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: isComplete ? '#22c55e' : goal.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(pct, 100)}%` }}
                        transition={{ duration: 1, delay: idx * 0.1 }}
                      />
                    </div>
                  </div>

                  {/* Monthly savings plan */}
                  {!isComplete && goal.deadline && (() => {
                    const remaining = goal.targetAmount - goal.savedAmount;
                    if (remaining <= 0) return null;
                    const now = new Date();
                    const deadlineDate = new Date(goal.deadline);
                    const diffMs = deadlineDate.getTime() - now.getTime();
                    if (diffMs <= 0) return null;
                    const monthsLeft = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30.44)));
                    const monthlyNeeded = remaining / monthsLeft;

                    return (
                      <div className={`rounded-xl p-3 space-y-2 ${isQuin ? 'bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-800' : 'bg-muted/50 border border-border'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Calculator className={`h-4 w-4 ${isQuin ? 'text-pink-600' : 'text-primary'}`} />
                          <span className={`text-xs font-semibold ${isQuin ? 'text-pink-700 dark:text-pink-300' : ''}`}>Plan de Ahorro Mensual</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="space-y-0.5">
                            <p className="text-xs text-muted-foreground">Falta ahorrar</p>
                            <p className={`text-sm font-bold ${isQuin ? 'text-pink-700 dark:text-pink-300' : ''}`}>{formatCurrency(remaining)}</p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs text-muted-foreground">Meses restantes</p>
                            <div className="flex items-center justify-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <p className={`text-sm font-bold ${isQuin ? 'text-pink-700 dark:text-pink-300' : ''}`}>{monthsLeft}</p>
                            </div>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs text-muted-foreground">Promedio/mes</p>
                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(monthlyNeeded)}</p>
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground text-center">
                          Desde hoy ({formatDateShort(now.toISOString())}) hasta {formatDate(goal.deadline)}
                        </p>
                      </div>
                    );
                  })()}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {goal.deadline && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(goal.deadline)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <span>{goal.items.length} items</span>
                      </div>
                    </div>
                    {!isComplete && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        style={{ borderColor: goal.color, color: goal.color }}
                        onClick={() => onAddSavings(goal)}
                      >
                        <Plus className="h-3 w-3" />
                        Agregar ahorro
                      </Button>
                    )}
                  </div>

                  {/* Expanded: Items List */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <Separator className="my-3" />
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                          {/* Item summary header */}
                          {goal.items.length > 0 && (
                            <div className="flex justify-between text-xs text-muted-foreground px-1">
                              <span>Total estimado: {formatCurrency(goal.items.reduce((s, i) => s + i.estimatedCost, 0))}</span>
                              <span>
                                Pagado: {formatCurrency(goal.items.filter(i => i.isPaid).reduce((s, i) => s + i.actualCost, 0))}
                              </span>
                            </div>
                          )}

                          {goal.items.map((item) => (
                            <div
                              key={item.id}
                              className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${
                                item.isPaid
                                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                                  : 'bg-background border-border'
                              }`}
                            >
                              <Checkbox
                                checked={item.isPaid}
                                onCheckedChange={() => onToggleItem(goal.id, item)}
                                className={item.isPaid ? 'border-emerald-500' : ''}
                              />
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm ${item.isPaid ? 'line-through text-muted-foreground' : 'font-medium'}`}>
                                  {item.name}
                                </p>
                                <div className="flex gap-2 text-xs text-muted-foreground">
                                  <span>Est: {formatCurrency(item.estimatedCost)}</span>
                                  {item.isPaid && (
                                    <span className="text-emerald-600 font-medium">
                                      Real: {formatCurrency(item.actualCost)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {item.isPaid ? (
                                  <Check className="h-4 w-4 text-emerald-500" />
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => onEditItemCost(goal.id, item.id, item.estimatedCost)}
                                  >
                                    <span className="text-xs font-medium" style={{ color: goal.color }}>
                                      $
                                    </span>
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                  onClick={() => onDeleteItem(goal.id, item.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}

                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-8 text-xs gap-1 mt-2"
                            style={{ borderColor: goal.color, color: goal.color }}
                            onClick={() => onAddItem(goal.id)}
                          >
                            <Plus className="h-3 w-3" />
                            Agregar item
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Projected Incomes Summary (always shown for Quinceañera) */}
                  {isQuin && (() => {
                    const stored = goal.projectedIncomes || [];
                    const incomes = FALLBACK_QUINCE_INCOMES.map(fi => {
                      const match = stored.find(s => s.id === fi.id && s.received);
                      return match ? { ...fi, received: true } : fi;
                    });
                    const total = incomes.reduce((s, pi) => s + pi.amount, 0);
                    const received = incomes.filter(pi => pi.received).reduce((s, pi) => s + pi.amount, 0);
                    const pending = total - received;
                    const projectedTotal = goal.savedAmount + pending;
                    const willReach = projectedTotal >= goal.targetAmount;

                    return (
                      <div className="mt-3 rounded-xl border border-fuchsia-200 dark:border-fuchsia-800 overflow-hidden">
                        <div className="bg-gradient-to-r from-fuchsia-500 to-pink-500 px-3 py-2 flex items-center justify-between text-white">
                          <div className="flex items-center gap-1.5">
                            <TrendingUp className="h-3.5 w-3.5" />
                            <span className="text-xs font-semibold">Ingresos Previstos</span>
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${willReach ? 'bg-white/20' : 'bg-amber-400/30'}`}>
                            {willReach ? 'Llegas a la meta' : 'Faltan fondos'}
                          </span>
                        </div>
                        <div className="p-2.5 space-y-1">
                          {incomes.map((pi) => (
                            <div
                              key={pi.id}
                              className={`flex items-center gap-1.5 text-xs rounded-md px-2 py-1.5 ${
                                pi.received
                                  ? 'bg-emerald-50 dark:bg-emerald-950/30'
                                  : new Date(pi.date) <= new Date()
                                    ? 'bg-amber-50 dark:bg-amber-950/20'
                                    : ''
                              }`}
                            >
                              <Checkbox
                                checked={pi.received}
                                onCheckedChange={() => onToggleProjectedIncome(goal.id, pi.id, pi.description)}
                                className={pi.received ? 'border-emerald-500' : 'h-3.5 w-3.5'}
                              />
                              <span className={`flex-1 truncate ${pi.received ? 'line-through text-muted-foreground' : 'font-medium'}`}>
                                {pi.description}
                              </span>
                              <span className="text-muted-foreground">{formatDateShort(pi.date)}</span>
                              <span className={`font-bold ${pi.received ? 'text-muted-foreground' : 'text-emerald-600'}`}>
                                {formatCurrency(pi.amount)}
                              </span>
                            </div>
                          ))}
                          <div className="border-t mt-1 pt-1.5 flex justify-between text-xs">
                            <span className="text-muted-foreground">Ahorrado + Pendiente</span>
                            <span className={`font-bold ${willReach ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {formatCurrency(projectedTotal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {goals.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm mb-3">No hay metas de ahorro</p>
            <Button onClick={onAddGoal} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Crear meta
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
