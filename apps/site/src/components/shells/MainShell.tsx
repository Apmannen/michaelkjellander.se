import 'server-only';

export const MainShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className='min-h-full flex'>
      <section className='w-[400px] border-r-black'>Meny</section>
      <main className='bg-gray-400'>{children}</main>
    </div>
  );
};
