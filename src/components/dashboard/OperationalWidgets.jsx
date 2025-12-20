import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useSettings } from '../../context/SettingsContext';
import {
    Calendar,
    Clock,
    Phone,
    Wrench,
    ArrowUpCircle,
    ArrowDownCircle,
    AlertTriangle,
    CheckCircle,
    Car
} from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

// ============================================
// 1. FLEET AVAILABILITY CALENDAR (7 days)
// ============================================
export const FleetCalendar = ({ selectedDate }) => {
    const [cars, setCars] = useState([]);
    const [rentals, setRentals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch all cars
            const { data: carsData } = await supabase
                .from('cars')
                .select('id, make, model, license_plate, status')
                .order('make');

            // Fetch active rentals for next 7 days
            const startDate = new Date(selectedDate);
            const endDate = new Date(selectedDate);
            endDate.setDate(endDate.getDate() + 6);

            const { data: rentalsData } = await supabase
                .from('rentals')
                .select('car_id, start_date, end_date, status')
                .in('status', ['active', 'pending'])
                .gte('end_date', startDate.toISOString().split('T')[0])
                .lte('start_date', endDate.toISOString().split('T')[0]);

            setCars(carsData || []);
            setRentals(rentalsData || []);
        } catch (error) {
            console.error('Error fetching fleet data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Generate 7 days starting from selectedDate
    const days = [...Array(7)].map((_, i) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + i);
        return {
            date: d.toISOString().split('T')[0],
            dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
            dayNum: d.getDate()
        };
    });

    // Check if car is booked on a given date
    const isCarBooked = (carId, dateStr) => {
        const checkDate = new Date(dateStr);
        return rentals.some(r => {
            if (r.car_id !== carId) return false;
            const start = new Date(r.start_date);
            const end = new Date(r.end_date);
            return checkDate >= start && checkDate <= end;
        });
    };

    const getCarStatus = (car, dateStr) => {
        if (car.status === 'maintenance') return 'maintenance';
        if (isCarBooked(car.id, dateStr)) return 'booked';
        return 'available';
    };

    const statusColors = {
        available: 'bg-emerald-500/20 border-emerald-500/30',
        booked: 'bg-red-500/20 border-red-500/30',
        maintenance: 'bg-yellow-500/20 border-yellow-500/30'
    };

    if (loading) {
        return (
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Calendar size={20} className="text-primary" />
                    <h3 className="text-lg font-semibold">Fleet Availability</h3>
                </div>
                <div className="animate-pulse h-40 bg-muted rounded-lg"></div>
            </Card>
        );
    }

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Calendar size={20} className="text-primary" />
                    Fleet Availability
                </h3>
                <div className="flex gap-3 text-xs">
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-emerald-500/40"></span> Available
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-red-500/40"></span> Booked
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-yellow-500/40"></span> Maintenance
                    </span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="text-left py-2 pr-4 font-medium text-muted-foreground min-w-[120px]">Vehicle</th>
                            {days.map(day => (
                                <th key={day.date} className="text-center py-2 px-1 font-medium text-muted-foreground">
                                    <div className="text-xs">{day.dayName}</div>
                                    <div className="text-foreground">{day.dayNum}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {cars.slice(0, 5).map(car => (
                            <tr key={car.id} className="border-b border-border/50 hover:bg-muted/30">
                                <td className="py-2 pr-4">
                                    <div className="font-medium text-foreground truncate max-w-[120px]">
                                        {car.make} {car.model}
                                    </div>
                                    <div className="text-xs text-muted-foreground">{car.license_plate}</div>
                                </td>
                                {days.map(day => {
                                    const status = getCarStatus(car, day.date);
                                    return (
                                        <td key={day.date} className="py-2 px-1">
                                            <div className={`w-8 h-8 mx-auto rounded border ${statusColors[status]}`}></div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {cars.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                        +{cars.length - 5} more vehicles
                    </p>
                )}
                {cars.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No vehicles in fleet</p>
                )}
            </div>
        </Card>
    );
};

// ============================================
// 2. UPCOMING RETURNS
// ============================================
export const UpcomingReturns = ({ selectedDate }) => {
    const { formatCurrency } = useSettings();
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReturns();
    }, [selectedDate]);

    const fetchReturns = async () => {
        try {
            setLoading(true);
            const today = new Date(selectedDate);
            const tomorrow = new Date(selectedDate);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const { data } = await supabase
                .from('rentals')
                .select(`
                    id,
                    customer_name,
                    customer_phone,
                    end_date,
                    total_amount,
                    cars (make, model, license_plate)
                `)
                .eq('status', 'active')
                .gte('end_date', today.toISOString().split('T')[0])
                .lte('end_date', tomorrow.toISOString().split('T')[0])
                .order('end_date');

            setReturns(data || []);
        } catch (error) {
            console.error('Error fetching returns:', error);
        } finally {
            setLoading(false);
        }
    };

    const isToday = (dateStr) => {
        return dateStr === new Date(selectedDate).toISOString().split('T')[0];
    };

    if (loading) {
        return (
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <ArrowDownCircle size={20} className="text-primary" />
                    <h3 className="text-lg font-semibold">Upcoming Returns</h3>
                </div>
                <div className="animate-pulse space-y-3">
                    {[1, 2].map(i => <div key={i} className="h-16 bg-muted rounded-lg"></div>)}
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <ArrowDownCircle size={20} className="text-primary" />
                    Upcoming Returns
                </h3>
                <Badge variant="secondary" className="text-xs">{returns.length} due</Badge>
            </div>

            {returns.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                    <CheckCircle size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No returns due today or tomorrow</p>
                </div>
            ) : (
                <div className="space-y-3 max-h-[220px] overflow-y-auto">
                    {returns.map(rental => (
                        <div
                            key={rental.id}
                            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50 hover:border-border transition-colors"
                        >
                            <div className={`w-2 h-2 rounded-full shrink-0 ${isToday(rental.end_date) ? 'bg-orange-500 animate-pulse' : 'bg-blue-500'
                                }`}></div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-foreground truncate">{rental.customer_name}</span>
                                    <Badge
                                        variant={isToday(rental.end_date) ? 'destructive' : 'secondary'}
                                        className="text-[10px] px-1.5 py-0"
                                    >
                                        {isToday(rental.end_date) ? 'Today' : 'Tomorrow'}
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                    {rental.cars?.make} {rental.cars?.model} • {rental.cars?.license_plate}
                                </p>
                            </div>
                            <a
                                href={`tel:${rental.customer_phone}`}
                                className="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors"
                                title={`Call ${rental.customer_phone}`}
                            >
                                <Phone size={16} />
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};

// ============================================
// 3. MAINTENANCE ALERTS (includes Insurance & Document Expiry)
// ============================================
export const MaintenanceAlerts = () => {
    const [maintenanceCars, setMaintenanceCars] = useState([]);
    const [insuranceAlerts, setInsuranceAlerts] = useState([]);
    const [documentAlerts, setDocumentAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        try {
            setLoading(true);

            // Fetch maintenance cars
            const { data: maintenanceData } = await supabase
                .from('cars')
                .select('id, make, model, license_plate, status, updated_at')
                .eq('status', 'maintenance')
                .order('updated_at', { ascending: true });

            setMaintenanceCars(maintenanceData || []);

            // Fetch cars with expiring/expired insurance
            const today = new Date();
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            const thirtyDaysStr = thirtyDaysFromNow.toISOString().split('T')[0];

            const { data: insuranceData } = await supabase
                .from('cars')
                .select('id, make, model, license_plate, insurance_expiry_date')
                .not('insurance_expiry_date', 'is', null)
                .lte('insurance_expiry_date', thirtyDaysStr)
                .order('insurance_expiry_date', { ascending: true });

            setInsuranceAlerts(insuranceData || []);

            // Fetch cars with expiring documents (RC, Pollution, Fitness)
            const { data: allCars } = await supabase
                .from('cars')
                .select('id, make, model, license_plate, rc_expiry_date, pollution_expiry_date, fitness_expiry_date');

            const docAlerts = [];
            (allCars || []).forEach(car => {
                // Check RC expiry
                if (car.rc_expiry_date && new Date(car.rc_expiry_date) <= thirtyDaysFromNow) {
                    docAlerts.push({ ...car, docType: 'RC', expiryDate: car.rc_expiry_date });
                }
                // Check Pollution expiry
                if (car.pollution_expiry_date && new Date(car.pollution_expiry_date) <= thirtyDaysFromNow) {
                    docAlerts.push({ ...car, docType: 'Pollution', expiryDate: car.pollution_expiry_date });
                }
                // Check Fitness expiry
                if (car.fitness_expiry_date && new Date(car.fitness_expiry_date) <= thirtyDaysFromNow) {
                    docAlerts.push({ ...car, docType: 'Fitness', expiryDate: car.fitness_expiry_date });
                }
            });

            // Sort by expiry date
            docAlerts.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
            setDocumentAlerts(docAlerts);
        } catch (error) {
            console.error('Error fetching alerts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAvailable = async (carId) => {
        try {
            const { error } = await supabase
                .from('cars')
                .update({ status: 'available' })
                .eq('id', carId);

            if (error) throw error;
            fetchAlerts();
        } catch (error) {
            console.error('Error updating car status:', error);
        }
    };

    const getDaysSince = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const getExpiryStatus = (expiryDate) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(expiryDate);
        expiry.setHours(0, 0, 0, 0);
        const daysUntil = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

        if (daysUntil < 0) {
            return { label: 'Expired', days: Math.abs(daysUntil), variant: 'destructive', isExpired: true };
        } else {
            return { label: 'Expiring', days: daysUntil, variant: 'warning', isExpired: false };
        }
    };

    const totalAlerts = maintenanceCars.length + insuranceAlerts.length + documentAlerts.length;

    if (loading) {
        return (
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Wrench size={20} className="text-primary" />
                    <h3 className="text-lg font-semibold">Maintenance Alerts</h3>
                </div>
                <div className="animate-pulse space-y-3">
                    {[1, 2].map(i => <div key={i} className="h-14 bg-muted rounded-lg"></div>)}
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Wrench size={20} className="text-primary" />
                    Maintenance Alerts
                </h3>
                {totalAlerts > 0 && (
                    <Badge variant="warning" className="text-xs bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
                        {totalAlerts} alert{totalAlerts !== 1 ? 's' : ''}
                    </Badge>
                )}
            </div>

            {totalAlerts === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                    <CheckCircle size={32} className="mx-auto mb-2 opacity-30 text-emerald-500" />
                    <p className="text-sm">All vehicles operational</p>
                </div>
            ) : (
                <div className="space-y-3 max-h-[220px] overflow-y-auto">
                    {/* Insurance Alerts */}
                    {insuranceAlerts.map(car => {
                        const status = getExpiryStatus(car.insurance_expiry_date);
                        return (
                            <div
                                key={`ins-${car.id}`}
                                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${status.isExpired
                                    ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
                                    : 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40'
                                    }`}
                            >
                                <div className={`p-2 rounded-full ${status.isExpired ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
                                    <AlertTriangle size={16} className={status.isExpired ? 'text-red-600' : 'text-amber-600'} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-foreground truncate">
                                        {car.make} {car.model}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Insurance {status.isExpired ? 'expired' : 'expires in'} {status.days} day{status.days !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                <Badge variant={status.variant} className="text-[10px]">
                                    {status.label}
                                </Badge>
                            </div>
                        );
                    })}

                    {/* Document Alerts (RC, Pollution, Fitness) */}
                    {documentAlerts.map((doc, idx) => {
                        const status = getExpiryStatus(doc.expiryDate);
                        return (
                            <div
                                key={`doc-${doc.id}-${doc.docType}-${idx}`}
                                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${status.isExpired
                                    ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
                                    : 'bg-purple-500/5 border-purple-500/20 hover:border-purple-500/40'
                                    }`}
                            >
                                <div className={`p-2 rounded-full ${status.isExpired ? 'bg-red-500/10' : 'bg-purple-500/10'}`}>
                                    <AlertTriangle size={16} className={status.isExpired ? 'text-red-600' : 'text-purple-600'} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-foreground truncate">
                                        {doc.make} {doc.model}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {doc.docType} {status.isExpired ? 'expired' : 'expires in'} {status.days} day{status.days !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                <Badge variant={status.variant} className="text-[10px]">
                                    {doc.docType}
                                </Badge>
                            </div>
                        );
                    })}

                    {/* Maintenance Cars */}
                    {maintenanceCars.map(car => {
                        const daysSince = getDaysSince(car.updated_at);
                        return (
                            <div
                                key={car.id}
                                className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20 hover:border-yellow-500/40 transition-colors"
                            >
                                <div className="p-2 rounded-full bg-yellow-500/10">
                                    <Wrench size={16} className="text-yellow-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-foreground truncate">
                                        {car.make} {car.model}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {car.license_plate} • {daysSince} day{daysSince !== 1 ? 's' : ''} in maintenance
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMarkAvailable(car.id)}
                                    className="text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                >
                                    Mark Ready
                                </Button>
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );
};

// ============================================
// 4. TODAY'S SCHEDULE (Pickups & Drop-offs)
// ============================================
export const TodaysSchedule = ({ selectedDate }) => {
    const [schedule, setSchedule] = useState({ pickups: [], dropoffs: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSchedule();
    }, [selectedDate]);

    const fetchSchedule = async () => {
        try {
            setLoading(true);
            const dateStr = new Date(selectedDate).toISOString().split('T')[0];

            // Fetch pickups (rentals starting today)
            const { data: pickups } = await supabase
                .from('rentals')
                .select(`
                    id,
                    customer_name,
                    customer_phone,
                    start_date,
                    start_time,
                    from_location,
                    cars (make, model, license_plate)
                `)
                .eq('start_date', dateStr)
                .in('status', ['active', 'pending'])
                .order('start_time');

            // Fetch drop-offs (rentals ending today)
            const { data: dropoffs } = await supabase
                .from('rentals')
                .select(`
                    id,
                    customer_name,
                    customer_phone,
                    end_date,
                    end_time,
                    to_location,
                    cars (make, model, license_plate)
                `)
                .eq('end_date', dateStr)
                .eq('status', 'active')
                .order('end_time');

            setSchedule({
                pickups: pickups || [],
                dropoffs: dropoffs || []
            });
        } catch (error) {
            console.error('Error fetching schedule:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (time) => {
        if (!time) return '--:--';
        return time.slice(0, 5); // HH:MM
    };

    const totalCount = schedule.pickups.length + schedule.dropoffs.length;

    if (loading) {
        return (
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Clock size={20} className="text-primary" />
                    <h3 className="text-lg font-semibold">Today's Schedule</h3>
                </div>
                <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted rounded-lg"></div>)}
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Clock size={20} className="text-primary" />
                    Today's Schedule
                </h3>
                <Badge variant="secondary" className="text-xs">{totalCount} events</Badge>
            </div>

            {totalCount === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                    <Calendar size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No pickups or drop-offs scheduled</p>
                </div>
            ) : (
                <div className="space-y-4 max-h-[280px] overflow-y-auto">
                    {/* Pickups */}
                    {schedule.pickups.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <ArrowUpCircle size={14} className="text-emerald-500" />
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Pickups ({schedule.pickups.length})
                                </span>
                            </div>
                            <div className="space-y-2">
                                {schedule.pickups.map(rental => (
                                    <div
                                        key={rental.id}
                                        className="flex items-center gap-3 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20"
                                    >
                                        <div className="text-sm font-mono text-emerald-600 font-medium w-12">
                                            {formatTime(rental.start_time)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {rental.customer_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {rental.cars?.make} {rental.cars?.model} • {rental.from_location || 'No location'}
                                            </p>
                                        </div>
                                        <a
                                            href={`tel:${rental.customer_phone}`}
                                            className="p-1.5 rounded-full hover:bg-emerald-500/10 text-emerald-600"
                                        >
                                            <Phone size={14} />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Drop-offs */}
                    {schedule.dropoffs.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <ArrowDownCircle size={14} className="text-orange-500" />
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Drop-offs ({schedule.dropoffs.length})
                                </span>
                            </div>
                            <div className="space-y-2">
                                {schedule.dropoffs.map(rental => (
                                    <div
                                        key={rental.id}
                                        className="flex items-center gap-3 p-2.5 rounded-lg bg-orange-500/5 border border-orange-500/20"
                                    >
                                        <div className="text-sm font-mono text-orange-600 font-medium w-12">
                                            {formatTime(rental.end_time)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {rental.customer_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {rental.cars?.make} {rental.cars?.model} • {rental.to_location || 'No location'}
                                            </p>
                                        </div>
                                        <a
                                            href={`tel:${rental.customer_phone}`}
                                            className="p-1.5 rounded-full hover:bg-orange-500/10 text-orange-600"
                                        >
                                            <Phone size={14} />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
};

export default { FleetCalendar, UpcomingReturns, MaintenanceAlerts, TodaysSchedule };
