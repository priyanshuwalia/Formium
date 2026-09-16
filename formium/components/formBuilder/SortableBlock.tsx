"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type FormBlock } from "@/lib/types";
import BlockRenderer from "./BlockRenderer";

interface SortableBlockProps {
  block: FormBlock;
  onChange: (id: string, updated: Partial<FormBlock>) => void;
  onDelete: (id: string) => void;
  onEnter: () => void;
  allBlocks?: FormBlock[];
}

const SortableBlock = ({ block, onChange, onDelete, onEnter, allBlocks }: SortableBlockProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: block.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <BlockRenderer
        block={block}
        onChange={onChange}
        onDelete={onDelete}
        onEnter={onEnter}
        allBlocks={allBlocks}
        dragHandleProps={{ listeners, attributes }}
      />
    </div>
  );
};

export default SortableBlock;
