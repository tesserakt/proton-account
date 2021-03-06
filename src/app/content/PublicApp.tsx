import React, { useCallback, useRef, useState } from 'react';
import { Redirect, Route, Switch, useHistory, useLocation } from 'react-router-dom';
import { TtagLocaleMap } from 'proton-shared/lib/interfaces/Locale';
import ForceRefreshContext from 'react-components/containers/forceRefresh/context';
import { OnLoginCallbackArguments, ProtonLoginCallback } from 'react-components/containers/app/interface';
import { LocalSessionResponse } from 'proton-shared/lib/authentication/interface';
import { produceFork, ProduceForkParameters } from 'proton-shared/lib/authentication/sessionForking';
import { SSO_PATHS, UNPAID_STATE } from 'proton-shared/lib/constants';
import { FORK_TYPE } from 'proton-shared/lib/authentication/ForkInterface';
import { GetActiveSessionsResult } from 'proton-shared/lib/authentication/persistedSessionHelper';
import {
    AccountForgotUsernameContainer,
    AccountLoginContainer,
    AccountResetPasswordContainer,
    AccountSignupContainer,
    AccountSwitchContainer,
    SSOForkProducer,
    useApi,
} from 'react-components';

import AccountPublicLayoutWrapper from './AccountPublicLayoutWrapper';
import { APP_NAME } from '../config';
import AccountPublicApp from './AccountPublicApp';
import EmailUnsubscribeContainer from '../containers/EmailUnsubscribeContainer';

interface Props {
    onLogin: ProtonLoginCallback;
    locales: TtagLocaleMap;
}

const PublicApp = ({ onLogin, locales }: Props) => {
    const history = useHistory();
    const location = useLocation();
    const [, setState] = useState(1);
    const refresh = useCallback(() => setState((i) => i + 1), []);
    const api = useApi();
    const [forkState, setForkState] = useState<ProduceForkParameters | undefined>();
    const [activeSessions, setActiveSessions] = useState<LocalSessionResponse[] | undefined>();
    const ignoreAutoRef = useRef(false);
    const [hasBackToSwitch, setHasBackToSwitch] = useState(false);

    const handleLogin = async (args: OnLoginCallbackArguments) => {
        const { keyPassword, UID, User } = args;
        // Upon login, if user is delinquent, the fork is aborted and the user is redirected to invoices
        if (User.Delinquent >= UNPAID_STATE.DELINQUENT) {
            return onLogin({
                ...args,
                path: '/subscription#invoices',
            });
        }
        if (forkState) {
            const type = args.flow === 'signup' ? FORK_TYPE.SIGNUP : undefined;
            await produceFork({ api, UID, keyPassword, ...forkState, type });
            return;
        }
        return onLogin(args);
    };

    const handleActiveSessionsFork = (newForkState: ProduceForkParameters, { sessions }: GetActiveSessionsResult) => {
        ignoreAutoRef.current = true;

        setForkState(newForkState);
        setActiveSessions(sessions);

        history.replace(sessions.length >= 1 ? SSO_PATHS.SWITCH : '/login');
    };

    const handleInvalidFork = () => {
        ignoreAutoRef.current = true;
        history.replace('/login');
    };

    const handleActiveSessions = ({ session, sessions }: GetActiveSessionsResult) => {
        // Ignore the automatic login behavior when the initial load was from a fork request
        if (ignoreAutoRef.current) {
            setActiveSessions(sessions);
            return false;
        }
        if (location.pathname === SSO_PATHS.SWITCH) {
            setActiveSessions(sessions);
            if (!sessions.length) {
                history.replace('/login');
            } else {
                setHasBackToSwitch(true);
            }
            return false;
        }
        if (!sessions.length) {
            setActiveSessions(sessions);
            return false;
        }
        if (session && sessions.length === 1) {
            onLogin(session);
            return true;
        }
        setActiveSessions(sessions);
        setHasBackToSwitch(true);
        history.replace(SSO_PATHS.SWITCH);
        return false;
    };

    const handleSignOutAll = async () => {
        setActiveSessions([]);
        setHasBackToSwitch(false);
        history.push('/login');
    };

    const handleAddAccount = () => {
        history.push('/login');
    };

    const toApp = forkState?.app || APP_NAME;

    return (
        <Switch>
            <Route path="/unsubscribe/:subscriptions">
                <EmailUnsubscribeContainer />
            </Route>
            <Route path={SSO_PATHS.AUTHORIZE}>
                <SSOForkProducer onInvalidFork={handleInvalidFork} onActiveSessions={handleActiveSessionsFork} />
            </Route>
            <Route path="*">
                <AccountPublicApp locales={locales} onLogin={onLogin} onActiveSessions={handleActiveSessions}>
                    <ForceRefreshContext.Provider value={refresh}>
                        <Switch>
                            <Route path={SSO_PATHS.SWITCH}>
                                <AccountSwitchContainer
                                    activeSessions={activeSessions}
                                    toApp={toApp}
                                    onLogin={handleLogin}
                                    onSignOutAll={handleSignOutAll}
                                    onAddAccount={handleAddAccount}
                                    Layout={AccountPublicLayoutWrapper}
                                />
                            </Route>
                            <Route path={SSO_PATHS.SIGNUP}>
                                <AccountSignupContainer
                                    toApp={toApp}
                                    onLogin={handleLogin}
                                    Layout={AccountPublicLayoutWrapper}
                                    onBack={hasBackToSwitch ? () => history.push('/login') : undefined}
                                />
                            </Route>
                            <Route path={SSO_PATHS.RESET_PASSWORD}>
                                <AccountResetPasswordContainer
                                    onLogin={handleLogin}
                                    Layout={AccountPublicLayoutWrapper}
                                />
                            </Route>
                            <Route path={SSO_PATHS.FORGOT_USERNAME}>
                                <AccountForgotUsernameContainer Layout={AccountPublicLayoutWrapper} />
                            </Route>
                            <Route path={SSO_PATHS.LOGIN}>
                                <AccountLoginContainer
                                    toApp={toApp}
                                    onLogin={handleLogin}
                                    Layout={AccountPublicLayoutWrapper}
                                    onBack={hasBackToSwitch ? () => history.push('/switch') : undefined}
                                />
                            </Route>
                            <Redirect to={SSO_PATHS.LOGIN} />
                        </Switch>
                    </ForceRefreshContext.Provider>
                </AccountPublicApp>
            </Route>
        </Switch>
    );
};

export default PublicApp;
