import Link from 'next/link';
import { IconName } from './NamedIcon/types';
import { NamedIcon } from './NamedIcon';
import { GoArrowUpRight } from 'react-icons/go';

export const Button = ({
  href,
  children,
  target,
  iconName,
}: {
  href: string;
  children: React.ReactNode;
  target?: '_blank';
  iconName?: IconName;
}) => {
  return (
    <Link
      className='bg-accent-800 text-white px-4 py-2 rounded-md flex items-center text-[18px] gap-2 hover:bg-accent-600'
      href={href}
      target={target}
    >
      {iconName ? <NamedIcon iconName={iconName} size={20} /> : null}
      {children}
      <GoArrowUpRight size={20} />
    </Link>
  );
};
