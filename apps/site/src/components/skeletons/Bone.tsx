/** A single pulsing placeholder block. Size it with className (or style). */
export const Bone = ({
  className = '',
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) => {
  return (
    <div
      aria-hidden
      className={`bg-line/60 rounded-md animate-pulse ${className}`}
      style={style}
    />
  );
};
