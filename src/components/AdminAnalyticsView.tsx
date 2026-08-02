import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { motion, AnimatePresence } from 'motion/react';
import { 
    TrendingUp, TrendingDown, ShoppingBag, Users, 
    Calendar, Download, Printer, RefreshCw, FileSpreadsheet, 
    FileText, PieChart, BarChart3, Clock, ArrowUpRight, 
    ArrowDownRight, Sparkles, Store, CheckCircle2, XCircle, 
    Package, Filter, Layers, DollarSign, Award, ChevronDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

export type TimeframeOption = 
    | 'today' 
    | 'yesterday' 
    | '7days' 
    | '30days' 
    | 'thisMonth' 
    | 'lastMonth' 
    | 'thisYear' 
    | 'custom';

export const AdminAnalyticsView: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [branchesList, setBranchesList] = useState<string[]>(['السويدي الغربي', 'طويق']);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState<TimeframeOption>('30days');
    const [selectedBranch, setSelectedBranch] = useState<string>('all');
    const [customStartDate, setCustomStartDate] = useState<string>('');
    const [customEndDate, setCustomEndDate] = useState<string>('');
    const [activeChartTab, setActiveChartTab] = useState<'sales' | 'orders' | 'products' | 'hours'>('sales');

    // Fetch initial orders & products data
    const fetchData = async () => {
        setLoading(true);
        try {
            const [ordersRes, productsRes, branchesRes] = await Promise.all([
                supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false }),
                supabaseAdmin.from('products').select('*'),
                supabaseAdmin.from('store_settings').select('branch_name')
            ]);

            if (ordersRes.data) {
                setOrders(ordersRes.data);
                // Extract dynamic list of branches if present in orders
                const uniqueBranches = Array.from(new Set(ordersRes.data.map((o: any) => o.branch).filter(Boolean)));
                if (uniqueBranches.length > 0) {
                    setBranchesList(uniqueBranches as string[]);
                }
            }

            if (productsRes.data) {
                setProducts(productsRes.data);
            }

            if (branchesRes.data && branchesRes.data.length > 0) {
                const settingBranches = branchesRes.data.map(b => b.branch_name).filter(Boolean);
                setBranchesList(prev => Array.from(new Set([...prev, ...settingBranches])));
            }
        } catch (err) {
            console.error('Error fetching analytics data:', err);
            toast.error('حدث خطأ أثناء تحميل بيانات الإحصائيات');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Real-time subscription to orders table
        const channel = supabase.channel('admin-analytics-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setOrders(prev => [payload.new, ...prev]);
                    toast.success('📊 تحديث جديد: تم إضافة طلب في لوحة الإحصائيات');
                } else if (payload.eventType === 'UPDATE') {
                    setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new : o));
                } else if (payload.eventType === 'DELETE') {
                    setOrders(prev => prev.filter(o => o.id === payload.old.id));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Filter orders based on timeframe and selected branch
    const { filteredOrders, previousPeriodOrders, dateRangeLabel } = useMemo(() => {
        if (!orders.length) return { filteredOrders: [], previousPeriodOrders: [], dateRangeLabel: '' };

        const now = new Date();
        let start = new Date();
        let end = new Date();
        let prevStart = new Date();
        let prevEnd = new Date();
        let label = '';

        switch (timeframe) {
            case 'today': {
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                prevStart.setDate(start.getDate() - 1);
                prevStart.setHours(0, 0, 0, 0);
                prevEnd.setDate(end.getDate() - 1);
                prevEnd.setHours(23, 59, 59, 999);
                label = 'اليوم';
                break;
            }
            case 'yesterday': {
                start.setDate(now.getDate() - 1);
                start.setHours(0, 0, 0, 0);
                end.setDate(now.getDate() - 1);
                end.setHours(23, 59, 59, 999);
                prevStart.setDate(start.getDate() - 1);
                prevStart.setHours(0, 0, 0, 0);
                prevEnd.setDate(end.getDate() - 1);
                prevEnd.setHours(23, 59, 59, 999);
                label = 'أمس';
                break;
            }
            case '7days': {
                start.setDate(now.getDate() - 7);
                start.setHours(0, 0, 0, 0);
                prevStart.setDate(start.getDate() - 7);
                prevEnd.setDate(start.getDate() - 1);
                label = 'آخر 7 أيام';
                break;
            }
            case '30days': {
                start.setDate(now.getDate() - 30);
                start.setHours(0, 0, 0, 0);
                prevStart.setDate(start.getDate() - 30);
                prevEnd.setDate(start.getDate() - 1);
                label = 'آخر 30 يوم';
                break;
            }
            case 'thisMonth': {
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
                label = 'هذا الشهر';
                break;
            }
            case 'lastMonth': {
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
                prevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59);
                label = 'الشهر الماضي';
                break;
            }
            case 'thisYear': {
                start = new Date(now.getFullYear(), 0, 1);
                prevStart = new Date(now.getFullYear() - 1, 0, 1);
                prevEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
                label = 'السنة الحالية';
                break;
            }
            case 'custom': {
                if (customStartDate) start = new Date(customStartDate);
                if (customEndDate) {
                    end = new Date(customEndDate);
                    end.setHours(23, 59, 59, 999);
                }
                label = `تاريخ مخصص (${customStartDate || 'الكل'} إلى ${customEndDate || 'الآن'})`;
                break;
            }
        }

        const filterFn = (order: any, sDate: Date, eDate: Date) => {
            const orderDate = new Date(order.created_at);
            const matchesTime = orderDate >= sDate && orderDate <= eDate;
            const matchesBranch = selectedBranch === 'all' || order.branch === selectedBranch;
            return matchesTime && matchesBranch;
        };

        const currentFiltered = orders.filter(o => filterFn(o, start, end));
        const prevFiltered = orders.filter(o => filterFn(o, prevStart, prevEnd));

        return {
            filteredOrders: currentFiltered,
            previousPeriodOrders: prevFiltered,
            dateRangeLabel: label
        };
    }, [orders, timeframe, selectedBranch, customStartDate, customEndDate]);

    // Computed Stats
    const metrics = useMemo(() => {
        const validOrders = filteredOrders.filter(o => o.status !== 'cancelled');
        const prevValidOrders = previousPeriodOrders.filter(o => o.status !== 'cancelled');

        const totalSales = validOrders.reduce((acc, o) => acc + (Number(o.total_price) || 0), 0);
        const prevTotalSales = prevValidOrders.reduce((acc, o) => acc + (Number(o.total_price) || 0), 0);

        const totalOrdersCount = filteredOrders.length;
        const prevTotalOrdersCount = previousPeriodOrders.length;

        const salesGrowth = prevTotalSales > 0 
            ? (((totalSales - prevTotalSales) / prevTotalSales) * 100) 
            : (totalSales > 0 ? 100 : 0);

        const ordersGrowth = prevTotalOrdersCount > 0 
            ? (((totalOrdersCount - prevTotalOrdersCount) / prevTotalOrdersCount) * 100) 
            : (totalOrdersCount > 0 ? 100 : 0);

        const uniqueCustomers = new Set(filteredOrders.map(o => o.phone?.trim()).filter(Boolean)).size;
        const averageOrderValue = validOrders.length > 0 ? (totalSales / validOrders.length) : 0;

        // Today / Week / Month Orders breakdown regardless of main filter for header counters
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);

        const monthStart = new Date();
        monthStart.setDate(monthStart.getDate() - 30);

        const branchFilterMatch = (o: any) => selectedBranch === 'all' || o.branch === selectedBranch;

        const ordersToday = orders.filter(o => new Date(o.created_at) >= todayStart && branchFilterMatch(o)).length;
        const ordersThisWeek = orders.filter(o => new Date(o.created_at) >= weekStart && branchFilterMatch(o)).length;
        const ordersThisMonth = orders.filter(o => new Date(o.created_at) >= monthStart && branchFilterMatch(o)).length;

        // Completed vs Cancelled
        const completedCount = filteredOrders.filter(o => o.status === 'completed' || o.status === 'ready').length;
        const cancelledCount = filteredOrders.filter(o => o.status === 'cancelled').length;
        const completedRatio = totalOrdersCount > 0 ? (completedCount / totalOrdersCount) * 100 : 0;
        const cancelledRatio = totalOrdersCount > 0 ? (cancelledCount / totalOrdersCount) * 100 : 0;

        // Branch Breakdown Calculation
        const branchMap: Record<string, { orders: number; sales: number; customers: Set<string> }> = {};
        
        filteredOrders.forEach(o => {
            const bName = o.branch || 'غير محدد';
            if (!branchMap[bName]) {
                branchMap[bName] = { orders: 0, sales: 0, customers: new Set() };
            }
            branchMap[bName].orders += 1;
            if (o.status !== 'cancelled') {
                branchMap[bName].sales += Number(o.total_price) || 0;
            }
            if (o.phone) {
                branchMap[bName].customers.add(o.phone.trim());
            }
        });

        const branchStatsList = Object.entries(branchMap).map(([name, data]) => ({
            name,
            ordersCount: data.orders,
            salesTotal: data.sales,
            avgOrderValue: data.orders > 0 ? (data.sales / data.orders) : 0,
            customerCount: data.customers.size,
            contributionPct: totalSales > 0 ? (data.sales / totalSales) * 100 : 0
        })).sort((a, b) => b.salesTotal - a.salesTotal);

        const topSellingBranch = branchStatsList.length > 0 ? branchStatsList[0] : { name: 'لا يوجد', salesTotal: 0 };

        return {
            totalSales,
            salesGrowth,
            totalOrdersCount,
            ordersGrowth,
            uniqueCustomers,
            averageOrderValue,
            ordersToday,
            ordersThisWeek,
            ordersThisMonth,
            completedRatio,
            cancelledRatio,
            branchStatsList,
            topSellingBranch
        };
    }, [filteredOrders, previousPeriodOrders, orders, selectedBranch]);

    // Product analytics calculation
    const { topProducts, leastProducts } = useMemo(() => {
        const productSalesMap: Record<string, { name: string; count: number; totalRevenue: number }> = {};

        filteredOrders.forEach(order => {
            if (order.status === 'cancelled') return;
            if (Array.isArray(order.items)) {
                order.items.forEach((item: any) => {
                    const itemName = item.name || 'منتج غير معرف';
                    const qty = Number(item.quantity) || 1;
                    const price = Number(item.totalPrice || item.price) || 0;

                    if (!productSalesMap[itemName]) {
                        productSalesMap[itemName] = { name: itemName, count: 0, totalRevenue: 0 };
                    }
                    productSalesMap[itemName].count += qty;
                    productSalesMap[itemName].totalRevenue += price;
                });
            }
        });

        const sortedProducts = Object.values(productSalesMap).sort((a, b) => b.count - a.count);
        return {
            topProducts: sortedProducts.slice(0, 10),
            leastProducts: sortedProducts.length > 5 ? sortedProducts.slice(-5).reverse() : []
        };
    }, [filteredOrders]);

    // Daily Sales Line/Area Chart Data
    const chartDailySales = useMemo(() => {
        const dayMap: Record<string, { dateStr: string; sales: number; orders: number }> = {};

        filteredOrders.forEach(o => {
            const dateObj = new Date(o.created_at);
            const key = dateObj.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
            if (!dayMap[key]) {
                dayMap[key] = { dateStr: key, sales: 0, orders: 0 };
            }
            dayMap[key].orders += 1;
            if (o.status !== 'cancelled') {
                dayMap[key].sales += Number(o.total_price) || 0;
            }
        });

        const entries = Object.values(dayMap);
        // If empty, generate fallback dummy structure for visualization smooth rendering
        if (entries.length === 0) {
            return [
                { dateStr: 'اليوم', sales: 0, orders: 0 }
            ];
        }
        return entries;
    }, [filteredOrders]);

    // Peak Hours Chart Data (0 to 23 hours)
    const peakHoursData = useMemo(() => {
        const hoursArray = Array.from({ length: 24 }, (_, i) => ({
            hourLabel: `${i}:00`,
            ordersCount: 0
        }));

        filteredOrders.forEach(o => {
            const h = new Date(o.created_at).getHours();
            if (hoursArray[h]) {
                hoursArray[h].ordersCount += 1;
            }
        });

        return hoursArray;
    }, [filteredOrders]);

    // Last Customers Data
    const latestCustomers = useMemo(() => {
        const customerMap: Record<string, { phone: string; name: string; lastOrderDate: string; totalSpent: number; ordersCount: number }> = {};

        filteredOrders.forEach(o => {
            const phone = o.phone?.trim();
            if (!phone) return;
            if (!customerMap[phone]) {
                customerMap[phone] = {
                    phone,
                    name: o.customer_name || 'عميل',
                    lastOrderDate: o.created_at,
                    totalSpent: 0,
                    ordersCount: 0
                };
            }
            customerMap[phone].ordersCount += 1;
            if (o.status !== 'cancelled') {
                customerMap[phone].totalSpent += Number(o.total_price) || 0;
            }
        });

        return Object.values(customerMap).slice(0, 10);
    }, [filteredOrders]);

    // Export Functions
    const exportToExcel = () => {
        try {
            const overviewSheet = [
                { 'المؤشر': 'إجمالي المبيعات (ر.س)', 'القيمة': metrics.totalSales.toFixed(2) },
                { 'المؤشر': 'إجمالي الطلبات', 'القيمة': metrics.totalOrdersCount },
                { 'المؤشر': 'عدد العملاء الفريدين', 'القيمة': metrics.uniqueCustomers },
                { 'المؤشر': 'متوسط قيمة الطلب (ر.س)', 'القيمة': metrics.averageOrderValue.toFixed(2) },
                { 'المؤشر': 'نسبة الإنجاز (%)', 'القيمة': `${metrics.completedRatio.toFixed(1)}%` },
                { 'المؤشر': 'نسبة الإلغاء (%)', 'القيمة': `${metrics.cancelledRatio.toFixed(1)}%` },
                { 'المؤشر': 'أكثر فرع مبيعاً', 'القيمة': metrics.topSellingBranch.name }
            ];

            const ordersSheet = filteredOrders.map(o => ({
                'رقم الطلب': o.id?.substring(0, 8),
                'اسم العميل': o.customer_name,
                'رقم الهاتف': o.phone,
                'الفرع': o.branch,
                'نوع الطلب': o.order_type === 'delivery' ? 'توصيل' : 'استلام',
                'إجمالي المبلغ (ر.س)': o.total_price,
                'الحالة': o.status,
                'التاريخ والوقت': new Date(o.created_at).toLocaleString('ar-SA')
            }));

            const branchesSheet = metrics.branchStatsList.map(b => ({
                'اسم الفرع': b.name,
                'عدد الطلبات': b.ordersCount,
                'إجمالي المبيعات (ر.س)': b.salesTotal.toFixed(2),
                'متوسط قيمة الطلب (ر.س)': b.avgOrderValue.toFixed(2),
                'عدد العملاء': b.customerCount,
                'نسبة المساهمة (%)': `${b.contributionPct.toFixed(1)}%`
            }));

            const productsSheet = topProducts.map((p, idx) => ({
                'الترتيب': idx + 1,
                'اسم المنتج': p.name,
                'الكمية المبيعة': p.count,
                'إجمالي الإيراد (ر.س)': p.totalRevenue.toFixed(2)
            }));

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(overviewSheet), 'الملخص العام');
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(branchesSheet), 'أداء الفروع');
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(productsSheet), 'المنتجات الأكثر طلباً');
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ordersSheet), 'سجل الطلبات');

            XLSX.writeFile(wb, `تقرير_إحصائيات_جمرة_الرافدين_${dateRangeLabel.replace(/\s+/g, '_')}.xlsx`);
            toast.success('تم تصدير تقرير Excel بنجاح 📊');
        } catch (err) {
            console.error('Excel Export Error:', err);
            toast.error('حدث خطأ أثناء تصدير Excel');
        }
    };

    const exportToCSV = () => {
        try {
            let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
            csvContent += "رقم الطلب,اسم العميل,الهاتف,الفرع,المبلغ,الحالة,التاريخ\n";

            filteredOrders.forEach(o => {
                const row = [
                    `"${o.id?.substring(0, 8)}"`,
                    `"${o.customer_name || ''}"`,
                    `"${o.phone || ''}"`,
                    `"${o.branch || ''}"`,
                    `"${o.total_price || 0}"`,
                    `"${o.status || ''}"`,
                    `"${new Date(o.created_at).toLocaleString('ar-SA')}"`
                ].join(",");
                csvContent += row + "\n";
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `إحصائيات_الطلبات_${dateRangeLabel}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('تم تصدير ملف CSV بنجاح 📄');
        } catch (err) {
            toast.error('فشل تصدير CSV');
        }
    };

    const handlePrintReport = () => {
        window.print();
    };

    const maxSalesInChart = Math.max(...chartDailySales.map(d => d.sales), 100);
    const maxOrdersInPeak = Math.max(...peakHoursData.map(h => h.ordersCount), 10);

    return (
        <div className="space-y-8 text-right select-none pb-12" dir="rtl">
            {/* CSS Print Styles */}
            <style>{`
                @media print {
                    body { background: white !important; color: black !important; }
                    .no-print, header, nav, button { display: none !important; }
                    .print-only { display: block !important; }
                    .bg-zinc-900, .bg-zinc-800 { background: #f8fafc !important; color: #0f172a !important; border: 1px solid #cbd5e1 !important; }
                    .text-white { color: #020617 !important; }
                    .text-gray-400, .text-gray-500 { color: #475569 !important; }
                }
            `}</style>

            {/* Header Controls & Filter Bar */}
            <div className="bg-zinc-900/90 backdrop-blur-md border border-white/10 p-5 rounded-3xl space-y-4 shadow-xl no-print">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                            <h2 className="text-xl font-black text-white flex items-center gap-2">
                                لوحة التحليلات والإحصائيات
                                <span className="text-xs font-normal text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                    تحديث لحظي Real-time
                                </span>
                            </h2>
                        </div>
                        <p className="text-xs text-gray-400">نظرة شاملة ومباشرة على المبيعات، الطلبات، وأداء الفروع والعملاء</p>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={fetchData}
                            className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-gray-300 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold border border-white/5 cursor-pointer"
                            title="تحديث البيانات"
                        >
                            <RefreshCw size={14} className={cn(loading && "animate-spin text-primary")} />
                            <span>تحديث</span>
                        </button>
                        <button
                            onClick={exportToExcel}
                            className="px-3.5 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        >
                            <FileSpreadsheet size={15} />
                            <span>تصدير Excel</span>
                        </button>
                        <button
                            onClick={exportToCSV}
                            className="px-3.5 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        >
                            <Download size={15} />
                            <span>CSV</span>
                        </button>
                        <button
                            onClick={handlePrintReport}
                            className="px-3.5 py-2.5 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        >
                            <Printer size={15} />
                            <span>طباعة التقرير</span>
                        </button>
                    </div>
                </div>

                {/* Time & Branch Selectors */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                            <Calendar size={14} /> النطاق الزمني:
                        </span>
                        <div className="flex bg-zinc-800/80 p-1 rounded-2xl border border-white/5 flex-wrap gap-1">
                            {[
                                { id: 'today', label: 'اليوم' },
                                { id: 'yesterday', label: 'أمس' },
                                { id: '7days', label: 'آخر 7 أيام' },
                                { id: '30days', label: 'آخر 30 يوم' },
                                { id: 'thisMonth', label: 'هذا الشهر' },
                                { id: 'lastMonth', label: 'الشهر الماضي' },
                                { id: 'thisYear', label: 'السنة الحالية' },
                                { id: 'custom', label: 'تاريخ مخصص' }
                            ].map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setTimeframe(t.id as TimeframeOption)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                                        timeframe === t.id 
                                            ? "bg-primary text-white shadow-md shadow-primary/20" 
                                            : "text-gray-400 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Branch Filter Selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                            <Store size={14} /> الفرع:
                        </span>
                        <select
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            className="bg-zinc-800 text-white text-xs font-bold px-3 py-2 rounded-xl border border-white/10 outline-none focus:ring-2 focus:ring-primary transition-all cursor-pointer"
                        >
                            <option value="all">جميع الفروع</option>
                            {branchesList.map(b => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Custom Date Pickers */}
                {timeframe === 'custom' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="flex items-center gap-3 pt-2 border-t border-white/5">
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-gray-400">من:</span>
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="bg-zinc-800 text-white rounded-lg px-3 py-1.5 border border-white/10 text-xs outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-gray-400">إلى:</span>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="bg-zinc-800 text-white rounded-lg px-3 py-1.5 border border-white/10 text-xs outline-none"
                            />
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Print Header */}
            <div className="hidden print-only text-center space-y-2 mb-6">
                <h1 className="text-2xl font-bold">تقرير إحصائيات وأداء النظام - مطعم جمرة الرافدين</h1>
                <p className="text-sm text-gray-600">الفترة: {dateRangeLabel} | الفرع: {selectedBranch === 'all' ? 'جميع الفروع' : selectedBranch}</p>
                <p className="text-xs text-gray-500">تاريخ إصدار التقرير: {new Date().toLocaleString('ar-SA')}</p>
            </div>

            {/* Top KPI Stat Cards Header */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total Sales */}
                <motion.div 
                    whileHover={{ y: -3 }}
                    className="bg-zinc-900 border border-white/10 p-5 rounded-3xl relative overflow-hidden group shadow-lg"
                >
                    <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-400">إجمالي المبيعات</p>
                        <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <div className="mt-3">
                        <h3 className="text-2xl font-black text-white tracking-tight">{metrics.totalSales.toFixed(2)} <span className="text-xs font-normal text-gray-400">ر.س</span></h3>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                        <span className={cn(
                            "flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-[11px]",
                            metrics.salesGrowth >= 0 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                        )}>
                            {metrics.salesGrowth >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                            {Math.abs(metrics.salesGrowth).toFixed(1)}%
                        </span>
                        <span className="text-gray-500 text-[10px]">مقارنة بالفترة السابقة</span>
                    </div>
                </motion.div>

                {/* 2. Total Orders */}
                <motion.div 
                    whileHover={{ y: -3 }}
                    className="bg-zinc-900 border border-white/10 p-5 rounded-3xl relative overflow-hidden group shadow-lg"
                >
                    <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500" />
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-400">إجمالي الطلبات</p>
                        <div className="w-10 h-10 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                            <ShoppingBag size={20} />
                        </div>
                    </div>
                    <div className="mt-3">
                        <h3 className="text-2xl font-black text-white tracking-tight">{metrics.totalOrdersCount} <span className="text-xs font-normal text-gray-400">طلب</span></h3>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                        <span className={cn(
                            "flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-[11px]",
                            metrics.ordersGrowth >= 0 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                        )}>
                            {metrics.ordersGrowth >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                            {Math.abs(metrics.ordersGrowth).toFixed(1)}%
                        </span>
                        <span className="text-gray-500 text-[10px]">معدل نمو الطلبات</span>
                    </div>
                </motion.div>

                {/* 3. Unique Customers */}
                <motion.div 
                    whileHover={{ y: -3 }}
                    className="bg-zinc-900 border border-white/10 p-5 rounded-3xl relative overflow-hidden group shadow-lg"
                >
                    <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500" />
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-400">عدد العملاء</p>
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                            <Users size={20} />
                        </div>
                    </div>
                    <div className="mt-3">
                        <h3 className="text-2xl font-black text-white tracking-tight">{metrics.uniqueCustomers} <span className="text-xs font-normal text-gray-400">عميل فريد</span></h3>
                    </div>
                    <div className="mt-3 text-xs text-gray-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>مبني على أرقام الهاتف المسجلة</span>
                    </div>
                </motion.div>

                {/* 4. Average Order Value */}
                <motion.div 
                    whileHover={{ y: -3 }}
                    className="bg-zinc-900 border border-white/10 p-5 rounded-3xl relative overflow-hidden group shadow-lg"
                >
                    <div className="absolute top-0 left-0 w-2 h-full bg-amber-500" />
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-400">متوسط قيمة الطلب (AOV)</p>
                        <div className="w-10 h-10 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                    <div className="mt-3">
                        <h3 className="text-2xl font-black text-white tracking-tight">{metrics.averageOrderValue.toFixed(2)} <span className="text-xs font-normal text-gray-400">ر.س</span></h3>
                    </div>
                    <div className="mt-3 text-xs text-gray-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span>معدل قيمة السلة الواحدة</span>
                    </div>
                </motion.div>
            </div>

            {/* Additional Secondary KPI Cards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-zinc-900/60 border border-white/5 p-4 rounded-2xl text-center space-y-1">
                    <p className="text-[11px] font-bold text-gray-400">طلبات اليوم</p>
                    <h4 className="text-lg font-black text-white">{metrics.ordersToday}</h4>
                </div>
                <div className="bg-zinc-900/60 border border-white/5 p-4 rounded-2xl text-center space-y-1">
                    <p className="text-[11px] font-bold text-gray-400">طلبات هذا الأسبوع</p>
                    <h4 className="text-lg font-black text-white">{metrics.ordersThisWeek}</h4>
                </div>
                <div className="bg-zinc-900/60 border border-white/5 p-4 rounded-2xl text-center space-y-1">
                    <p className="text-[11px] font-bold text-gray-400">طلبات هذا الشهر</p>
                    <h4 className="text-lg font-black text-white">{metrics.ordersThisMonth}</h4>
                </div>
                <div className="bg-zinc-900/60 border border-white/5 p-4 rounded-2xl text-center space-y-1">
                    <p className="text-[11px] font-bold text-gray-400">أكثر فرع مبيعاً</p>
                    <h4 className="text-sm font-black text-primary truncate" title={metrics.topSellingBranch.name}>
                        {metrics.topSellingBranch.name} ({metrics.topSellingBranch.salesTotal.toFixed(0)} ر.س)
                    </h4>
                </div>
            </div>

            {/* Branch Performance & Breakdown Section */}
            <div className="bg-zinc-900 border border-white/10 p-6 rounded-3xl space-y-6 shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-white/5 pb-4">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Store className="text-primary" size={20} />
                            تحليل أداء الفروع وترتيب المبيعات
                        </h3>
                        <p className="text-xs text-gray-400">ترتيب الفروع حسب الإيرادات والنسبة المئوية من إجمالي مبيعات المطعم</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Branch Progress Bars list */}
                    <div className="space-y-4">
                        {metrics.branchStatsList.map((branch, idx) => (
                            <div key={branch.name} className="bg-zinc-800/50 border border-white/5 p-4 rounded-2xl space-y-3">
                                <div className="flex items-center justify-between text-xs font-bold">
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black",
                                            idx === 0 ? "bg-amber-500 text-black" : idx === 1 ? "bg-gray-300 text-black" : "bg-zinc-700 text-white"
                                        )}>
                                            #{idx + 1}
                                        </span>
                                        <span className="text-white text-sm">{branch.name}</span>
                                    </div>
                                    <span className="text-primary font-mono text-sm">{branch.salesTotal.toFixed(2)} ر.س</span>
                                </div>

                                {/* Custom Animated Progress Bar */}
                                <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden relative">
                                    <motion.div 
                                        initial={{ width: 0 }} 
                                        animate={{ width: `${branch.contributionPct}%` }}
                                        transition={{ duration: 1, ease: 'easeOut' }}
                                        className={cn(
                                            "h-full rounded-full",
                                            idx === 0 ? "bg-gradient-to-l from-primary to-orange-500" : "bg-gradient-to-l from-indigo-500 to-purple-500"
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-gray-400 pt-1 border-t border-white/5">
                                    <div>الطلبات: <span className="text-white font-bold">{branch.ordersCount}</span></div>
                                    <div>العملاء: <span className="text-white font-bold">{branch.customerCount}</span></div>
                                    <div>المساهمة: <span className="text-emerald-400 font-bold">{branch.contributionPct.toFixed(1)}%</span></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Detailed Branch Comparison Table */}
                    <div className="bg-zinc-950/60 rounded-2xl border border-white/5 overflow-x-auto">
                        <table className="w-full text-xs text-right">
                            <thead className="bg-zinc-800/80 text-gray-400 border-b border-white/5">
                                <tr>
                                    <th className="p-3 font-bold">الفرع</th>
                                    <th className="p-3 font-bold">الطلبات</th>
                                    <th className="p-3 font-bold">المبيعات</th>
                                    <th className="p-3 font-bold">متوسط الطلب</th>
                                    <th className="p-3 font-bold">نسبة المساهمة</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {metrics.branchStatsList.map(b => (
                                    <tr key={b.name} className="hover:bg-white/[0.02]">
                                        <td className="p-3 font-bold text-white">{b.name}</td>
                                        <td className="p-3">{b.ordersCount}</td>
                                        <td className="p-3 font-bold text-emerald-400">{b.salesTotal.toFixed(2)} ر.س</td>
                                        <td className="p-3 text-amber-400">{b.avgOrderValue.toFixed(2)} ر.س</td>
                                        <td className="p-3">
                                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                                                {b.contributionPct.toFixed(1)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Interactive Custom SVG Charts Section */}
            <div className="bg-zinc-900 border border-white/10 p-6 rounded-3xl space-y-6 shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-4">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <BarChart3 className="text-indigo-400" size={20} />
                            الرسوم البيانية والتحليل التفاعلي
                        </h3>
                        <p className="text-xs text-gray-400">مخططات تفاعلية لحركة المبيعات وساعات الذروة والمنتجات الأكثر مبيعاً</p>
                    </div>

                    <div className="flex bg-zinc-800 p-1 rounded-2xl gap-1 no-print">
                        {[
                            { id: 'sales', label: 'المبيعات حسب الأيام', icon: <TrendingUp size={14} /> },
                            { id: 'hours', label: 'ساعات الذروة', icon: <Clock size={14} /> },
                            { id: 'products', label: 'أكثر المنتجات طلباً', icon: <Package size={14} /> }
                        ].map(chart => (
                            <button
                                key={chart.id}
                                onClick={() => setActiveChartTab(chart.id as any)}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                                    activeChartTab === chart.id 
                                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" 
                                        : "text-gray-400 hover:text-white"
                                )}
                            >
                                {chart.icon}
                                {chart.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chart Content Display */}
                {activeChartTab === 'sales' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-xs text-gray-400">
                            <span>حجم المبيعات اليومية (ر.س)</span>
                            <span className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-primary" /> مبيعات اليوم
                            </span>
                        </div>

                        {/* Interactive SVG Area/Bar Chart */}
                        <div className="h-64 w-full bg-zinc-950/60 rounded-2xl p-4 border border-white/5 flex items-end justify-between gap-2 overflow-x-auto">
                            {chartDailySales.map((item, idx) => {
                                const heightPct = maxSalesInChart > 0 ? (item.sales / maxSalesInChart) * 100 : 0;
                                return (
                                    <div key={idx} className="flex-1 min-w-[36px] flex flex-col items-center gap-2 h-full justify-end group">
                                        <div className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold bg-zinc-800 px-1.5 py-0.5 rounded whitespace-nowrap">
                                            {item.sales.toFixed(0)} ر.س
                                        </div>
                                        <div className="w-full bg-zinc-800/60 rounded-t-xl h-full flex items-end overflow-hidden">
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: `${Math.max(heightPct, 4)}%` }}
                                                transition={{ duration: 0.5, delay: idx * 0.02 }}
                                                className="w-full bg-gradient-to-t from-primary/40 to-primary group-hover:brightness-125 rounded-t-xl transition-all"
                                            />
                                        </div>
                                        <span className="text-[9px] text-gray-400 font-mono truncate w-full text-center">{item.dateStr}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {activeChartTab === 'hours' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-xs text-gray-400">
                            <span>توزيع الطلبات حسب ساعات اليوم (00:00 - 23:00)</span>
                            <span className="text-amber-400 font-bold">ساعات الذروة باللون البرتقالي</span>
                        </div>

                        <div className="h-64 w-full bg-zinc-950/60 rounded-2xl p-4 border border-white/5 flex items-end justify-between gap-1 overflow-x-auto">
                            {peakHoursData.map((h, idx) => {
                                const heightPct = maxOrdersInPeak > 0 ? (h.ordersCount / maxOrdersInPeak) * 100 : 0;
                                const isPeak = h.ordersCount === maxOrdersInPeak && h.ordersCount > 0;
                                return (
                                    <div key={idx} className="flex-1 min-w-[20px] flex flex-col items-center gap-1 h-full justify-end group">
                                        <div className="text-[9px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold bg-zinc-800 px-1 rounded">
                                            {h.ordersCount}
                                        </div>
                                        <div className="w-full bg-zinc-800/40 rounded-t h-full flex items-end overflow-hidden">
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: `${Math.max(heightPct, 2)}%` }}
                                                transition={{ duration: 0.4, delay: idx * 0.01 }}
                                                className={cn(
                                                    "w-full rounded-t transition-all",
                                                    isPeak ? "bg-amber-500 shadow-lg shadow-amber-500/50" : "bg-indigo-500/70 group-hover:bg-indigo-400"
                                                )}
                                            />
                                        </div>
                                        <span className="text-[8px] text-gray-400 font-mono rotate-45 sm:rotate-0">{h.hourLabel}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {activeChartTab === 'products' && (
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-gray-400">أعلى 10 منتجات من حيث كمية الطلب</h4>
                        <div className="space-y-3">
                            {topProducts.map((prod, idx) => {
                                const maxQty = topProducts[0]?.count || 1;
                                const pct = (prod.count / maxQty) * 100;
                                return (
                                    <div key={idx} className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-white flex items-center gap-2">
                                                <span className="w-5 h-5 rounded-full bg-zinc-800 text-gray-400 flex items-center justify-center text-[10px]">
                                                    {idx + 1}
                                                </span>
                                                {prod.name}
                                            </span>
                                            <span className="text-emerald-400 font-mono">
                                                {prod.count} طلب ({prod.totalRevenue.toFixed(0)} ر.س)
                                            </span>
                                        </div>
                                        <div className="h-2.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ duration: 0.6 }}
                                                className="h-full bg-gradient-to-l from-emerald-400 to-teal-500 rounded-full"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Detailed Analytics Tables Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Last 20 Orders */}
                <div className="bg-zinc-900 border border-white/10 p-5 rounded-3xl space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <Clock className="text-primary" size={16} />
                            آخر الطلبات المسجلة
                        </h3>
                        <span className="text-[10px] text-gray-500">أحدث 10 طلبات</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-right">
                            <thead className="text-gray-400 border-b border-white/5">
                                <tr>
                                    <th className="pb-2 font-bold">العميل</th>
                                    <th className="pb-2 font-bold">الفرع</th>
                                    <th className="pb-2 font-bold">المبلغ</th>
                                    <th className="pb-2 font-bold">الحالة</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredOrders.slice(0, 10).map(order => (
                                    <tr key={order.id} className="hover:bg-white/[0.02]">
                                        <td className="py-2.5">
                                            <span className="font-bold text-white block truncate max-w-[120px]">{order.customer_name}</span>
                                            <span className="text-[10px] text-gray-500 font-mono">{order.phone}</span>
                                        </td>
                                        <td className="py-2.5 text-gray-300">{order.branch}</td>
                                        <td className="py-2.5 font-bold text-primary">{order.total_price} ر.س</td>
                                        <td className="py-2.5">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-[9px] font-bold",
                                                order.status === 'completed' && "bg-emerald-500/10 text-emerald-400",
                                                order.status === 'preparing' && "bg-yellow-500/10 text-yellow-400",
                                                order.status === 'cancelled' && "bg-red-500/10 text-red-400",
                                                order.status === 'new' && "bg-blue-500/10 text-blue-400"
                                            )}>
                                                {order.status === 'completed' ? 'مكتمل' : order.status === 'preparing' ? 'تحضير' : order.status === 'cancelled' ? 'ملغي' : 'جديد'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Latest Customers & Health Indicators */}
                <div className="space-y-6">
                    {/* Health Ratios Card */}
                    <div className="bg-zinc-900 border border-white/10 p-5 rounded-3xl space-y-4 shadow-xl">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
                            <Layers className="text-indigo-400" size={16} />
                            مؤشرات صحة العمليات والمبيعات
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-zinc-800/50 p-4 rounded-2xl border border-white/5 space-y-1">
                                <span className="text-[11px] text-gray-400 block">نسبة الطلبات المكتملة</span>
                                <h4 className="text-xl font-black text-emerald-400">{metrics.completedRatio.toFixed(1)}%</h4>
                                <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                                    <div style={{ width: `${metrics.completedRatio}%` }} className="h-full bg-emerald-400" />
                                </div>
                            </div>

                            <div className="bg-zinc-800/50 p-4 rounded-2xl border border-white/5 space-y-1">
                                <span className="text-[11px] text-gray-400 block">نسبة الطلبات الملغاة</span>
                                <h4 className="text-xl font-black text-red-400">{metrics.cancelledRatio.toFixed(1)}%</h4>
                                <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                                    <div style={{ width: `${metrics.cancelledRatio}%` }} className="h-full bg-red-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Latest New Customers */}
                    <div className="bg-zinc-900 border border-white/10 p-5 rounded-3xl space-y-4 shadow-xl">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
                            <Users className="text-emerald-400" size={16} />
                            آخر العملاء النشطين
                        </h3>

                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-right">
                                <thead className="text-gray-400 border-b border-white/5">
                                    <tr>
                                        <th className="pb-2 font-bold">اسم العميل</th>
                                        <th className="pb-2 font-bold">الهاتف</th>
                                        <th className="pb-2 font-bold">عدد الطلبات</th>
                                        <th className="pb-2 font-bold">إجمالي الانفاق</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {latestCustomers.slice(0, 5).map((cust, i) => (
                                        <tr key={i} className="hover:bg-white/[0.02]">
                                            <td className="py-2 font-bold text-white">{cust.name}</td>
                                            <td className="py-2 text-gray-400 font-mono">{cust.phone}</td>
                                            <td className="py-2 text-indigo-400 font-bold">{cust.ordersCount}</td>
                                            <td className="py-2 text-emerald-400 font-bold">{cust.totalSpent.toFixed(2)} ر.س</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
