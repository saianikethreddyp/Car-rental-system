import React, { useState, useEffect } from 'react';
import { carsApi } from '../../api/client';
import { formatDate } from '../../utils/date';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import { Calendar, DollarSign, TrendingUp, Car as CarIcon, AlertCircle, Clock, Activity } from 'lucide-react';
import Button from '../ui/Button';

const CarDetailsModal = ({ isOpen, onClose, car, formatCurrency = (v) => `₹${v}` }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);

    // Default to current month/year
    const today = new Date();
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1); // 1-12
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());

    useEffect(() => {
        if (isOpen && car?.id) {
            fetchAnalytics();
        }
    }, [isOpen, car, selectedMonth, selectedYear]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const data = await carsApi.getAnalytics(car.id, selectedMonth, selectedYear);
            setStats(data);
        } catch (error) {
            console.error('Analytics Error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!car) return null;

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const years = [2024, 2025, 2026, 2027];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Vehicle Analytics"
            size="2xl"
        >
            <div className="space-y-6 max-h-[80vh] overflow-y-auto p-1">
                {/* Header Info */}
                <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg border border-border">
                    <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <CarIcon size={32} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-foreground">{car.make} {car.model}</h3>
                        <p className="text-muted-foreground font-mono text-sm">{car.license_plate}</p>
                        <div className="flex gap-2 mt-2">
                            <Badge variant={car.status === 'available' ? 'success' : car.status === 'rented' ? 'primary' : 'warning'}>
                                {car.status.toUpperCase()}
                            </Badge>
                        </div>
                    </div>
                    {/* Month Filter */}
                    <div className="flex gap-2">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className="bg-background border border-input rounded-md px-3 py-1.5 text-sm"
                        >
                            {months.map((m, i) => (
                                <option key={i} value={i + 1}>{m}</option>
                            ))}
                        </select>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="bg-background border border-input rounded-md px-3 py-1.5 text-sm"
                        >
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 text-center text-muted-foreground">Loading analytics...</div>
                ) : stats ? (
                    <>
                        {/* Key Metrics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-semibold">Trips</p>
                                        <p className="text-2xl font-bold text-foreground mt-1">{stats.stats.totalTrips}</p>
                                    </div>
                                    <TrendingUp size={18} className="text-blue-500" />
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">Bookings this month</p>
                            </div>

                            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-semibold">Revenue</p>
                                        <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(stats.stats.totalRevenue)}</p>
                                    </div>
                                    <DollarSign size={18} className="text-emerald-500" />
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">Earnings this month</p>
                            </div>

                            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-semibold">Utilization</p>
                                        <p className="text-2xl font-bold text-foreground mt-1">{stats.stats.utilizationRate}%</p>
                                    </div>
                                    <Activity size={18} className="text-amber-500" />
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">Occupancy Rate</p>
                            </div>
                        </div>

                        {/* Utilization Bar */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-medium">
                                <span className="flex items-center gap-2"><div className="w-3 h-3 bg-primary rounded-full"></div> Rented ({stats.stats.rentedDays} days)</span>
                                <span className="flex items-center gap-2 text-muted-foreground">Idle ({stats.stats.idleDays} days) <div className="w-3 h-3 bg-muted rounded-full"></div></span>
                            </div>
                            <div className="h-6 w-full bg-muted rounded-full overflow-hidden flex">
                                <div
                                    className="h-full bg-primary transition-all duration-500 shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                                    style={{ width: `${stats.stats.utilizationRate}% ` }}
                                ></div>
                            </div>
                            <p className="text-xs text-right text-muted-foreground">Total {stats.stats.totalDaysInMonth} days in {months[selectedMonth - 1]}</p>
                        </div>

                        {/* History Table */}
                        <div className="space-y-3 pt-4 border-t border-border">
                            <h4 className="font-semibold text-foreground">Trips History ({months[selectedMonth - 1]})</h4>
                            {stats.rentals.length === 0 ? (
                                <p className="text-sm text-center py-8 text-muted-foreground">No trips found for this month.</p>
                            ) : (
                                <div className="space-y-2">
                                    {stats.rentals.map(rental => (
                                        <div key={rental._id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg text-sm border border-border">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-foreground">{rental.customer_name}</span>
                                                <span className="text-xs text-muted-foreground">{formatDate(rental.start_date)} - {formatDate(rental.end_date)}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-semibold text-emerald-600 block">{formatCurrency(rental.total_amount)}</span>
                                                <Badge variant={rental.status === 'active' ? 'success' : 'secondary'} className="text-[10px] px-1.5 py-0">
                                                    {rental.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-10 text-destructive">Failed to load data</div>
                )}
            </div>
        </Modal>
    );
};

export default CarDetailsModal;
