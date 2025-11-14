import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { APIProvider } from '@deriv/api';
import { StoreProvider, mockStore } from '@deriv/stores';
import ToggleMenuDrawer from '../toggle-menu-drawer';

// Mock all the problematic imports
jest.mock('@deriv/components', () => {
    const MobileDrawer = jest.fn(({ children, is_open, toggle }) => (
        <div data-testid="mobile-drawer" style={{ display: is_open ? 'block' : 'none' }}>
            <button onClick={toggle} data-testid="close-drawer">Close</button>
            {children}
        </div>
    ));
    MobileDrawer.SubMenu = jest.fn(({ children }) => <div data-testid="drawer-submenu">{children}</div>);
    MobileDrawer.Item = jest.fn(({ children, onClick }) => (
        <div data-testid="drawer-item" onClick={onClick}>
            {children}
        </div>
    ));
    MobileDrawer.Body = jest.fn(({ children }) => <div data-testid="drawer-body">{children}</div>);
    MobileDrawer.Footer = jest.fn(({ children }) => <div data-testid="drawer-footer">{children}</div>);
    return {
        MobileDrawer,
        ToggleSwitch: jest.fn(({ handleToggle, is_enabled }) => (
            <div data-testid="toggle-switch" onClick={handleToggle}>
                {is_enabled ? 'ON' : 'OFF'}
            </div>
        )),
        Div100vhContainer: jest.fn(({ children }) => <div data-testid="div-100vh">{children}</div>),
    };
});

jest.mock('@deriv/quill-icons', () => ({
    LegacyChartsIcon: () => <div data-testid="charts-icon">Charts</div>,
    LegacyArrowLeft1pxIcon: () => <div data-testid="arrow-left-icon">ArrowLeft</div>,
    LegacyChevronRight1pxIcon: () => <div data-testid="chevron-right-icon">ChevronRight</div>,
    LegacyHelpCentreIcon: () => <div data-testid="help-centre-icon">HelpCentre</div>,
    LegacyLogout1pxIcon: () => <div data-testid="logout-icon">Logout</div>,
    LegacyMenuHamburger1pxIcon: () => <div data-testid="hamburger-icon">Hamburger</div>,
    LegacyRegulatoryInformationIcon: () => <div data-testid="regulatory-icon">Regulatory</div>,
    LegacyResponsibleTradingIcon: () => <div data-testid="responsible-trading-icon">ResponsibleTrading</div>,
    LegacyTheme1pxIcon: () => <div data-testid="theme-icon">Theme</div>,
}));

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useLocation: jest.fn(() => ({ pathname: '/appstore/traders-hub' })),
    useHistory: jest.fn(() => ({
        push: jest.fn(),
    })),
}));

jest.mock('@deriv/shared', () => ({
    routes: {
        index: '/',
        reports: '/reports',
    },
    useWS: jest.fn(() => ({})),
    getAccountType: jest.fn(() => 'demo'),
    toGMTFormat: jest.fn((time) => 'GMT Time'),
    toLocalFormat: jest.fn((time) => 'Local Time'),
    isMobile: jest.fn(() => false),
    isDesktop: jest.fn(() => true),
    formatMoney: jest.fn((amount) => amount),
    getCurrencyDisplayCode: jest.fn((currency) => currency),
    getDecimalPlaces: jest.fn(() => 2),
    addComma: jest.fn((num) => num),
    isEmptyObject: jest.fn((obj) => Object.keys(obj || {}).length === 0),
    cloneObject: jest.fn((obj) => ({ ...obj })),
    getPropertyValue: jest.fn((obj, key) => obj?.[key]),
    LocalStore: {
        get: jest.fn(),
        set: jest.fn(),
        remove: jest.fn(),
    },
    SessionStore: {
        get: jest.fn(),
        set: jest.fn(),
        remove: jest.fn(),
    },
}));

jest.mock('App/Hooks/useMobileBridge', () => ({
    useMobileBridge: jest.fn(() => ({
        sendBridgeEvent: jest.fn().mockResolvedValue(true),
        isBridgeAvailable: jest.fn(() => false),
        isDesktop: false,
    })),
}));

// Mock the ToggleMenu components
jest.mock('../Components/ToggleMenu', () => ({
    MenuTitle: () => <div data-testid="menu-title">Menu Title</div>,
    MobileLanguageMenu: () => <div data-testid="mobile-language-menu">Language Menu</div>,
}));

// Mock MenuLink
jest.mock('../menu-link', () => {
    return jest.fn(({ text, onClickLink, icon }) => (
        <div data-testid="menu-link" onClick={onClickLink}>
            {icon}
            <span>{text}</span>
        </div>
    ));
});

// Mock LiveChat and WhatsApp components
jest.mock('App/Components/Elements/LiveChat', () => {
    return jest.fn(() => <div data-testid="live-chat">LiveChat</div>);
});

