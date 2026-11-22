import { urlUtils } from '@/lib/urlUtils';
import Link from 'next/link';

export const MkLink = ({
  children,
  className,
  href,
  enabled = true,
}: Pick<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'children'> & {
  className?: { link?: string; span?: string; all?: string };
  enabled?: boolean;
}) => {
  const finalHref = href ?? '#';
  return enabled ? (
    <Link
      className={`${className?.all ?? ''} ${className?.link ?? ''}`}
      href={finalHref}
      target={urlUtils.isExternalLink(finalHref) ? '_blank' : ''}
    >
      {children}
    </Link>
  ) : (
    <span className={`${className?.all ?? ''} ${className?.span ?? ''}`}>
      {children}
    </span>
  );
};
