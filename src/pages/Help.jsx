import React, { useState } from 'react';
import {
    Book, Car, Calendar, Users, CreditCard, Settings, HelpCircle,
    ChevronDown, ChevronRight, ExternalLink, MessageCircle, Phone,
    FileText, PlayCircle, CheckCircle, AlertCircle
} from 'lucide-react';
import Card from '../components/ui/Card';

const Help = () => {
    const [expandedSection, setExpandedSection] = useState('getting-started');

    const toggleSection = (section) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    const helpSections = [
        {
            id: 'getting-started',
            icon: PlayCircle,
            title: 'Getting Started',
            content: [
                {
                    q: 'How do I log in?',
                    a: 'Use your email and password provided by the administrator. Click "Forgot Password" if you need to reset it.'
                },
                {
                    q: 'What is the Dashboard?',
                    a: 'The Dashboard gives you a real-time overview of your fleet status, active rentals, revenue, and upcoming schedules.'
                },
                {
                    q: 'How do I create my first booking?',
                    a: 'Click "+ Add Booking" on the Dashboard or go to Rentals page. Select a car, enter customer details, dates, and confirm.'
                }
            ]
        },
        {
            id: 'fleet-management',
            icon: Car,
            title: 'Fleet Management',
            content: [
                {
                    q: 'How do I add a new vehicle?',
                    a: 'Go to Fleet page → Click "+ Add Vehicle" → Fill in make, model, year, license plate, and daily rate → Save.'
                },
                {
                    q: 'What happens when I delete a car?',
                    a: 'Cars are "soft deleted" - they\'re hidden from the active list but all rental history is preserved. You can restore deleted cars later.'
                },
                {
                    q: 'How do I change car status?',
                    a: 'On the Fleet page, each car card has status buttons: Available (green), Rented (auto-set), Maintenance (orange).'
                },
                {
                    q: 'How do I track insurance expiry?',
                    a: 'Edit the car and set the insurance expiry date. You\'ll see alerts on the Dashboard when expiry is within 30 days.'
                }
            ]
        },
        {
            id: 'rentals',
            icon: Calendar,
            title: 'Booking & Rentals',
            content: [
                {
                    q: 'How do I create a new booking?',
                    a: '1. Click "+ Add Booking"\n2. Select an available car\n3. Enter customer name and phone\n4. Set pickup/drop locations and dates\n5. Amount auto-calculates (editable)\n6. Optionally add ID documents\n7. Click "Confirm Booking"'
                },
                {
                    q: 'How do I complete a rental?',
                    a: 'On the Rentals page, find the active rental and click the green checkmark (✓) to mark it complete. The car becomes available again.'
                },
                {
                    q: 'How do I cancel a rental?',
                    a: 'Click the red X icon on the rental. The car will be marked available again.'
                },
                {
                    q: 'How do I generate an invoice?',
                    a: 'Click the document icon on any rental to view/print the invoice. It includes all booking details and company info.'
                }
            ]
        },
        {
            id: 'customers',
            icon: Users,
            title: 'Customers',
            content: [
                {
                    q: 'Where can I see customer information?',
                    a: 'Go to Customers page to see all customers with their rental history and total spent.'
                },
                {
                    q: 'How are customers created?',
                    a: 'Customers are automatically created when you make a booking. Their details are saved for future reference.'
                }
            ]
        },
        {
            id: 'payments',
            icon: CreditCard,
            title: 'Payments',
            content: [
                {
                    q: 'How do I track payments?',
                    a: 'Go to Payments page to see all rental payments with their status (Paid, Pending, Overdue).'
                },
                {
                    q: 'How do I mark a payment as received?',
                    a: 'Click on the payment and update its status to "Paid".'
                }
            ]
        },
        {
            id: 'settings',
            icon: Settings,
            title: 'Settings',
            content: [
                {
                    q: 'How do I change the currency?',
                    a: 'Go to Settings → Currency section → Select your preferred currency (INR, USD, EUR, etc.)'
                },
                {
                    q: 'How do I update company information?',
                    a: 'Go to Settings → Company Details → Update name, address, phone, email, GST number.'
                }
            ]
        }
    ];

    const faqs = [
        {
            q: 'Why is a car showing as "Rented" when it should be available?',
            a: 'Complete or cancel the active rental for that car. Go to Rentals → Find the rental → Mark as Complete or Cancel.'
        },
        {
            q: 'Can I edit a completed rental?',
            a: 'No, completed rentals are locked. You can view details and generate invoices but cannot modify them.'
        },
        {
            q: 'How do I restore a deleted car?',
            a: 'When adding a car with the same license plate as a deleted car, you\'ll see an option to "Restore" it instead of creating new.'
        },
        {
            q: 'Why am I seeing "Unauthorized" errors?',
            a: 'Your session may have expired. Log out and log back in to refresh your authentication.'
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Help & Documentation</h1>
                    <p className="text-muted-foreground mt-1">Learn how to use Dhanya CRM effectively</p>
                </div>
                <a
                    href="https://developer-portal-saianikethreddyp.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Book size={18} />
                    API Documentation
                    <ExternalLink size={14} />
                </a>
            </div>

            {/* Quick Actions */}
            <Card className="p-4 bg-primary/5 border-primary/20">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <HelpCircle className="text-primary" size={20} />
                        </div>
                        <div>
                            <h3 className="font-medium text-foreground">Need more help?</h3>
                            <p className="text-sm text-muted-foreground">Contact our support team</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <a
                            href="https://wa.me/918328417230?text=Hi,%20I%20need%20help%20with%20the%20Dhanya%20Car%20Rentals%20system."
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                        >
                            <MessageCircle size={18} />
                            WhatsApp
                        </a>
                        <a
                            href="tel:+918328417230"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-lg hover:bg-muted transition-colors"
                        >
                            <Phone size={18} />
                            Call Support
                        </a>
                    </div>
                </div>
            </Card>

            {/* Help Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Guides */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-foreground">User Guides</h2>
                    {helpSections.map((section) => (
                        <Card key={section.id} className="overflow-hidden">
                            <button
                                onClick={() => toggleSection(section.id)}
                                className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <section.icon className="text-primary" size={18} />
                                    </div>
                                    <span className="font-medium text-foreground">{section.title}</span>
                                </div>
                                {expandedSection === section.id ? (
                                    <ChevronDown size={20} className="text-muted-foreground" />
                                ) : (
                                    <ChevronRight size={20} className="text-muted-foreground" />
                                )}
                            </button>
                            {expandedSection === section.id && (
                                <div className="px-4 pb-4 space-y-4">
                                    {section.content.map((item, idx) => (
                                        <div key={idx} className="pl-11">
                                            <p className="font-medium text-foreground text-sm">{item.q}</p>
                                            <p className="text-muted-foreground text-sm mt-1 whitespace-pre-line">{item.a}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    ))}
                </div>

                {/* FAQ */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-foreground">Frequently Asked Questions</h2>
                    <Card className="divide-y divide-border">
                        {faqs.map((faq, idx) => (
                            <div key={idx} className="p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-medium text-foreground text-sm">{faq.q}</p>
                                        <p className="text-muted-foreground text-sm mt-1">{faq.a}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </Card>

                    {/* Quick Tips */}
                    <h2 className="text-xl font-semibold text-foreground pt-4">Quick Tips</h2>
                    <Card className="p-4">
                        <ul className="space-y-3">
                            {[
                                'Use the search bar to quickly find rentals or cars',
                                'Check Dashboard daily for insurance & maintenance alerts',
                                'Always complete rentals on time to keep fleet status accurate',
                                'Upload customer ID documents for record keeping',
                                'Use date picker on Dashboard to view specific day schedules'
                            ].map((tip, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm">
                                    <CheckCircle size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-muted-foreground">{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Help;
