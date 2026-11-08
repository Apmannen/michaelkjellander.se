import * as FaIcons from 'react-icons/fa';
import * as PiIcons from 'react-icons/pi';
import { IconBaseProps, IconType } from 'react-icons/lib';
import { IconName } from './types';

export const NamedIcon = ({
  iconName,
  ...props
}: { iconName: IconName } & IconBaseProps) => {
  const allIcons: Partial<Record<IconName, IconType>> = {
    ...FaIcons,
    ...PiIcons,
  };
  const Icon = allIcons[iconName];
  if (!Icon) {
    return null;
  }
  return <Icon {...props} />;
};
