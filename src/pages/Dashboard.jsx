import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../utils/date';
import { supabase } from '../supabaseClient';
import { useSettings } from '../context/SettingsContext';
import { Car, CalendarDays, DollarSign, Activity, TrendingUp, Users, Plus } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { FleetCalendar, UpcomingReturns, MaintenanceAlerts, TodaysSchedule } from '../components/dashboard/OperationalWidgets';

const Dashboard = () => {
    const navigate = useNavigate();
    const { formatCurrency } = useSettings();
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

        // Real-time subscription
        const subscription = supabase
            .channel('dashboard-rentals')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'rentals' },
                () => {
                    fetchDashboardData(selectedDate); // Re-fetch on any change
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [selectedDate]);

    const fetchDashboardData = async (dateStr) => {
        try {
            setLoading(true);

            const targetStart = new Date(dateStr);
            targetStart.setHours(0, 0, 0, 0);

            const targetEnd = new Date(dateStr);
            targetEnd.setHours(23, 59, 59, 999);

            // 1. Total Cars
            const { count: carsCount, error: carsError } = await supabase
                .from('cars')
                .select('*', { count: 'exact', head: true });

            if (carsError) throw carsError;

            // 1b. Total Customers
            const { count: customersCount, error: customersError } = await supabase
                .from('customers')
                .select('*', { count: 'exact', head: true });

            if (customersError) throw customersError;

            // 1c. Available Cars
            const { count: availableCarsCount } = await supabase
                .from('cars')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'available');

            // 2. Fetch Rentals for Stats (limited to last 500 for performance)
            const { data: allRentals, error: rentalsError } = await supabase
                .from('rentals')
                .select(`
                    id,
                    total_amount,
                    start_date,
                    end_date,
                    status,
                    customer_name,
                    created_at,
                    cars ( daily_rate, make, model )
                `)
                .neq('status', 'cancelled')
                .order('created_at', { ascending: false })
                .limit(500);

            if (rentalsError) throw rentalsError;

            // 3. Status Calculation & Chart Data Aggregation
            let activeCount = 0;
            let dayRevenue = 0;

            // Last 7 days chart data
            const last7Days = [...Array(7)].map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                return {
                    date: d.toISOString().split('T')[0],
                    day: d.toLocaleDateString('en-US', { weekday: 'short' }),
                    amount: 0
                };
            });

            allRentals.forEach(rental => {
                const rentalStart = new Date(rental.start_date);
                const rentalEnd = new Date(rental.end_date);

                // Active Count Logic - count by status='active'
                if (rental.status === 'active') {
                    activeCount++;
                    const rate = Number(rental.cars?.daily_rate) || 0;
                    dayRevenue += rate; // Approximate daily revenue
                }

                // Chart Data Logic (Revenue by Start Date)
                const rentalDateStr = rental.start_date; // Assuming revenue booked on start date
                const dayStat = last7Days.find(d => d.date === rentalDateStr);
                if (dayStat) {
                    dayStat.amount += Number(rental.total_amount) || 0;
                }
            });

            // Normalize chart heights for visualization
            const maxAmount = Math.max(...last7Days.map(d => d.amount), 1); // Avoid division by zero
            const finalizedChartData = last7Days.map(d => ({
                ...d,
                height: (d.amount / maxAmount) * 100
            }));

            // 4. Recent Activity
            const { data: recent, error: recentError } = await supabase
                .from('rentals')
                .select(`
                    *,
                    cars (make, model, license_plate)
                `)
                .order('created_at', { ascending: false })
                .limit(5);

            if (recentError) throw recentError;

            // Calculate monthly revenue
            const now = new Date();
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

            let monthlyRevenue = 0;
            let lastMonthRevenue = 0;

            allRentals.forEach(rental => {
                const rentalDate = new Date(rental.start_date);
                const amount = Number(rental.total_amount) || 0;

                if (rentalDate >= thisMonthStart) {
                    monthlyRevenue += amount;
                } else if (rentalDate >= lastMonthStart && rentalDate <= lastMonthEnd) {
                    lastMonthRevenue += amount;
                }
            });

            setStats({
                totalCars: carsCount || 0,
                availableCars: availableCarsCount || 0,
                activeRentals: activeCount,
                dailyRevenue: dayRevenue,
                totalCustomers: customersCount || 0,
                monthlyRevenue,
                lastMonthRevenue
            });
            setRecentRentals(recent || []);
            setChartData(finalizedChartData);

        } catch (error) {
            console.error('Error fetching dashboard data:', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Overview</h1>
                    <p className="text-muted-foreground mt-1">Welcome back, here's what's happening today.</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Quick Actions */}
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            onClick={() => navigate('/rentals')}
                            className="gap-2"
                        >
                            <Plus size={16} />
                            Add Booking
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/cars')}
                            className="gap-2"
                        >
                            <Car size={16} />
                            Add Vehicle
                        </Button>
                    </div>

                    {/* Date Filter */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-input bg-background shadow-sm">
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

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    subtext={new Date(selectedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
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

                {/* Today's Schedule */}
                <TodaysSchedule selectedDate={selectedDate} />

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
                                            {rental.cars?.make} {rental.cars?.model}
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
