export const PageTitle = ({ title, intro }: { title: string; intro?: string }) => {
  return (
    <div className='pb-6 pt-10'>
      <h1 className='text-[48px] font-bold leading-none tracking-[-0.03em]'>{title}</h1>
      {intro ? <p className='pt-3 text-[19px] italic text-muted'>{intro}</p> : null}
    </div>
  );
};
