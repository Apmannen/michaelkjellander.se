import 'server-only';

export const MainShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className='min-h-dvh flex justify-center bg-[#F1F1F1]'>
      <main className='px-12 py-12 min-h-dvh'>{children}</main>
    </div>
  );
};
