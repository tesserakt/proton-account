import React from 'react';
import { c } from 'ttag';
import {
    LanguageSection,
    SettingsPropsShared,
    ThemesSection,
    TimeFormatSection,
    DateFormatSection,
    WeekStartSection,
} from 'react-components';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import locales from 'proton-shared/lib/i18n/locales';
import { IS_DATE_FORMAT_ENABLED } from 'proton-shared/lib/i18n/dateFnLocale';

import PrivateMainSettingsAreaWithPermissions from '../components/PrivateMainSettingsAreaWithPermissions';

export const getGeneralPage = () => {
    return {
        text: c('Title').t`General`,
        to: '/general',
        icon: 'general',
        subsections: [
            {
                text: c('Title').t`Language`,
                id: 'language',
            },
            {
                text: c('Title').t`Theme`,
                id: 'theme',
            },
            {
                text: c('Title').t`Time format`,
                id: 'time-format',
            },
            IS_DATE_FORMAT_ENABLED
                ? {
                      text: c('Title').t`Date format`,
                      id: 'date-format',
                  }
                : undefined,
            {
                text: c('Title').t`Week start`,
                id: 'week-start',
            },
        ].filter(isTruthy),
    };
};

const GeneralContainer = ({ location, setActiveSection }: SettingsPropsShared) => {
    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getGeneralPage()}
            setActiveSection={setActiveSection}
        >
            <LanguageSection locales={locales} />
            <ThemesSection />
            <TimeFormatSection />
            {IS_DATE_FORMAT_ENABLED ? <DateFormatSection /> : null}
            <WeekStartSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default GeneralContainer;
