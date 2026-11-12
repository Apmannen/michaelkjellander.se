export const Divider = ({
  className,
}: {
  className?: { container?: string; line?: string };
}) => {
  return (
    <div className={className?.container}>
      <div className={`h-[1px] bg-line ${className?.line ?? ''}`}></div>
    </div>
  );
};
