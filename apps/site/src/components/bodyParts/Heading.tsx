import { ArticleBodyPartPayload } from "@/lib/db/payload.types";

export const Heading = ({
  part,
}: {
  part: Pick<ArticleBodyPartPayload, 'text'>;
}) => {
  

  return (
    <h4 className='text-[28px] font-bold tracking-tight'>
      {part.text}
    </h4>
  );
};
