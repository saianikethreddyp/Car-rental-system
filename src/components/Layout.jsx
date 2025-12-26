import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import SupportButton from './ui/SupportButton';

const Layout = () => {
    return (
        <div className="min-h-screen bg-background">
            <Sidebar />

            {/* Main Content Area - offset by sidebar width */}
            <div className="lg:ml-64 flex flex-col min-h-screen">
                <Header />

                <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                    <div className="mx-auto max-w-7xl">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* WhatsApp Support Button */}
            <SupportButton />
        </div>
    );
};

export default Layout;

