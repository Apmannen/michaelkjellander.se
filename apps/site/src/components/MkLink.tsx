import Link from 'next/link';

export const MkLink = ({
  children,
  className,
  href,
  target,
  enabled,
}: Pick<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  'href' | 'target' | 'children'
> & {
  className?: { link?: string; span?: string; all?: string };
  enabled?: boolean;
}) => {
  return enabled ? (
    <Link
      className={`${className?.all} ${className?.link}`}
      href={href ?? '#'}
      target={target}
    >
      {children}
    </Link>
  ) : (
    <span className={`${className?.all} ${className?.span}`}>{children}</span>
  );
};
