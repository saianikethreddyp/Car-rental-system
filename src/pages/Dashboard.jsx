import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../utils/date';

import { useSettings } from '../context/SettingsContext';
import { Car, CalendarDays, DollarSign, Activity, TrendingUp, Users, Plus } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { dashboardApi } from '../api/client';
import { FleetCalendar, UpcomingReturns, MaintenanceAlerts } from '../components/dashboard/OperationalWidgets';

const Dashboard = () => {
    const navigate = useNavigate();
    const settingsContext = useSettings();

    // Default formatter if context is missing
    const defaultFormatter = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(Number(amount) || 0);
    };

    const formatCurrency = settingsContext?.formatCurrency || defaultFormatter;

    // Default to today in YYYY-MM-DD format
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [stats, setStats] = useState({
        totalCars: 0,
        availableCars: 0,
        activeRentals: 0,
        totalRevenue: 0,
        dailyRevenue: 0,
        totalCustomers: 0,
        monthlyRevenue: 0,
        lastMonthRevenue: 0
    });
    const [recentRentals, setRecentRentals] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData(selectedDate);

        // Real-time subscription removed (Migrated from Supabase)
        // Real-time subscription removed (Migrated from Supabase)
    }, [selectedDate]);

    const fetchDashboardData = async (dateStr) => {
        try {
            setLoading(true);

            // Fetch Stats and Activity in parallel
            const [statsData, activityData] = await Promise.all([
                dashboardApi.getStats(dateStr),
                dashboardApi.getActivity()
            ]);

            setStats(statsData.stats);
            setChartData(statsData.chartData);
            setRecentRentals(activityData);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">Overview</h1>
                    <p className="text-muted-foreground mt-1">Welcome back, here's what's happening today.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                    {/* Quick Actions */}
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            onClick={() => navigate('/rentals')}
                            className="flex-1 sm:flex-none gap-2"
                        >
                            <Plus size={16} />
                            <span className="hidden sm:inline">Add Booking</span>
                            <span className="sm:hidden">Booking</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/cars')}
                            className="flex-1 sm:flex-none gap-2"
                        >
                            <Car size={16} />
                            <span className="hidden sm:inline">Add Vehicle</span>
                            <span className="sm:hidden">Vehicle</span>
                        </Button>
                    </div>

                    {/* Date Filter */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-input bg-background shadow-sm">
                        <span className="text-muted-foreground text-sm">Date:</span>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent border-none text-foreground text-sm focus:outline-none focus:ring-0 cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            {/* Stats Grid - Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatsCard
                    title="Fleet Status"
                    value={`${stats.availableCars}/${stats.totalCars}`}
                    icon={Car}
                    subtext="Available / Total"
                />
                <StatsCard
                    title="Active Rentals"
                    value={stats.activeRentals}
                    icon={CalendarDays}
                    subtext={(() => {
                        const d = new Date(selectedDate);
                        const day = String(d.getDate()).padStart(2, '0');
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const year = d.getFullYear();
                        return `${day}/${month}/${year}`;
                    })()}
                />
                <StatsCard
                    title="Monthly Revenue"
                    value={formatCurrency(stats.monthlyRevenue)}
                    icon={DollarSign}
                    subtext={stats.lastMonthRevenue > 0
                        ? `${stats.monthlyRevenue >= stats.lastMonthRevenue ? '↑' : '↓'} ${Math.abs(Math.round(((stats.monthlyRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue) * 100))}% vs last month`
                        : 'This month'
                    }
                />
                <StatsCard
                    title="Total Customers"
                    value={stats.totalCustomers}
                    icon={Users}
                    subtext="All time"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Fleet Availability Calendar - spans full width on large screens */}
                <div className="lg:col-span-2">
                    <FleetCalendar selectedDate={selectedDate} />
                </div>

                {/* Upcoming Returns */}
                <UpcomingReturns selectedDate={selectedDate} />

                {/* Maintenance Alerts */}
                <MaintenanceAlerts />

                {/* Recent Activity Feed */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Activity size={20} className="text-primary" /> Recent Activity
                        </h2>
                    </div>

                    {loading ? (
                        <p className="text-muted-foreground text-center py-4">Loading...</p>
                    ) : recentRentals.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No activity recorded yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-[220px] overflow-y-auto">
                            {recentRentals.map(rental => (
                                <div key={rental.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors border border-transparent hover:border-sidebar-border">
                                    <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${rental.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-muted-foreground'}`}></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">
                                            {rental.customer_name}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                                            {rental.car_id?.make} {rental.car_id?.model}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <Badge variant={rental.status === 'active' ? 'success' : 'secondary'} className="text-[10px] px-1.5 py-0">
                                                {rental.status}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground">• {formatDate(rental.created_at)}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-semibold text-foreground">{formatCurrency(rental.total_amount)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

const StatsCard = ({ title, value, icon: IconComponent, trend, subtext }) => {
    const Icon = IconComponent;
    return (
        <Card className="relative overflow-hidden group p-6 hover:shadow-md transition-all">
            <div className="flex justify-between items-start z-10 relative">
                <div>
                    <p className="text-muted-foreground text-sm font-medium mb-1">{title}</p>
                    <h3 className="text-2xl font-bold text-foreground tracking-tight">{value}</h3>
                    {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
                    {trend && (
                        <div className="flex items-center gap-1 mt-2">
                            <TrendingUp size={12} className="text-primary" />
                            <span className="text-xs text-muted-foreground font-medium">{trend}</span>
                        </div>
                    )}
                </div>
                <div className="p-2 rounded-full bg-secondary text-primary transition-transform group-hover:scale-110">
                    <Icon size={20} />
                </div>
            </div>
        </Card>
    );
};

export default Dashboard;
