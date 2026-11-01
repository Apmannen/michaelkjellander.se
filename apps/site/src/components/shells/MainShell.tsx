import 'server-only';

export const MainShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className='min-h-full flex '>
      <section className='w-1/3 max-w-[413px] border-r-black'>Meny</section>
      <main className='bg-[#F1F1F1] flex-1 px-12 py-12'>{children}</main>
    </div>
  );
};
