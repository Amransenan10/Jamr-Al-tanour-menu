import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabaseClient';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { motion, AnimatePresence } from 'motion/react';
import { 
    Gift, Users, Award, TrendingUp, Plus, Minus, Search, 
    Settings, Save, History, Sparkles, CheckCircle2, X, 
    Loader2, Phone, User, RefreshCw, ToggleLeft, ToggleRight,
    Coins, DollarSign, ShieldAlert, AlertCircle, ArrowUpRight, ArrowDownRight,
    FileSpreadsheet, Download, Printer, Calendar, Filter
} from 'lucide-react';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

interface LoyaltyConfig {
    is_enabled: boolean;
    earning_rate: number; // كل كم ريال = 1 نقطة
    redemption_rate: number; // كل كم نقطة = 1 ريال خصم
    min_points_to_redeem: number; // الحد الأدنى للاستبدال
    welcome_bonus_points: number; // نقاط ترحيبية
    max_redemption_percentage: number; // أقصى نسبة خصم بالنقاط من الفاتورة (%)
}

interface Customer {
    phone_number: string;
    full_name: string;
    points_balance: number;
    created_at?: string;
    updated_at?: string;
}

interface Transaction {
    id: number;
    customer_phone: string;
    type?: string; // 'earn', 'redeem', 'admin_add', 'admin_deduct'
    amount: number;
    points_earned: number;
    points_redeemed: number;
    notes?: string;
    staff_id?: string;
    created_at: string;
}