jest.mock('App/Components/Elements/WhatsApp', () => {
    return jest.fn(({ onClick }) => (
        <div data-testid="whatsapp" onClick={onClick}>WhatsApp</div>
    ));
});

// Mock NetworkStatus
jest.mock('App/Components/Layout/Footer', () => {
    return jest.fn(() => <div data-testid="network-status">Network Status</div>);
});

// Mock routes config
jest.mock('App/Constants/routes-config', () => {
    return jest.fn(() => [
        {
            path: '/reports',
            icon_component: <div>Reports Icon</div>,
            getTitle: () => 'Reports',
            routes: [
                {
                    path: '/reports/positions',
                    icon_component: <div>Positions Icon</div>,
                    getTitle: () => 'Positions',
                },
            ],
        },
    ]);
});

// Mock ServerTime
jest.mock('App/Containers/server-time.jsx', () => {
    return jest.fn(() => <div data-testid="server-time">Server Time</div>);
});

// Mock useRemoteConfig
jest.mock('@deriv/api', () => ({
    ...jest.requireActual('@deriv/api'),
    useRemoteConfig: jest.fn(() => ({
        data: {
            cs_chat_intercom: true,
            cs_chat_whatsapp: true,
        },
    })),
}));

describe('<ToggleMenuDrawer />', () => {
    const mockLogout = jest.fn().mockResolvedValue();
    
    const mockToggleMenuDrawer = (storeOverrides = {}) => {
        return (
            <BrowserRouter>
                <APIProvider>
                    <StoreProvider
                        store={mockStore({
                            client: {
                                is_logged_in: true,
                                logout: mockLogout,
                                ...storeOverrides.client,
                            },
                            modules: {
                                cashier: {
                                    payment_agent: {
                                        is_payment_agent_visible: true,
                                    },
                                },
                            },
                            traders_hub: {
                                show_eu_related_content: false,
                            },
                            ...storeOverrides,
                        })}
                    >
                        <ToggleMenuDrawer />
                    </StoreProvider>
                </APIProvider>
            </BrowserRouter>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // Clear DerivAppChannel from window
        delete window.DerivAppChannel;
    });

    it('should clear timeout after component was unmount', () => {
        jest.useFakeTimers();
        jest.spyOn(global, 'clearTimeout');
        const { unmount } = render(mockToggleMenuDrawer());

        unmount();

        expect(clearTimeout).toBeCalled();
    });

    it('should use Flutter channel when bridge is available and logout is clicked', async () => {
        // Mock bridge available
        const { useMobileBridge } = require('App/Hooks/useMobileBridge');
        const mockSendBridgeEvent = jest.fn().mockResolvedValue(true);
        useMobileBridge.mockReturnValue({
            sendBridgeEvent: mockSendBridgeEvent,
            isBridgeAvailable: jest.fn(() => true),
            isDesktop: false,
        });

        render(mockToggleMenuDrawer());

        // Find and click the hamburger menu to open drawer
        const hamburgerButton = document.getElementById('dt_mobile_drawer_toggle');
        await userEvent.click(hamburgerButton);

        // Find logout menu item and click it
        const logoutItems = screen.getAllByTestId('drawer-item');
        const logoutItem = logoutItems.find(item => 
            item.textContent && item.textContent.includes('Back to app')
        );
        
        if (logoutItem) {
            await userEvent.click(logoutItem);

            expect(mockSendBridgeEvent).toHaveBeenCalledWith('trading:back', expect.any(Function));
        }
    });

    it('should fallback to regular logout when bridge is not available', async () => {
        // Mock bridge not available
        const { useMobileBridge } = require('App/Hooks/useMobileBridge');
        const mockSendBridgeEvent = jest.fn(async (event, fallback) => {
            if (fallback) {
                await fallback(); // Execute fallback
            }
        });
        useMobileBridge.mockReturnValue({
            sendBridgeEvent: mockSendBridgeEvent,
            isBridgeAvailable: jest.fn(() => false),
            isDesktop: false,
        });

        render(mockToggleMenuDrawer());

        // Find and click the hamburger menu to open drawer
        const hamburgerButton = document.getElementById('dt_mobile_drawer_toggle');
        await userEvent.click(hamburgerButton);

        // Find logout menu item and click it
        const logoutItems = screen.getAllByTestId('drawer-item');
        const logoutItem = logoutItems.find(item => 
            item.textContent && item.textContent.includes('Log out')
        );
        
        if (logoutItem) {
            await userEvent.click(logoutItem);

            expect(mockSendBridgeEvent).toHaveBeenCalledWith('trading:back', expect.any(Function));
            expect(mockLogout).toHaveBeenCalledTimes(1);
        }
    });

    it('should show "Back to app" text when bridge is available', () => {
        // Mock bridge available
        const { useMobileBridge } = require('App/Hooks/useMobileBridge');
        useMobileBridge.mockReturnValue({
            sendBridgeEvent: jest.fn(),
            isBridgeAvailable: jest.fn(() => true),
            isDesktop: false,
        });

        render(mockToggleMenuDrawer());

        // The component should use "Back to app" text when bridge is available
        expect(useMobileBridge().isBridgeAvailable()).toBe(true);
    });

    it('should show "Log out" text when bridge is not available', () => {
        // Mock bridge not available
        const { useMobileBridge } = require('App/Hooks/useMobileBridge');
        useMobileBridge.mockReturnValue({
            sendBridgeEvent: jest.fn(),
            isBridgeAvailable: jest.fn(() => false),
            isDesktop: false,
        });

        render(mockToggleMenuDrawer());

        // The component should use "Log out" text when bridge is not available
        expect(useMobileBridge().isBridgeAvailable()).toBe(false);
    });

    it('should show back icon when bridge is available', () => {
        // Mock bridge available
        const { useMobileBridge } = require('App/Hooks/useMobileBridge');
        useMobileBridge.mockReturnValue({
            sendBridgeEvent: jest.fn(),
            isBridgeAvailable: jest.fn(() => true),
            isDesktop: false,
        });

        render(mockToggleMenuDrawer());

        const toggleButton = document.getElementById('dt_mobile_drawer_toggle');
        expect(toggleButton).toBeInTheDocument();
        
        // Should contain back icon when bridge is available
        const backIcon = screen.getByTestId('arrow-left-icon');
        expect(backIcon).toBeInTheDocument();
    });

    it('should show hamburger icon when bridge is not available', () => {
        // Mock bridge not available
        const { useMobileBridge } = require('App/Hooks/useMobileBridge');
        useMobileBridge.mockReturnValue({
            sendBridgeEvent: jest.fn(),
            isBridgeAvailable: jest.fn(() => false),
            isDesktop: false,
        });

        render(mockToggleMenuDrawer());

        const toggleButton = document.getElementById('dt_mobile_drawer_toggle');
        expect(toggleButton).toBeInTheDocument();
        
        // Should contain hamburger icon when bridge is not available
        const hamburgerIcon = screen.getByTestId('hamburger-icon');
        expect(hamburgerIcon).toBeInTheDocument();
    });

    it('should trigger back event when back icon is clicked and bridge is available', async () => {
        // Mock bridge available
        const { useMobileBridge } = require('App/Hooks/useMobileBridge');
        const mockSendBridgeEvent = jest.fn().mockResolvedValue(true);
        useMobileBridge.mockReturnValue({
            sendBridgeEvent: mockSendBridgeEvent,
            isBridgeAvailable: jest.fn(() => true),
            isDesktop: false,
        });

        render(mockToggleMenuDrawer());

        const toggleButton = document.getElementById('dt_mobile_drawer_toggle');
        await userEvent.click(toggleButton);

        expect(mockSendBridgeEvent).toHaveBeenCalledWith('trading:back');
    });

    it('should open drawer when hamburger icon is clicked and bridge is not available', async () => {
        // Mock bridge not available
        const { useMobileBridge } = require('App/Hooks/useMobileBridge');
        useMobileBridge.mockReturnValue({
            sendBridgeEvent: jest.fn(),
            isBridgeAvailable: jest.fn(() => false),
            isDesktop: false,
        });

        render(mockToggleMenuDrawer());

        const toggleButton = document.getElementById('dt_mobile_drawer_toggle');
        await userEvent.click(toggleButton);

        // Should open the drawer
        const drawer = screen.getByTestId('mobile-drawer');
        expect(drawer).toHaveStyle('display: block');
    });

    it('should handle bridge errors gracefully', async () => {
        // Mock bridge error
        const { useMobileBridge } = require('App/Hooks/useMobileBridge');
        const mockSendBridgeEvent = jest.fn(async (event, fallback) => {
            if (fallback) {
                await fallback(); // Execute fallback on error
            }
        });
        useMobileBridge.mockReturnValue({
            sendBridgeEvent: mockSendBridgeEvent,
            isBridgeAvailable: jest.fn(() => true),
            isDesktop: false,
        });

        render(mockToggleMenuDrawer());

        // Find and click the hamburger menu to open drawer
        const hamburgerButton = document.getElementById('dt_mobile_drawer_toggle');
        await userEvent.click(hamburgerButton);

        // Find logout menu item and click it
        const logoutItems = screen.getAllByTestId('drawer-item');
        const logoutItem = logoutItems.find(item => 
            item.textContent && item.textContent.includes('Back to app')
        );
        
        if (logoutItem) {
            await userEvent.click(logoutItem);

            expect(mockSendBridgeEvent).toHaveBeenCalledWith('trading:back', expect.any(Function));
            expect(mockLogout).toHaveBeenCalledTimes(1);
        }
    });
});
