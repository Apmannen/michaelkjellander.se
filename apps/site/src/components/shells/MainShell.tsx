import 'server-only';

export const MainShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className='min-h-dvh flex justify-center bg-default-main'>
      <main className='sm:py-12 min-h-dvh'>{children}</main>
    </div>
  );
};