export const AdminLoyaltyView: React.FC = () => {
    const [activeSubTab, setActiveSubTab] = useState<'config' | 'customers' | 'transactions' | 'reports'>('config');

    // Report & Export state
    const [reportTimeframe, setReportTimeframe] = useState<'all' | 'today' | '7days' | '30days' | 'thisMonth' | 'custom'>('30days');
    const [reportStartDate, setReportStartDate] = useState<string>('');
    const [reportEndDate, setReportEndDate] = useState<string>('');
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [reportTransactions, setReportTransactions] = useState<Transaction[]>([]);
    const [loadingReportData, setLoadingReportData] = useState(false);
    const [reportSearchQuery, setReportSearchQuery] = useState('');

    // Config state
    const [config, setConfig] = useState<LoyaltyConfig>({
        is_enabled: true,
        earning_rate: 1,
        redemption_rate: 10,
        min_points_to_redeem: 5,
        welcome_bonus_points: 0,
        max_redemption_percentage: 50
    });
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [savingConfig, setSavingConfig] = useState(false);

    // Customers state
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loadingCustomers, setLoadingCustomers] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Transactions state
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loadingTransactions, setLoadingTransactions] = useState(true);
    const [txSearchQuery, setTxSearchQuery] = useState('');

    // Modals
    const [adjustModal, setAdjustModal] = useState<{
        isOpen: boolean;
        customer: Customer | null;
        type: 'add' | 'deduct';
        points: string;
        reason: string;
        isSubmitting: boolean;
    }>({
        isOpen: false,
        customer: null,
        type: 'add',
        points: '',
        reason: '',
        isSubmitting: false
    });

    const [newCustomerModal, setNewCustomerModal] = useState<{
        isOpen: boolean;
        phone: string;
        name: string;
        points: string;
        isSubmitting: boolean;
    }>({
        isOpen: false,
        phone: '',
        name: '',
        points: '0',
        isSubmitting: false
    });

    // Fetch All Data
    const fetchConfig = async () => {
        setLoadingConfig(true);
        try {
            const { data, error } = await supabaseAdmin
                .from('loyalty_config')
                .select('*')
                .eq('id', 1)
                .single();

            if (data) {
                const savedMax = localStorage.getItem('jamr_loyalty_max_percentage');
                const finalMax = (data.max_redemption_percentage !== undefined && data.max_redemption_percentage !== null)
                    ? Number(data.max_redemption_percentage)
                    : (savedMax ? Number(savedMax) : 50);

                setConfig({
                    is_enabled: data.is_enabled ?? true,
                    earning_rate: Number(data.earning_rate) || 1,
                    redemption_rate: Number(data.redemption_rate) || 10,
                    min_points_to_redeem: Number(data.min_points_to_redeem) || 5,
                    welcome_bonus_points: Number(data.welcome_bonus_points) || 0,
                    max_redemption_percentage: finalMax
                });
            } else if (error) {
                console.warn('loyalty_config query info:', error.message);
            }
        } catch (e) {
            console.error('Error fetching loyalty config:', e);
        } finally {
            setLoadingConfig(false);
        }
    };

    const fetchCustomers = async () => {
        setLoadingCustomers(true);
        try {
            const { data, error } = await supabaseAdmin
                .from('customers')
                .select('*')
                .order('points_balance', { ascending: false });

            if (data) setCustomers(data);
            if (error) console.error('Error fetching customers:', error);
        } catch (e) {
            console.error('Error fetching customers:', e);
        } finally {
            setLoadingCustomers(false);
        }
    };

    const fetchTransactions = async () => {
        setLoadingTransactions(true);
        try {
            const { data, error } = await supabaseAdmin
                .from('transactions')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (data) setTransactions(data);
            if (error) console.error('Error fetching transactions:', error);
        } catch (e) {
            console.error('Error fetching transactions:', e);
        } finally {
            setLoadingTransactions(false);
        }
    };

    useEffect(() => {
        fetchConfig();
        fetchCustomers();
        fetchTransactions();

        // Realtime Subscription
        const channel = supabase
            .channel('admin-loyalty-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'loyalty_config' }, () => fetchConfig())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => fetchCustomers())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchTransactions())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Date range helper for reports
    const getReportDateRange = () => {
        const now = new Date();
        let start: Date | null = null;
        let end: Date | null = null;
        let label = 'كل الأوقات';

        if (reportTimeframe === 'today') {
            start = new Date();
            start.setHours(0, 0, 0, 0);
            end = new Date();
            end.setHours(23, 59, 59, 999);
            label = 'اليوم';
        } else if (reportTimeframe === '7days') {
            start = new Date();
            start.setDate(now.getDate() - 7);
            start.setHours(0, 0, 0, 0);
            end = now;
            label = 'آخر 7 أيام';
        } else if (reportTimeframe === '30days') {
            start = new Date();
            start.setDate(now.getDate() - 30);
            start.setHours(0, 0, 0, 0);
            end = now;
            label = 'آخر 30 يوم';
        } else if (reportTimeframe === 'thisMonth') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = now;
            label = 'هذا الشهر';
        } else if (reportTimeframe === 'custom' && reportStartDate) {
            start = new Date(reportStartDate);
            start.setHours(0, 0, 0, 0);
            if (reportEndDate) {
                end = new Date(reportEndDate);
                end.setHours(23, 59, 59, 999);
            } else {
                end = now;
            }
            label = `من ${reportStartDate} إلى ${reportEndDate || 'الآن'}`;
        }

        return { start, end, label };
    };

    // Fetch transactions with pagination for the report
    const fetchAllTransactionsForReport = async () => {
        setLoadingReportData(true);
        try {
            const { start, end } = getReportDateRange();
            let all: Transaction[] = [];
            let from = 0;
            const pageSize = 1000;
            let hasMore = true;

            while (hasMore) {
                let q = supabaseAdmin
                    .from('transactions')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .range(from, from + pageSize - 1);

                if (start) {
                    q = q.gte('created_at', start.toISOString());
                }
                if (end) {
                    q = q.lte('created_at', end.toISOString());
                }

                const { data, error } = await q;
                if (error || !data || data.length === 0) break;
                all.push(...data);
                if (data.length < pageSize) {
                    hasMore = false;
                } else {
                    from += pageSize;
                }
            }

            setReportTransactions(all);
        } catch (err) {
            console.error('Error fetching report transactions:', err);
            toast.error('حدث خطأ أثناء تحميل بيانات تقرير الولاء');
        } finally {
            setLoadingReportData(false);
        }
    };

    useEffect(() => {
        if (activeSubTab === 'reports') {
            fetchAllTransactionsForReport();
        }
    }, [activeSubTab, reportTimeframe, reportStartDate, reportEndDate]);

    // Computed report metrics
    const reportMetrics = useMemo(() => {
        const totalEarned = reportTransactions.reduce((sum, t) => sum + (t.points_earned || 0), 0);
        const totalRedeemed = reportTransactions.reduce((sum, t) => sum + (t.points_redeemed || 0), 0);
        const redemptionRate = Number(config.redemption_rate) || 10;
        const discountSAR = redemptionRate > 0 ? (totalRedeemed / redemptionRate) : 0;
        const redeemCount = reportTransactions.filter(t => (t.points_redeemed || 0) > 0).length;
        const earnCount = reportTransactions.filter(t => (t.points_earned || 0) > 0).length;

        // Top redeemers calculation
        const customerMap: Record<string, { phone: string; name: string; totalRedeemed: number; txCount: number }> = {};
        reportTransactions.forEach(t => {
            if ((t.points_redeemed || 0) > 0) {
                const phone = t.customer_phone?.trim() || 'غير معروف';
                if (!customerMap[phone]) {
                    const foundCust = customers.find(c => c.phone_number?.trim() === phone);
                    customerMap[phone] = {
                        phone,
                        name: foundCust?.full_name || 'عميل',
                        totalRedeemed: 0,
                        txCount: 0
                    };
                }
                customerMap[phone].totalRedeemed += t.points_redeemed || 0;
                customerMap[phone].txCount += 1;
            }
        });

        const topRedeemers = Object.values(customerMap)
            .sort((a, b) => b.totalRedeemed - a.totalRedeemed)
            .slice(0, 10);

        return {
            totalEarned,
            totalRedeemed,
            discountSAR,
            redeemCount,
            earnCount,
            topRedeemers
        };
    }, [reportTransactions, config.redemption_rate, customers]);

    const filteredReportTransactions = useMemo(() => {
        if (!reportSearchQuery.trim()) return reportTransactions;
        const q = reportSearchQuery.toLowerCase().trim();
        return reportTransactions.filter(t => 
            t.customer_phone?.toLowerCase().includes(q) ||
            t.notes?.toLowerCase().includes(q) ||
            t.staff_id?.toLowerCase().includes(q)
        );
    }, [reportTransactions, reportSearchQuery]);

    // Full Excel Export Handler
    const handleExportExcel = async () => {
        setIsExporting(true);
        try {
            const { start, end, label } = getReportDateRange();
            
            // 1. Fetch all transactions for the timeframe using pagination
            let txs: Transaction[] = [];
            let from = 0;
            const pageSize = 1000;
            let hasMore = true;

            while (hasMore) {
                let q = supabaseAdmin
                    .from('transactions')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .range(from, from + pageSize - 1);

                if (start) q = q.gte('created_at', start.toISOString());
                if (end) q = q.lte('created_at', end.toISOString());

                const { data, error } = await q;
                if (error || !data || data.length === 0) break;
                txs.push(...data);
                if (data.length < pageSize) hasMore = false;
                else from += pageSize;
            }

            // 2. Fetch all customers
            let allCust: Customer[] = [];
            from = 0;
            hasMore = true;
            while (hasMore) {
                let q = supabaseAdmin
                    .from('customers')
                    .select('*')
                    .order('points_balance', { ascending: false })
                    .range(from, from + pageSize - 1);
                const { data, error } = await q;
                if (error || !data || data.length === 0) break;
                allCust.push(...data);
                if (data.length < pageSize) hasMore = false;
                else from += pageSize;
            }

            const custMap = new Map<string, string>();
            allCust.forEach(c => {
                if (c.phone_number) custMap.set(c.phone_number.trim(), c.full_name || 'عميل');
            });

            // 3. Compute Metrics
            const totalEarnedPts = txs.reduce((sum, t) => sum + (t.points_earned || 0), 0);
            const totalRedeemedPts = txs.reduce((sum, t) => sum + (t.points_redeemed || 0), 0);
            const redemptionRate = Number(config.redemption_rate) || 10;
            const monetaryDiscountValue = redemptionRate > 0 ? (totalRedeemedPts / redemptionRate) : 0;
            const redeemTxCount = txs.filter(t => (t.points_redeemed || 0) > 0).length;
            const earnTxCount = txs.filter(t => (t.points_earned || 0) > 0).length;
            const totalActiveBalance = allCust.reduce((sum, c) => sum + (c.points_balance || 0), 0);
            const totalActiveMonetaryLiability = redemptionRate > 0 ? (totalActiveBalance / redemptionRate) : 0;

            // Sheet 1: ملخص التقرير
            const overviewSheet = [
                { 'المؤشر': 'فترة التقرير', 'القيمة': label },
                { 'المؤشر': 'تاريخ استخراج التقرير', 'القيمة': new Date().toLocaleString('ar-SA') },
                { 'المؤشر': 'إجمالي أعضاء الولاء المسجلين', 'القيمة': allCust.length },
                { 'المؤشر': 'إجمالي النقاط النشطة لدى العملاء حالياً', 'القيمة': totalActiveBalance },
                { 'المؤشر': 'القيمة المالية لأرصدة العملاء الحالية (ر.س)', 'القيمة': totalActiveMonetaryLiability.toFixed(2) },
                { 'المؤشر': 'إجمالي النقاط المكتسبة خلال الفترة', 'القيمة': totalEarnedPts },
                { 'المؤشر': 'إجمالي النقاط المستهلكة (المستبدلة) خلال الفترة', 'القيمة': totalRedeemedPts },
                { 'المؤشر': 'القيمة المالية للخصومات المستهلكة بالنقاط (ر.س)', 'القيمة': monetaryDiscountValue.toFixed(2) },
                { 'المؤشر': 'عدد عمليات الاستبدال الناجحة', 'القيمة': redeemTxCount },
                { 'المؤشر': 'عدد عمليات اكتساب النقاط', 'القيمة': earnTxCount },
                { 'المؤشر': 'معدل الاستبدال المعتمد في النظام', 'القيمة': `كل ${redemptionRate} نقطة = 1 ريال خصم` }
            ];

            // Sheet 2: سجل الاستهلاك والعمليات التفصيلي
            const txSheet = txs.map((t, idx) => {
                const customerName = custMap.get(t.customer_phone?.trim()) || 'عميل';
                const isRedeem = (t.points_redeemed || 0) > 0;
                const isEarn = (t.points_earned || 0) > 0;
                let txTypeArabic = 'عملية ولاء';
                if (t.type === 'admin_add') txTypeArabic = 'إضافة يدوية (أدمن)';
                else if (t.type === 'admin_deduct') txTypeArabic = 'خصم يدوي (أدمن)';
                else if (t.type === 'redeem' || isRedeem) txTypeArabic = 'استهلاك / استبدال خصم';
                else if (t.type === 'earn' || isEarn) txTypeArabic = 'اكتساب نقاط طلب';

                const discountAmount = isRedeem && redemptionRate > 0 ? ((t.points_redeemed || 0) / redemptionRate).toFixed(2) : '0.00';

                return {
                    'م': idx + 1,
                    'رقم المعاملة': t.id,
                    'التاريخ والوقت': new Date(t.created_at).toLocaleString('ar-SA'),
                    'رقم جوال العميل': t.customer_phone,
                    'اسم العميل': customerName,
                    'نوع العملية': txTypeArabic,
                    'النقاط المستهلكة': t.points_redeemed || 0,
                    'قيمة الخصم المستهلك (ر.س)': discountAmount,
                    'النقاط المكتسبة': t.points_earned || 0,
                    'قيمة الفاتورة (ر.س)': t.amount > 0 ? Number(t.amount).toFixed(2) : '-',
                    'الملاحظات': t.notes || '-',
                    'الموظف / المسؤول': t.staff_id || 'النظام'
                };
            });

            // Sheet 3: العملاء الأكثر استهلاكاً للنقاط
            const customerRedeemMap: Record<string, { phone: string; name: string; totalRedeemed: number; txCount: number }> = {};
            txs.forEach(t => {
                if ((t.points_redeemed || 0) > 0) {
                    const phone = t.customer_phone?.trim() || 'غير معروف';
                    if (!customerRedeemMap[phone]) {
                        customerRedeemMap[phone] = {
                            phone,
                            name: custMap.get(phone) || 'عميل',
                            totalRedeemed: 0,
                            txCount: 0
                        };
                    }
                    customerRedeemMap[phone].totalRedeemed += t.points_redeemed || 0;
                    customerRedeemMap[phone].txCount += 1;
                }
            });

            const topRedeemersSheet = Object.values(customerRedeemMap)
                .sort((a, b) => b.totalRedeemed - a.totalRedeemed)
                .map((c, idx) => ({
                    'الترتيب': idx + 1,
                    'اسم العميل': c.name,
                    'رقم الجوال': c.phone,
                    'إجمالي النقاط المستهلكة': c.totalRedeemed,
                    'قيمة الخصومات المستفادة (ر.س)': redemptionRate > 0 ? (c.totalRedeemed / redemptionRate).toFixed(2) : '0.00',
                    'عدد مرات الاستبدال': c.txCount
                }));

            // Sheet 4: أرصدة جميع العملاء
            const customersSheet = allCust.map((c, idx) => ({
                'م': idx + 1,
                'اسم العميل': c.full_name || 'عميل',
                'رقم الجوال': c.phone_number,
                'رصيد النقاط الحالي': c.points_balance || 0,
                'قيمة الرصيد بالريال (ر.س)': redemptionRate > 0 ? ((c.points_balance || 0) / redemptionRate).toFixed(2) : '0.00',
                'تاريخ التسجيل': c.created_at ? new Date(c.created_at).toLocaleDateString('ar-SA') : '-'
            }));

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(overviewSheet), 'ملخص الاستهلاك العام');
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(txSheet), 'سجل الاستهلاك والعمليات');
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(topRedeemersSheet), 'الأكثر استهلاكاً للنقاط');
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(customersSheet), 'أرصدة العملاء');

            const fileName = `تقرير_استهلاك_الولاء_جمر_التنور_${label.replace(/[\s\/\\:]+/g, '_')}.xlsx`;
            XLSX.writeFile(wb, fileName);
            toast.success('تم تصدير تقرير استهلاك الولاء إلى Excel بنجاح 📊');
            setExportModalOpen(false);
        } catch (err) {
            console.error('Export Excel Error:', err);
            toast.error('حدث خطأ أثناء تصدير ملف Excel');
        } finally {
            setIsExporting(false);
        }
    };

    // CSV Export Handler
    const handleExportCSV = async () => {
        try {
            const { label } = getReportDateRange();
            const redemptionRate = Number(config.redemption_rate) || 10;
            
            let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
            csvContent += "رقم المعاملة,التاريخ,الهاتف,اسم العميل,نوع العملية,النقاط المستهلكة,قيمة الخصم (ر.س),النقاط المكتسبة,مبلغ الفاتورة,الملاحظات\n";
            
            reportTransactions.forEach(t => {
                const foundCust = customers.find(c => c.phone_number?.trim() === t.customer_phone?.trim());
                const customerName = foundCust?.full_name || 'عميل';
                const isRedeem = (t.points_redeemed || 0) > 0;
                let typeName = t.type === 'admin_add' ? 'إضافة أدمن' : t.type === 'admin_deduct' ? 'خصم أدمن' : isRedeem ? 'استهلاك نقاط' : 'كسب نقاط';
                const discount = isRedeem && redemptionRate > 0 ? ((t.points_redeemed || 0) / redemptionRate).toFixed(2) : '0';
                
                const row = [
                    t.id,
                    new Date(t.created_at).toLocaleString('ar-SA').replace(/,/g, ' '),
                    t.customer_phone,
                    `"${customerName.replace(/"/g, '""')}"`,
                    typeName,
                    t.points_redeemed || 0,
                    discount,
                    t.points_earned || 0,
                    t.amount || 0,
                    `"${(t.notes || '').replace(/"/g, '""')}"`
                ].join(',');
                csvContent += row + "\n";
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `تقرير_استهلاك_الولاء_${label.replace(/[\s\/\\:]+/g, '_')}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('تم تصدير ملف CSV بنجاح');
            setExportModalOpen(false);
        } catch (err) {
            toast.error('حدث خطأ أثناء تصدير CSV');
        }
    };

    // Save Loyalty Config
    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingConfig(true);
        try {
            const maxPercentage = Math.min(100, Math.max(1, Number(config.max_redemption_percentage) || 50));
            // Always preserve max percentage and welcome points locally immediately
            localStorage.setItem('jamr_loyalty_max_percentage', String(maxPercentage));
            const welcomeBonus = Math.max(0, Number(config.welcome_bonus_points) || 0);
            localStorage.setItem('jamr_welcome_points_amount', String(welcomeBonus));

            const corePayload: any = {
                id: 1,
                is_enabled: config.is_enabled,
                earning_rate: Math.max(0.1, Number(config.earning_rate) || 1),
                redemption_rate: Math.max(1, Number(config.redemption_rate) || 10),
                min_points_to_redeem: Math.max(0, Number(config.min_points_to_redeem) || 5),
                welcome_bonus_points: Math.max(0, Number(config.welcome_bonus_points) || 0),
                updated_at: new Date().toISOString()
            };

            // Full payload with max_redemption_percentage
            const fullPayload = {
                ...corePayload,
                max_redemption_percentage: maxPercentage
            };

            let saveSuccess = false;

            // 1. Try upsert with full payload
            const attempt1 = await supabaseAdmin.from('loyalty_config').upsert([fullPayload], { onConflict: 'id' });
            if (!attempt1.error) {
                saveSuccess = true;
            } else {
                console.warn('Upsert with full payload failed (missing column in DB):', attempt1.error);

                // 2. Fallback: try core payload without max_redemption_percentage
                const attempt2 = await supabaseAdmin.from('loyalty_config').upsert([corePayload], { onConflict: 'id' });
                if (!attempt2.error) {
                    saveSuccess = true;
                } else {
                    console.warn('Upsert with core payload on admin client failed:', attempt2.error);
                    // 3. Fallback: try standard supabase client
                    const attempt3 = await supabase.from('loyalty_config').upsert([corePayload], { onConflict: 'id' });
                    if (!attempt3.error) {
                        saveSuccess = true;
                    } else {
                        // 4. Fallback: try direct update
                        const attempt4 = await supabaseAdmin.from('loyalty_config').update(corePayload).eq('id', 1);
                        if (!attempt4.error) {
                            saveSuccess = true;
                        } else {
                            const attempt5 = await supabase.from('loyalty_config').update(corePayload).eq('id', 1);
                            if (!attempt5.error) {
                                saveSuccess = true;
                            }
                        }
                    }
                }
            }

            // Save full config to local cache
            localStorage.setItem('jamr_loyalty_config', JSON.stringify({ ...corePayload, max_redemption_percentage: maxPercentage }));

            toast.success('تم حفظ إعدادات نظام الولاء بنجاح 🌟');
            fetchConfig();
        } catch (err: any) {
            console.error('Save config error:', err);
            toast.error('حدث خطأ أثناء حفظ الإعدادات: ' + (err?.message || ''));
        } finally {
            setSavingConfig(false);
        }
    };

    // Handle Adjust Points (Add / Deduct)
    const handleAdjustPointsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { customer, type, points, reason } = adjustModal;
        if (!customer || !points || parseInt(points) <= 0) {
            toast.error('يرجى إدخال عدد نقاط صحيح');
            return;
        }

        const ptsAmount = parseInt(points);
        setAdjustModal(prev => ({ ...prev, isSubmitting: true }));

        try {
            const currentBalance = customer.points_balance || 0;
            const newBalance = type === 'add' 
                ? currentBalance + ptsAmount 
                : Math.max(0, currentBalance - ptsAmount);

            // 1. Update customer balance
            const { error: custError } = await supabaseAdmin
                .from('customers')
                .update({ 
                    points_balance: newBalance,
                    updated_at: new Date().toISOString()
                })
                .eq('phone_number', customer.phone_number);

            if (custError) throw custError;

            // 2. Insert transaction record
            const txPayload = {
                customer_phone: customer.phone_number,
                type: type === 'add' ? 'admin_add' : 'admin_deduct',
                amount: 0,
                points_earned: type === 'add' ? ptsAmount : 0,
                points_redeemed: type === 'deduct' ? ptsAmount : 0,
                notes: reason ? `[تعديل أدمن]: ${reason}` : 'تعديل رصيد النقاط من لوحة الإدارة',
                staff_id: 'الأدمن',
                created_at: new Date().toISOString()
            };

            await supabaseAdmin.from('transactions').insert([txPayload]);

            toast.success(`تم ${type === 'add' ? 'إضافة' : 'خصم'} ${ptsAmount} نقطة للعميل بنجاح!`);
            setAdjustModal({ isOpen: false, customer: null, type: 'add', points: '', reason: '', isSubmitting: false });
            fetchCustomers();
            fetchTransactions();
        } catch (err: any) {
            console.error('Adjust points error:', err);
            toast.error('حدث خطأ أثناء تعديل النقاط');
            setAdjustModal(prev => ({ ...prev, isSubmitting: false }));
        }
    };

    // Handle Create New Customer
    const handleCreateCustomerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { phone, name, points } = newCustomerModal;
        const cleanPhone = phone.trim();
        const cleanName = name.trim();
        const initialPts = parseInt(points) || 0;

        if (!cleanPhone || cleanPhone.length < 9) {
            toast.error('يرجى إدخال رقم جوال صحيح');
            return;
        }

        setNewCustomerModal(prev => ({ ...prev, isSubmitting: true }));

        try {
            // 1. Upsert customer
            const { error: custError } = await supabaseAdmin
                .from('customers')
                .upsert([{
                    phone_number: cleanPhone,
                    full_name: cleanName || 'عميل المحل',
                    points_balance: initialPts,
                    updated_at: new Date().toISOString()
                }]);

            if (custError) throw custError;

            // 2. If initial points > 0, log transaction
            if (initialPts > 0) {
                await supabaseAdmin.from('transactions').insert([{
                    customer_phone: cleanPhone,
                    type: 'admin_add',
                    amount: 0,
                    points_earned: initialPts,
                    points_redeemed: 0,
                    notes: 'رصيد افتتاحي عند التسجيل في اللوحة',
                    staff_id: 'الأدمن',
                    created_at: new Date().toISOString()
                }]);
            }

            toast.success('تم تسجيل العميل بنجاح في نظام الولاء!');
            setNewCustomerModal({ isOpen: false, phone: '', name: '', points: '0', isSubmitting: false });
            fetchCustomers();
            fetchTransactions();
        } catch (err: any) {
            console.error('Create customer error:', err);
            toast.error('حدث خطأ أثناء إضافة العميل');
            setNewCustomerModal(prev => ({ ...prev, isSubmitting: false }));
        }
    };

    // Filtered Customers
    const filteredCustomers = customers.filter(c => 
        (c.full_name && c.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.phone_number && c.phone_number.includes(searchQuery))
    );

    // Filtered Transactions
    const filteredTransactions = transactions.filter(t =>
        (t.customer_phone && t.customer_phone.includes(txSearchQuery)) ||
        (t.notes && t.notes.toLowerCase().includes(txSearchQuery.toLowerCase()))
    );

    // Stats Summary Calculations
    const totalCustomersCount = customers.length;
    const totalActivePoints = customers.reduce((sum, c) => sum + (c.points_balance || 0), 0);
    const totalMonetaryValue = config.redemption_rate > 0 ? (totalActivePoints / config.redemption_rate) : 0;
    const totalRedeemedPoints = transactions.reduce((sum, t) => sum + (t.points_redeemed || 0), 0);

    return (
        <div className="space-y-8 select-none text-right" dir="rtl">
            {/* Header Title & Status Bar */}
            <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border border-white/10 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-400 border border-amber-500/30">
                            <Gift size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white flex items-center gap-2">
                                إدارة نظام الولاء والنقاط
                                <span className={cn(
                                    "text-xs px-3 py-1 rounded-full font-bold border",
                                    config.is_enabled 
                                        ? "bg-green-500/10 text-green-400 border-green-500/30" 
                                        : "bg-red-500/10 text-red-400 border-red-500/30"
                                )}>
                                    {config.is_enabled ? '● نَشِط ومُفَعَّل' : '○ مُعَطَّل حالياً'}
                                </span>
                            </h2>
                            <p className="text-xs text-gray-400">تحكم كامل بالإعدادات، نسب الاكتساب والاستبدال، ورصيد نقاط العملاء</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <button
                        onClick={() => { fetchConfig(); fetchCustomers(); fetchTransactions(); }}
                        className="p-3 bg-zinc-800/80 hover:bg-zinc-700 text-gray-300 rounded-2xl transition-all cursor-pointer border border-white/5"
                        title="تحديث البيانات"
                    >
                        <RefreshCw size={18} />
                    </button>
                    
                    <button
                        onClick={() => setExportModalOpen(true)}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-3 rounded-2xl text-xs sm:text-sm shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                    >
                        <FileSpreadsheet size={18} /> تصدير تقرير الولاء (Excel)
                    </button>

                    <button
                        onClick={() => setNewCustomerModal(prev => ({ ...prev, isOpen: true }))}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-4 py-3 rounded-2xl text-xs sm:text-sm shadow-lg shadow-primary/20 transition-all cursor-pointer"
                    >
                        <Plus size={18} /> إضافة عميل بالولاء
                    </button>
                </div>
            </div>

            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-zinc-900 border border-white/5 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500">إجمالي أعضاء الولاء</p>
                        <h3 className="text-2xl font-black text-white mt-1">{totalCustomersCount} <span className="text-xs font-normal text-gray-400">عميل</span></h3>
                        <p className="text-[10px] text-gray-400 mt-1">مسجلين برقم الجوال في القاعدة</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20">
                        <Users size={22} />
                    </div>
                </div>

                <div className="bg-zinc-900 border border-white/5 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500">إجمالي النقاط النشطة</p>
                        <h3 className="text-2xl font-black text-amber-400 mt-1">{totalActivePoints.toLocaleString()} <span className="text-xs font-normal text-amber-400/70">نقطة</span></h3>
                        <p className="text-[10px] text-gray-400 mt-1">في أرصدة جميع العملاء الحالية</p>
                    </div>
                    <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 border border-amber-500/20">
                        <Coins size={22} />
                    </div>
                </div>

                <div className="bg-zinc-900 border border-white/5 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500">قيمة خصم الأرصدة الحالية</p>
                        <h3 className="text-2xl font-black text-emerald-400 mt-1">{totalMonetaryValue.toFixed(2)} <span className="text-xs font-normal text-emerald-400/70">ر.س</span></h3>
                        <p className="text-[10px] text-gray-400 mt-1">استناداً لنسبة الاستبدال الحالية</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                        <Award size={22} />
                    </div>
                </div>

                <div className="bg-zinc-900 border border-white/5 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500">إجمالي النقاط المستبدلة</p>
                        <h3 className="text-2xl font-black text-purple-400 mt-1">{totalRedeemedPoints.toLocaleString()} <span className="text-xs font-normal text-purple-400/70">نقطة</span></h3>
                        <p className="text-[10px] text-gray-400 mt-1">تم استهلاكها في خصومات سابقة</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 border border-purple-500/20">
                        <TrendingUp size={22} />
                    </div>
                </div>
            </div>

            {/* Inner Tabs Navigation */}
            <div className="flex border-b border-white/10 gap-2">
                {[
                    { id: 'config', label: 'إعدادات وقواعد الولاء ⚙️', icon: <Settings size={16} /> },
                    { id: 'customers', label: 'دليل وأرصدة العملاء 👥', icon: <Users size={16} /> },
                    { id: 'transactions', label: 'سجل حركات النقاط 📜', icon: <History size={16} /> },
                    { id: 'reports', label: 'تقرير الاستهلاك والتحليلات 📊', icon: <FileSpreadsheet size={16} /> }
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveSubTab(t.id as any)}
                        className={cn(
                            "flex items-center gap-2 px-5 py-3 rounded-t-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer border-b-2",
                            activeSubTab === t.id
                                ? "bg-zinc-900 text-primary border-primary"
                                : "text-gray-400 hover:text-white border-transparent hover:bg-zinc-900/50"
                        )}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* TAB 1: CONFIGURATION */}
            {activeSubTab === 'config' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <form onSubmit={handleSaveConfig} className="bg-zinc-900 border border-white/5 p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl">
                        <div className="flex justify-between items-center pb-4 border-b border-white/5 flex-wrap gap-3">
                            <div>
                                <h3 className="text-lg font-black text-white">إعدادات ونسب احتساب نظام الولاء</h3>
                                <p className="text-xs text-gray-400">حدد قواعد جمع واستبدال النقاط للتطبيق والكاشير</p>
                            </div>
                            
                            {/* Toggle System Enabled */}
                            <button
                                type="button"
                                onClick={() => setConfig(prev => ({ ...prev, is_enabled: !prev.is_enabled }))}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer border",
                                    config.is_enabled 
                                        ? "bg-green-500/20 text-green-400 border-green-500/40" 
                                        : "bg-zinc-800 text-gray-400 border-white/10"
                                )}
                            >
                                {config.is_enabled ? <ToggleRight size={24} className="text-green-400" /> : <ToggleLeft size={24} className="text-gray-500" />}
                                <span>{config.is_enabled ? 'نظام الولاء: مُفَعَّل' : 'نظام الولاء: مُعَطَّل'}</span>
                            </button>
                        </div>

                        {loadingConfig ? (
                            <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" size={32} /></div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Earning Rate */}
                                <div className="bg-zinc-800/50 p-5 rounded-2xl border border-white/5 space-y-3">
                                    <div className="flex items-center gap-2 text-amber-400">
                                        <Coins size={20} />
                                        <label className="font-bold text-sm text-white">معدل كسب النقاط (Earning Rate)</label>
                                    </div>
                                    <p className="text-xs text-gray-400">كم ريال ينفقه العميل في الفاتورة يحصل على <span className="text-white font-bold">1 نقطة</span>؟</p>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-gray-400">كل</span>
                                        <input
                                            type="number"
                                            min="1"
                                            value={config.earning_rate}
                                            onChange={e => setConfig(prev => ({ ...prev, earning_rate: Math.max(1, parseFloat(e.target.value) || 1) }))}
                                            className="w-28 bg-zinc-900 text-amber-400 font-black text-center text-lg rounded-xl p-3 border border-white/10 focus:ring-2 focus:ring-amber-500 outline-none"
                                        />
                                        <span className="text-xs font-bold text-white">ريال = 1 نقطة ولاء 🌟</span>
                                    </div>
                                    <p className="text-[11px] text-amber-400/80 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                                        مثال: فاتورة بـ 50 ريال تمنح العميل <span className="font-bold">{Math.floor(50 / (config.earning_rate || 1))} نقاط</span>.
                                    </p>
                                </div>

                                {/* Redemption Rate */}
                                <div className="bg-zinc-800/50 p-5 rounded-2xl border border-white/5 space-y-3">
                                    <div className="flex items-center gap-2 text-emerald-400">
                                        <Award size={20} />
                                        <label className="font-bold text-sm text-white">معدل استبدال النقاط (Redemption Rate)</label>
                                    </div>
                                    <p className="text-xs text-gray-400">كم نقطة يستبدلها العميل لتعادله <span className="text-white font-bold">1 ريال خصم</span>؟</p>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-gray-400">كل</span>
                                        <input
                                            type="number"
                                            min="1"
                                            value={config.redemption_rate}
                                            onChange={e => setConfig(prev => ({ ...prev, redemption_rate: Math.max(1, parseFloat(e.target.value) || 1) }))}
                                            className="w-28 bg-zinc-900 text-emerald-400 font-black text-center text-lg rounded-xl p-3 border border-white/10 focus:ring-2 focus:ring-emerald-500 outline-none"
                                        />
                                        <span className="text-xs font-bold text-white">نقاط = 1 ريال خصم 💰</span>
                                    </div>
                                    <p className="text-[11px] text-emerald-400/80 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                                        مثال: رصيد 25 نقطة يعادل خصماً قيمته <span className="font-bold">{Math.floor(25 / (config.redemption_rate || 1))} ريال</span>.
                                    </p>
                                </div>

                                {/* Min Points to Redeem */}
                                <div className="bg-zinc-800/50 p-5 rounded-2xl border border-white/5 space-y-3">
                                    <div className="flex items-center gap-2 text-blue-400">
                                        <ShieldAlert size={20} />
                                        <label className="font-bold text-sm text-white">الحد الأدنى لاستبدال النقاط</label>
                                    </div>
                                    <p className="text-xs text-gray-400">الحد الأدنى من النقاط الواجب توفرها في رصيد العميل لتفعيل زر الخصم</p>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            min="0"
                                            value={config.min_points_to_redeem}
                                            onChange={e => setConfig(prev => ({ ...prev, min_points_to_redeem: Math.max(0, parseInt(e.target.value) || 0) }))}
                                            className="w-28 bg-zinc-900 text-blue-400 font-black text-center text-lg rounded-xl p-3 border border-white/10 focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                        <span className="text-xs font-bold text-white">نقاط كحد أدنى للاستبدال</span>
                                    </div>
                                </div>

                                {/* Welcome Bonus Points */}
                                <div className="bg-zinc-800/50 p-5 rounded-2xl border border-white/5 space-y-3">
                                    <div className="flex items-center gap-2 text-purple-400">
                                        <Sparkles size={20} />
                                        <label className="font-bold text-sm text-white">النقاط الترحيبية للعميل الجديد</label>
                                    </div>
                                    <p className="text-xs text-gray-400">عدد النقاط المجانية الممنوحة تلقائياً للعميل عند أول تسجيل برقم جواله</p>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            min="0"
                                            value={config.welcome_bonus_points}
                                            onChange={e => setConfig(prev => ({ ...prev, welcome_bonus_points: Math.max(0, parseInt(e.target.value) || 0) }))}
                                            className="w-28 bg-zinc-900 text-purple-400 font-black text-center text-lg rounded-xl p-3 border border-white/10 focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                        <span className="text-xs font-bold text-white">نقطة هدية ترحيبية 🎁</span>
                                    </div>
                                </div>

                                {/* Max Redemption Percentage */}
                                <div className="bg-zinc-800/50 p-5 rounded-2xl border border-white/5 space-y-3 md:col-span-2">
                                    <div className="flex items-center gap-2 text-orange-400">
                                        <TrendingUp size={20} />
                                        <label className="font-bold text-sm text-white">أقصى نسبة خصم بالنقاط من سعر الفاتورة (%)</label>
                                    </div>
                                    <p className="text-xs text-gray-400">
                                        تحديد أقصى نسبة خصم مسموح بها بالنقاط للطلب الواحد لمنع تصفير الطلب كاملاً وإلزام العميل بدفع المتبقي نقداً/شبكة (مثال: 50% تضمن تحصيل نصف المبلغ وتوفر باقي النقاط لطلب قادم).
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={config.max_redemption_percentage}
                                            onChange={e => setConfig(prev => ({ ...prev, max_redemption_percentage: Math.min(100, Math.max(1, parseInt(e.target.value) || 50)) }))}
                                            className="w-28 bg-zinc-900 text-orange-400 font-black text-center text-lg rounded-xl p-3 border border-white/10 focus:ring-2 focus:ring-orange-500 outline-none"
                                        />
                                        <span className="text-xs font-bold text-white">% من إجمالي الطلب كحد أقصى للخصم</span>
                                    </div>
                                    <p className="text-[11px] text-orange-400/80 bg-orange-500/10 p-2.5 rounded-xl border border-orange-500/20">
                                        💡 إذا كان لدى العميل نقاط بـ 40 ر.س واشترى بـ 40 ر.س (ونسبة الخصم القصوى {config.max_redemption_percentage}%): سيحصل على خصم <span className="font-bold">{(40 * (config.max_redemption_percentage || 50) / 100).toFixed(0)} ر.س فقط</span> ويدفع الباقي كاش/شبكة، وتحفظ باقي نقاطه للطلب القادم.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="pt-4 border-t border-white/5 flex justify-end">
                            <button
                                type="submit"
                                disabled={savingConfig || loadingConfig}
                                className="bg-primary hover:bg-primary/90 text-white font-black px-8 py-3.5 rounded-2xl flex items-center gap-2 shadow-xl shadow-primary/20 transition-all cursor-pointer disabled:opacity-50"
                            >
                                {savingConfig ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                                حفظ إعدادات الولاء
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}

            {/* TAB 2: CUSTOMERS MANAGEMENT */}
            {activeSubTab === 'customers' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-zinc-900 border border-white/5 p-5 rounded-3xl">
                        <div className="relative flex-1">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="ابحث باسم العميل أو رقم الجوال..."
                                className="w-full pr-12 pl-4 py-3 bg-zinc-800 text-white rounded-2xl border border-white/5 focus:ring-2 focus:ring-primary outline-none text-xs sm:text-sm font-bold"
                            />
                        </div>
                        <div className="text-xs font-bold text-gray-400 flex items-center justify-between sm:justify-start gap-3">
                            <span>عدد نتائج البحث: <strong className="text-primary font-mono">{filteredCustomers.length}</strong> عميل</span>
                        </div>
                    </div>

                    {loadingCustomers ? (
                        <div className="flex justify-center p-16"><Loader2 className="animate-spin text-primary" size={32} /></div>
                    ) : (
                        <div className="bg-zinc-900 rounded-3xl overflow-hidden border border-white/5 overflow-x-auto shadow-2xl">
                            <table className="w-full text-xs text-right">
                                <thead className="bg-zinc-800/60 text-gray-400 border-b border-white/5">
                                    <tr>
                                        <th className="p-4 font-bold">اسم العميل</th>
                                        <th className="p-4 font-bold">رقم الجوال</th>
                                        <th className="p-4 font-bold">رصيد النقاط الحالية</th>
                                        <th className="p-4 font-bold">القيمة الموازية بالخصم</th>
                                        <th className="p-4 font-bold">تاريخ التسجيل</th>
                                        <th className="p-4 font-bold text-center">إجراءات وتعديل</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredCustomers.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-12 text-center text-gray-500 font-bold">
                                                لا يوجد عملاء مطابقين للبحث في نظام الولاء
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredCustomers.map(cust => {
                                            const pts = cust.points_balance || 0;
                                            const sarValue = config.redemption_rate > 0 ? Math.floor(pts / config.redemption_rate) : 0;
                                            return (
                                                <tr key={cust.phone_number} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="p-4 font-bold text-white flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                                            {cust.full_name?.charAt(0) || 'ع'}
                                                        </div>
                                                        {cust.full_name || 'عميل المحل'}
                                                    </td>
                                                    <td className="p-4 font-mono text-gray-300" dir="ltr">{cust.phone_number}</td>
                                                    <td className="p-4">
                                                        <span className="font-black text-amber-400 text-sm bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20 inline-block">
                                                            {pts} نقطة 🌟
                                                        </span>
                                                    </td>
                                                    <td className="p-4 font-bold text-emerald-400">
                                                        = {sarValue} ر.س خصم
                                                    </td>
                                                    <td className="p-4 text-gray-500 font-mono text-[11px]">
                                                        {cust.created_at ? new Date(cust.created_at).toLocaleDateString('ar-SA') : 'سابق'}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => setAdjustModal({
                                                                    isOpen: true,
                                                                    customer: cust,
                                                                    type: 'add',
                                                                    points: '',
                                                                    reason: '',
                                                                    isSubmitting: false
                                                                })}
                                                                className="flex items-center gap-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer"
                                                            >
                                                                <Plus size={14} /> إضافة
                                                            </button>
                                                            <button
                                                                onClick={() => setAdjustModal({
                                                                    isOpen: true,
                                                                    customer: cust,
                                                                    type: 'deduct',
                                                                    points: '',
                                                                    reason: '',
                                                                    isSubmitting: false
                                                                })}
                                                                className="flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer"
                                                            >
                                                                <Minus size={14} /> خصم
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            )}

            {/* TAB 4: REPORTS & ANALYTICS */}
            {activeSubTab === 'reports' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    {/* Filter & Export Toolbar */}
                    <div className="bg-zinc-900 border border-white/5 p-6 rounded-3xl space-y-4 shadow-xl">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-wrap">
                            <div>
                                <h3 className="text-lg font-black text-white flex items-center gap-2">
                                    <FileSpreadsheet className="text-emerald-400" size={20} /> تقرير استهلاك واستبدال النقاط
                                </h3>
                                <p className="text-xs text-gray-400">تحليل تفصيلي للنقاط المستهلكة والمكتسبة وحجم الخصومات الممنوحة</p>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                <button
                                    onClick={handleExportExcel}
                                    disabled={isExporting}
                                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {isExporting ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
                                    تصدير Excel (.xlsx)
                                </button>
                                <button
                                    onClick={handleExportCSV}
                                    className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-gray-200 font-bold px-4 py-2.5 rounded-xl text-xs border border-white/5 transition-all cursor-pointer"
                                >
                                    <Download size={16} /> تصدير CSV
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-gray-200 font-bold px-4 py-2.5 rounded-xl text-xs border border-white/5 transition-all cursor-pointer"
                                >
                                    <Printer size={16} /> طباعة
                                </button>
                            </div>
                        </div>

                        {/* Timeframe Filters */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5">
                            <div className="flex bg-zinc-800/80 p-1 rounded-2xl gap-1 flex-wrap">
                                {[
                                    { id: 'all', label: 'كل الأوقات' },
                                    { id: 'thisMonth', label: 'هذا الشهر' },
                                    { id: '30days', label: 'آخر 30 يوم' },
                                    { id: '7days', label: 'آخر 7 أيام' },
                                    { id: 'today', label: 'اليوم' },
                                    { id: 'custom', label: 'تاريخ مخصص' }
                                ].map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setReportTimeframe(t.id as any)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                                            reportTimeframe === t.id
                                                ? "bg-primary text-white shadow-md shadow-primary/20"
                                                : "text-gray-400 hover:text-white"
                                        )}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>

                            {reportTimeframe === 'custom' && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    <div className="flex items-center gap-1.5 bg-zinc-800 px-3 py-1.5 rounded-xl border border-white/5 text-xs">
                                        <span className="text-gray-400">من:</span>
                                        <input
                                            type="date"
                                            value={reportStartDate}
                                            onChange={e => setReportStartDate(e.target.value)}
                                            className="bg-transparent text-white outline-none"
                                        />
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-zinc-800 px-3 py-1.5 rounded-xl border border-white/5 text-xs">
                                        <span className="text-gray-400">إلى:</span>
                                        <input
                                            type="date"
                                            value={reportEndDate}
                                            onChange={e => setReportEndDate(e.target.value)}
                                            className="bg-transparent text-white outline-none"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Report KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-zinc-900 border border-white/5 p-5 rounded-2xl flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-gray-400">إجمالي النقاط المستهلكة</p>
                                <h3 className="text-2xl font-black text-amber-400 mt-1">{reportMetrics.totalRedeemed.toLocaleString()} <span className="text-xs font-normal text-amber-400/70">نقطة</span></h3>
                                <p className="text-[10px] text-gray-500 mt-1">تم خصمها واستبدالها بالفترة</p>
                            </div>
                            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 border border-amber-500/20">
                                <TrendingUp size={22} />
                            </div>
                        </div>

                        <div className="bg-zinc-900 border border-white/5 p-5 rounded-2xl flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-gray-400">قيمة الخصومات المستهلكة</p>
                                <h3 className="text-2xl font-black text-emerald-400 mt-1">{reportMetrics.discountSAR.toFixed(2)} <span className="text-xs font-normal text-emerald-400/70">ر.س</span></h3>
                                <p className="text-[10px] text-gray-500 mt-1">وفرها العملاء عبر نقاطهم</p>
                            </div>
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                                <DollarSign size={22} />
                            </div>
                        </div>

                        <div className="bg-zinc-900 border border-white/5 p-5 rounded-2xl flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-gray-400">عدد عمليات الاستبدال</p>
                                <h3 className="text-2xl font-black text-purple-400 mt-1">{reportMetrics.redeemCount} <span className="text-xs font-normal text-purple-400/70">عملية</span></h3>
                                <p className="text-[10px] text-gray-500 mt-1">استفاد منها عملاء الولاء</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 border border-purple-500/20">
                                <Award size={22} />
                            </div>
                        </div>

                        <div className="bg-zinc-900 border border-white/5 p-5 rounded-2xl flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-gray-400">إجمالي النقاط المكتسبة</p>
                                <h3 className="text-2xl font-black text-blue-400 mt-1">{reportMetrics.totalEarned.toLocaleString()} <span className="text-xs font-normal text-blue-400/70">نقطة</span></h3>
                                <p className="text-[10px] text-gray-500 mt-1">من طلبات الشراء الجديدة</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20">
                                <Coins size={22} />
                            </div>
                        </div>
                    </div>

                    {/* Top Redeemers List */}
                    {reportMetrics.topRedeemers.length > 0 && (
                        <div className="bg-zinc-900 border border-white/5 p-6 rounded-3xl space-y-4 shadow-xl">
                            <h4 className="text-sm font-black text-white flex items-center gap-2">
                                <Sparkles className="text-amber-400" size={18} /> قائمة أكثر العملاء استهلاكاً للنقاط بالفترة
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {reportMetrics.topRedeemers.map((c, idx) => (
                                    <div key={c.phone} className="bg-zinc-800/70 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black flex items-center justify-center">
                                                    #{idx + 1}
                                                </span>
                                                <p className="text-xs font-black text-white">{c.name}</p>
                                            </div>
                                            <p className="text-[11px] font-mono text-gray-400" dir="ltr">{c.phone}</p>
                                            <p className="text-[10px] text-gray-500">{c.txCount} عمليات استبدال</p>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-black text-amber-400">-{c.totalRedeemed.toLocaleString()}</p>
                                            <p className="text-[10px] text-emerald-400 font-bold">
                                                {config.redemption_rate > 0 ? (c.totalRedeemed / config.redemption_rate).toFixed(1) : 0} ر.س
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Detailed Consumption Table */}
                    <div className="bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl space-y-4 p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div>
                                <h4 className="text-sm font-black text-white">جدول حركات الاستهلاك والاكتساب التفصيلي</h4>
                                <p className="text-xs text-gray-400">إجمالي {filteredReportTransactions.length} حركة مسجلة</p>
                            </div>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute right-3.5 top-3 text-gray-500" size={16} />
                                <input
                                    type="text"
                                    placeholder="بحث برقم الجوال أو الملاحظات..."
                                    value={reportSearchQuery}
                                    onChange={e => setReportSearchQuery(e.target.value)}
                                    className="w-full bg-zinc-800 text-white text-xs pr-10 pl-4 py-2.5 rounded-xl border border-white/5 focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>
                        </div>

                        {loadingReportData ? (
                            <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
                                <Loader2 className="animate-spin text-primary" size={32} />
                                <p className="text-xs">جاري تحميل حركات الاستهلاك...</p>
                            </div>
                        ) : filteredReportTransactions.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                <History size={36} className="mx-auto mb-2 opacity-30" />
                                <p className="text-sm font-bold">لا توجد حركات ولاء في هذه الفترة</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-right text-xs">
                                    <thead>
                                        <tr className="border-b border-white/10 text-gray-400">
                                            <th className="p-3.5">العميل</th>
                                            <th className="p-3.5">نوع الحركة</th>
                                            <th className="p-3.5">النقاط المستهلكة</th>
                                            <th className="p-3.5">قيمة الخصم</th>
                                            <th className="p-3.5">النقاط المكتسبة</th>
                                            <th className="p-3.5">الملاحظات</th>
                                            <th className="p-3.5">التاريخ والوقت</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredReportTransactions.map(tx => {
                                            const isRedeem = (tx.points_redeemed || 0) > 0;
                                            const isEarn = (tx.points_earned || 0) > 0;
                                            const foundCust = customers.find(c => c.phone_number?.trim() === tx.customer_phone?.trim());
                                            const discountVal = isRedeem && config.redemption_rate > 0 
                                                ? ((tx.points_redeemed || 0) / config.redemption_rate).toFixed(2)
                                                : '-';

                                            return (
                                                <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="p-3.5">
                                                        <p className="font-bold text-white">{foundCust?.full_name || 'عميل'}</p>
                                                        <p className="text-[11px] font-mono text-gray-400" dir="ltr">{tx.customer_phone}</p>
                                                    </td>
                                                    <td className="p-3.5">
                                                        <span className={cn(
                                                            "px-2.5 py-1 rounded-xl text-[10px] font-bold inline-flex items-center gap-1",
                                                            tx.type === 'admin_add' && "bg-blue-500/10 text-blue-400 border border-blue-500/20",
                                                            tx.type === 'admin_deduct' && "bg-red-500/10 text-red-400 border border-red-500/20",
                                                            (tx.type === 'earn' || isEarn) && "bg-green-500/10 text-green-400 border border-green-500/20",
                                                            (tx.type === 'redeem' || isRedeem) && "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                                        )}>
                                                            {tx.type === 'admin_add' ? 'تعديل أدمن (+)' : tx.type === 'admin_deduct' ? 'خصم أدمن (-)' : isRedeem ? 'استهلاك خصم' : 'كسب نقاط طلب'}
                                                        </span>
                                                    </td>
                                                    <td className="p-3.5 font-bold text-amber-400">
                                                        {isRedeem ? `-${tx.points_redeemed} نقطة` : '-'}
                                                    </td>
                                                    <td className="p-3.5 font-bold text-emerald-400">
                                                        {discountVal !== '-' ? `${discountVal} ر.س` : '-'}
                                                    </td>
                                                    <td className="p-3.5 font-bold text-green-400">
                                                        {isEarn ? `+${tx.points_earned} نقطة` : '-'}
                                                    </td>
                                                    <td className="p-3.5 text-gray-400 max-w-xs truncate">
                                                        {tx.notes || 'معاملة تلقائية'}
                                                    </td>
                                                    <td className="p-3.5 text-gray-500 font-mono text-[11px]">
                                                        {new Date(tx.created_at).toLocaleString('ar-SA', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* MODAL 3: EXPORT MODAL */}
            <AnimatePresence>
                {exportModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setExportModalOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-zinc-900 rounded-3xl p-6 border border-white/10 shadow-2xl space-y-5 text-right" dir="rtl">
                            <div className="flex justify-between items-center pb-3 border-b border-white/5">
                                <h3 className="font-black text-lg text-white flex items-center gap-2">
                                    <FileSpreadsheet className="text-emerald-400" /> تصدير تقرير نظام الولاء
                                </h3>
                                <button onClick={() => setExportModalOpen(false)} className="text-gray-400 hover:text-white p-1 cursor-pointer"><X size={20} /></button>
                            </div>

                            <p className="text-xs text-gray-400">حدد الفترة الزمنية المطلوبة لتصدير تقرير شامل بحركات الاستهلاك والاكتساب وأرصدة العملاء:</p>

                            {/* Timeframe selector */}
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'all', label: 'كل الأوقات' },
                                    { id: 'thisMonth', label: 'هذا الشهر' },
                                    { id: '30days', label: 'آخر 30 يوم' },
                                    { id: '7days', label: 'آخر 7 أيام' },
                                    { id: 'today', label: 'اليوم' },
                                    { id: 'custom', label: 'تاريخ مخصص' }
                                ].map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setReportTimeframe(t.id as any)}
                                        className={cn(
                                            "p-2.5 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer",
                                            reportTimeframe === t.id
                                                ? "bg-primary text-white border-primary"
                                                : "bg-zinc-800 text-gray-300 border-white/5 hover:border-white/20"
                                        )}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>

                            {reportTimeframe === 'custom' && (
                                <div className="space-y-2 bg-zinc-800/60 p-3 rounded-xl border border-white/5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-400">تاريخ البدء:</span>
                                        <input
                                            type="date"
                                            value={reportStartDate}
                                            onChange={e => setReportStartDate(e.target.value)}
                                            className="bg-zinc-700 text-white px-2 py-1 rounded-lg outline-none"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-400">تاريخ الانتهاء:</span>
                                        <input
                                            type="date"
                                            value={reportEndDate}
                                            onChange={e => setReportEndDate(e.target.value)}
                                            className="bg-zinc-700 text-white px-2 py-1 rounded-lg outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2 pt-2">
                                <button
                                    onClick={handleExportExcel}
                                    disabled={isExporting}
                                    className="w-full py-3.5 rounded-xl font-black bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                                >
                                    {isExporting ? <Loader2 size={18} className="animate-spin" /> : <FileSpreadsheet size={18} />}
                                    تحميل ملف Excel مفصل (.xlsx)
                                </button>
                                <button
                                    onClick={handleExportCSV}
                                    className="w-full py-2.5 rounded-xl font-bold bg-zinc-800 hover:bg-zinc-700 text-gray-300 flex items-center justify-center gap-2 border border-white/5 cursor-pointer text-xs"
                                >
                                    <Download size={16} /> تحميل ملف CSV (.csv)
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* TAB 3: TRANSACTIONS HISTORY */}
            {activeSubTab === 'transactions' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="flex justify-between items-center bg-zinc-900 border border-white/5 p-5 rounded-3xl">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={txSearchQuery}
                                onChange={e => setTxSearchQuery(e.target.value)}
                                placeholder="فلترة بالحركات برقم الجوال أو السبب..."
                                className="w-full pr-12 pl-4 py-3 bg-zinc-800 text-white rounded-2xl border border-white/5 focus:ring-2 focus:ring-primary outline-none text-xs font-bold"
                            />
                        </div>
                        <span className="text-xs text-gray-400 font-bold">عرض آخر <strong className="text-white font-mono">{filteredTransactions.length}</strong> حركة سجل</span>
                    </div>

                    {loadingTransactions ? (
                        <div className="flex justify-center p-16"><Loader2 className="animate-spin text-primary" size={32} /></div>
                    ) : (
                        <div className="bg-zinc-900 rounded-3xl overflow-hidden border border-white/5 overflow-x-auto shadow-2xl">
                            <table className="w-full text-xs text-right">
                                <thead className="bg-zinc-800/60 text-gray-400 border-b border-white/5">
                                    <tr>
                                        <th className="p-4 font-bold">جوال العميل</th>
                                        <th className="p-4 font-bold">نوع العملية</th>
                                        <th className="p-4 font-bold">النقاط المكتسبة (+)</th>
                                        <th className="p-4 font-bold">النقاط المستبدلة (-)</th>
                                        <th className="p-4 font-bold">مبلغ العملية</th>
                                        <th className="p-4 font-bold">السبب والتفاصيل</th>
                                        <th className="p-4 font-bold">الوقت والتاريخ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredTransactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-12 text-center text-gray-500 font-bold">
                                                لا توجد حركات مسجلة مؤخراً في السجل
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredTransactions.map(tx => {
                                            const isEarn = tx.points_earned > 0;
                                            const isRedeem = tx.points_redeemed > 0;
                                            return (
                                                <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="p-4 font-mono font-bold text-white" dir="ltr">{tx.customer_phone}</td>
                                                    <td className="p-4">
                                                        <span className={cn(
                                                            "px-2.5 py-1 rounded-xl text-[10px] font-bold inline-flex items-center gap-1",
                                                            tx.type === 'admin_add' && "bg-blue-500/10 text-blue-400 border border-blue-500/20",
                                                            tx.type === 'admin_deduct' && "bg-red-500/10 text-red-400 border border-red-500/20",
                                                            tx.type === 'earn' && "bg-green-500/10 text-green-400 border border-green-500/20",
                                                            tx.type === 'redeem' && "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                                        )}>
                                                            {tx.type === 'admin_add' && <ArrowUpRight size={12} />}
                                                            {tx.type === 'admin_deduct' && <ArrowDownRight size={12} />}
                                                            {tx.type === 'admin_add' ? 'تعديل أدمن (+)' : tx.type === 'admin_deduct' ? 'خصم أدمن (-)' : tx.type === 'earn' ? 'كسب نقاط طلب' : 'استبدال خصم'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 font-bold text-green-400">
                                                        {isEarn ? `+${tx.points_earned} نقطة` : '-'}
                                                    </td>
                                                    <td className="p-4 font-bold text-amber-400">
                                                        {isRedeem ? `-${tx.points_redeemed} نقطة` : '-'}
                                                    </td>
                                                    <td className="p-4 font-mono text-gray-300">
                                                        {tx.amount > 0 ? `${tx.amount} ر.س` : 'ـ'}
                                                    </td>
                                                    <td className="p-4 text-gray-400 max-w-xs truncate">
                                                        {tx.notes || 'معاملة ولاء تلقائية'}
                                                    </td>
                                                    <td className="p-4 text-gray-500 font-mono text-[11px]">
                                                        {new Date(tx.created_at).toLocaleString('ar-SA', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            )}

            {/* MODAL 1: ADJUST POINTS (Add / Deduct) */}
            <AnimatePresence>
                {adjustModal.isOpen && adjustModal.customer && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAdjustModal(prev => ({ ...prev, isOpen: false }))} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-zinc-900 rounded-3xl p-6 border border-white/10 shadow-2xl space-y-5 text-right" dir="rtl">
                            <div className="flex justify-between items-center pb-3 border-b border-white/5">
                                <h3 className="font-black text-lg text-white flex items-center gap-2">
                                    {adjustModal.type === 'add' ? <Plus className="text-green-400" /> : <Minus className="text-red-400" />}
                                    {adjustModal.type === 'add' ? 'إضافة نقاط لعميل' : 'خصم نقاط من عميل'}
                                </h3>
                                <button onClick={() => setAdjustModal(prev => ({ ...prev, isOpen: false }))} className="text-gray-400 hover:text-white p-1 cursor-pointer"><X size={20} /></button>
                            </div>

                            <div className="bg-zinc-800/70 p-4 rounded-2xl border border-white/5 space-y-1">
                                <p className="text-xs text-gray-400">العميل المستهدف:</p>
                                <p className="text-sm font-black text-white">{adjustModal.customer.full_name}</p>
                                <p className="text-xs font-mono text-primary" dir="ltr">{adjustModal.customer.phone_number}</p>
                                <p className="text-xs text-amber-400 font-bold pt-2 border-t border-white/5">الرصيد الحالي: {adjustModal.customer.points_balance || 0} نقطة</p>
                            </div>

                            <form onSubmit={handleAdjustPointsSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-300">عدد النقاط المراد {adjustModal.type === 'add' ? 'إضافتها' : 'خصمها'}</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={adjustModal.points}
                                        onChange={e => setAdjustModal(prev => ({ ...prev, points: e.target.value }))}
                                        placeholder="مثال: 10"
                                        className="w-full bg-zinc-800 text-white font-black text-lg p-3.5 rounded-xl border border-white/10 focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-300">سبب التعديل / ملاحظة (اختياري)</label>
                                    <input
                                        type="text"
                                        value={adjustModal.reason}
                                        onChange={e => setAdjustModal(prev => ({ ...prev, reason: e.target.value }))}
                                        placeholder="مثال: مكافأة ولاء، تعويض طلب، تعديل..."
                                        className="w-full bg-zinc-800 text-white text-xs p-3.5 rounded-xl border border-white/10 focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={adjustModal.isSubmitting || !adjustModal.points}
                                    className={cn(
                                        "w-full py-3.5 rounded-xl font-black text-white flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50",
                                        adjustModal.type === 'add' ? "bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20" : "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20"
                                    )}
                                >
                                    {adjustModal.isSubmitting ? <Loader2 className="animate-spin" /> : 'تأكيد التعديل ورصد العملية'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL 2: ADD NEW CUSTOMER */}
            <AnimatePresence>
                {newCustomerModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setNewCustomerModal(prev => ({ ...prev, isOpen: false }))} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-zinc-900 rounded-3xl p-6 border border-white/10 shadow-2xl space-y-5 text-right" dir="rtl">
                            <div className="flex justify-between items-center pb-3 border-b border-white/5">
                                <h3 className="font-black text-lg text-white flex items-center gap-2">
                                    <User className="text-primary" /> تسجيل عميل جديد بالولاء
                                </h3>
                                <button onClick={() => setNewCustomerModal(prev => ({ ...prev, isOpen: false }))} className="text-gray-400 hover:text-white p-1 cursor-pointer"><X size={20} /></button>
                            </div>

                            <form onSubmit={handleCreateCustomerSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-300">رقم الجوال *</label>
                                    <input
                                        type="tel"
                                        required
                                        value={newCustomerModal.phone}
                                        onChange={e => setNewCustomerModal(prev => ({ ...prev, phone: e.target.value }))}
                                        placeholder="05xxxxxxxx"
                                        className="w-full bg-zinc-800 text-white font-mono p-3.5 rounded-xl border border-white/10 focus:ring-2 focus:ring-primary outline-none text-left"
                                        dir="ltr"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-300">اسم العميل بالكامل</label>
                                    <input
                                        type="text"
                                        value={newCustomerModal.name}
                                        onChange={e => setNewCustomerModal(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="مثال: محمد علي"
                                        className="w-full bg-zinc-800 text-white text-xs p-3.5 rounded-xl border border-white/10 focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-300">رصيد نقاط افتتاحي (اختياري)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={newCustomerModal.points}
                                        onChange={e => setNewCustomerModal(prev => ({ ...prev, points: e.target.value }))}
                                        placeholder="0"
                                        className="w-full bg-zinc-800 text-amber-400 font-black p-3.5 rounded-xl border border-white/10 focus:ring-2 focus:ring-amber-500 outline-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={newCustomerModal.isSubmitting || !newCustomerModal.phone}
                                    className="w-full py-3.5 rounded-xl font-black bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 cursor-pointer disabled:opacity-50"
                                >
                                    {newCustomerModal.isSubmitting ? <Loader2 className="animate-spin" /> : 'حفظ وتسجيل العميل'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
