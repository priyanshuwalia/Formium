import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import React from "react";

export type DragHandleProps = {
  listeners: DraggableSyntheticListeners;
  attributes: DraggableAttributes;
};

interface SortableBlockProps {
  id: string;
  children: (handleProps: DragHandleProps) => React.ReactNode;
}

const SortableBlock = ({ id, children }: SortableBlockProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({ listeners, attributes })}
    </div>
  );
};

export default SortableBlock;
