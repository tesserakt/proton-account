import * as React from 'react';
import {
    usePermissions,
    Paragraph,
    SettingsPropsShared,
    PrivateMainSettingsArea,
    SectionConfig,
    AppLink,
} from 'react-components';
import { hasPermission } from 'proton-shared/lib/helpers/permissions';
import { PERMISSIONS } from 'proton-shared/lib/constants';
import { getLightOrDark } from 'proton-shared/lib/themes/helpers';
import { getAccountSettingsApp } from 'proton-shared/lib/apps/helper';
import { c } from 'ttag';
import upgradeSvgLight from 'design-system/assets/img/shared/no-organization.svg';
import upgradeSvgDark from 'design-system/assets/img/shared/no-organization-dark.svg';
import passwordSvgLight from 'design-system/assets/img/shared/no-access-page.svg';
import passwordSvgDark from 'design-system/assets/img/shared/no-access-page-dark.svg';

const { ADMIN, MEMBER } = PERMISSIONS;

interface Props extends SettingsPropsShared {
    config: SectionConfig;
    children?: React.ReactNode;
}

interface PermissionProps {
    permission?: boolean;
}

const PrivateMainSettingsAreaWithPermissions = ({ config, location, children, setActiveSection }: Props) => {
    const userPermissions = usePermissions();
    const { subsections = [], permissions: pagePermissions = [], text } = config;

    const noPermissionChild = (() => {
        if (userPermissions.includes(MEMBER) && pagePermissions.includes(ADMIN)) {
            const passwordSvg = getLightOrDark(passwordSvgLight, passwordSvgDark);
            return (
                <div id="page-error" className="aligncenter">
                    <img src={passwordSvg} alt={c('Title').t`Password`} className="mb2" />
                    <h3 className="bold">{c('Title').t`Sorry, you can't access this page`}</h3>
                    <Paragraph>
                        {c('Info')
                            .t`Users can't make changes to organization settings. If you need admin priviledges, reach out to your system administrator.`}
                    </Paragraph>
                </div>
            );
        }

        if (!hasPermission(userPermissions, pagePermissions)) {
            const upgradeSvg = getLightOrDark(upgradeSvgLight, upgradeSvgDark);
            return (
                <div id="page-error" className="aligncenter">
                    <img src={upgradeSvg} alt={c('Title').t`Upgrade`} className="mb2" />
                    <Paragraph>
                        {c('Info')
                            .t`Upgrade to a paid plan to access premium features and increase your storage space.`}
                    </Paragraph>
                    <AppLink
                        to="/subscription"
                        toApp={getAccountSettingsApp()}
                        className="pm-button--primary pm-button--large mtauto"
                    >{c('Action').t`Upgrade now`}</AppLink>
                </div>
            );
        }
    })();

    const childrenWithPermissions = React.Children.toArray(children)
        .map((child, index) => {
            if (!React.isValidElement<PermissionProps>(child)) {
                return null;
            }
            const { permissions: sectionPermissions } = subsections[index] || { id: 'no-id', text: '' };
            return React.cloneElement(child, {
                permission: hasPermission(userPermissions, sectionPermissions),
            });
        })
        .filter((x) => x !== null);

    return (
        <PrivateMainSettingsArea
            title={text}
            location={location}
            setActiveSection={setActiveSection}
            subsections={noPermissionChild ? [] : subsections}
        >
            {noPermissionChild || childrenWithPermissions}
        </PrivateMainSettingsArea>
    );
};

export default PrivateMainSettingsAreaWithPermissions;
