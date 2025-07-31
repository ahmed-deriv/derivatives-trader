import React from 'react';
import { Button, Icon, Popover } from '@deriv/components';
// import { useAccountSettingsRedirect } from '@deriv/api';
import { formatMoney } from '@deriv/shared';
import { useStore } from '@deriv/stores';
import { localize, Localize } from '@deriv/translations';
import { LoginButton } from './login-button.jsx';
import { SignupButton } from './signup-button.jsx';
// import ToggleNotifications from './toggle-notifications.jsx';
import 'Sass/app/_common/components/account-switcher.scss';
import { useDevice } from '@deriv-com/ui';

type TUiStore = ReturnType<typeof useStore>['ui'];

type TAccountActionsProps = {
    acc_switcher_disabled_message: string;
    balance: string | number | undefined;
    currency: string;
    is_acc_switcher_disabled: boolean;
    // is_notifications_visible: boolean;
    is_logged_in: boolean;
    is_traders_hub_routes: boolean;
    is_virtual: boolean;
    // notifications_count: number;
    onClickDeposit: () => void;
    // toggleNotifications: () => void;
    // openRealAccountSignup: TUiStore['openRealAccountSignup'];
};

const AccountInfo = React.lazy(
    () =>
        import(
            /* webpackChunkName: "account-info", webpackPreload: true */ 'App/Components/Layout/Header/account-info.jsx'
        )
);

// const AccountSettingsToggle = () => {
//     const { redirect_url } = useAccountSettingsRedirect();

//     const accountSettings = (
//         <a className='account-settings-toggle' href={redirect_url}>
//             <Icon icon='IcUserOutline' />
//         </a>
//     );

//     if (isTabletOs) return accountSettings;

//     return (
//         <Popover
//             classNameBubble='account-settings-toggle__tooltip'
//             alignment='bottom'
//             message={<Localize i18n_default_text='Manage account settings' />}
//             should_disable_pointer_events
//             zIndex={'9999'}
//         >
//             {accountSettings}
//         </Popover>
//     );
// };

// const NotificationsToggle = ({
//     count,
//     is_visible,
//     toggleDialog,
// }: {
//     count?: number;
//     is_visible?: boolean;
//     toggleDialog?: () => void;
// }) => (
//     <ToggleNotifications
//         count={count}
//         is_visible={is_visible}
//         toggleDialog={toggleDialog}
//         tooltip_message={<Localize i18n_default_text='View notifications' />}
//         should_disable_pointer_events
//         showPopover={!isTabletOs}
//     />
// );

const DepositButton = ({ onClickDeposit }: { onClickDeposit: () => void }) => (
    <Button className='acc-info__button' has_effect text={localize('Deposit')} onClick={onClickDeposit} primary />
);

const LoggedOutView = () => (
    <>
        <LoginButton className='acc-info__button' />
        <SignupButton className='acc-info__button' />
    </>
);

const AccountActionsComponent = ({
    acc_switcher_disabled_message,
    balance,
    currency,
    is_acc_switcher_disabled,
    is_logged_in,
    // is_notifications_visible,
    is_traders_hub_routes,
    is_virtual,
    // notifications_count,
    onClickDeposit,
    // openRealAccountSignup,
    // toggleNotifications,
}: TAccountActionsProps) => {
    const { isDesktop } = useDevice();
    const isDepositButtonVisible = isDesktop && !is_traders_hub_routes && currency;
    const formattedBalance = balance != null ? formatMoney(currency, balance, true) : undefined;

    const renderAccountInfo = () => (
        <React.Suspense fallback={<div />}>
            <AccountInfo
                acc_switcher_disabled_message={acc_switcher_disabled_message}
                balance={formattedBalance}
                currency={currency}
                is_disabled={is_acc_switcher_disabled}
                is_virtual={is_virtual}
                {...(!isDesktop && {
                    is_mobile: true,
                })}
            />
        </React.Suspense>
    );

    if (!is_logged_in) {
        return <LoggedOutView />;
    }

    return (
        <React.Fragment>
            {isDepositButtonVisible && <DepositButton onClickDeposit={onClickDeposit} />}
            {!is_traders_hub_routes && renderAccountInfo()}
            {/* <NotificationsToggle
                count={notifications_count}
                is_visible={is_notifications_visible}
                toggleDialog={toggleNotifications}
            />
            {isDesktop && <AccountSettingsToggle />} */}
        </React.Fragment>
    );
};

AccountActionsComponent.displayName = 'AccountActions';

const AccountActions = React.memo(AccountActionsComponent);

export { AccountActions };
