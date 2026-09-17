import { useEffect, useRef, useState } from "react";
import SlashCommand from "../components/formBuilder/SlashCommand";
import { type BlockType, type FormBlock } from "../types/form";
import { v4 as uuid } from "uuid";
import { Plus, File, Palette, ArrowRight, Trash, GripVertical } from "lucide-react";
import BlockRenderer from "../components/formBuilder/BlockRenderer";
import SortableBlock from "../components/formBuilder/SortableBlock";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import API from "../api/axios";
import { getErrorMessage } from "../utils/apiError";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";


const blockOptions: { label: string; type: BlockType }[] = [
  { label: "Short Answer", type: "SHORT_ANS" },
  { label: "Long Answer", type: "LONG_ANS" },
  { label: "Email", type: "EMAIL" },
  { label: "Number", type: "NUM" },
  { label: "Checkboxes", type: "CHECKBOXES" },
  { label: "Multiple Choice", type: "MULT_CHOICE" },
  { label: "Dropdown", type: "DROPDOWN" },
  { label: "Phone Number", type: "PHONE_NUM" },
  { label: "Link", type: "LINK" },
  { label: "File Upload", type: "FILE_UPLOAD" },
  { label: "Date", type: "DATE" },
  { label: "Rating", type: "RATING" },
];

const presetColors: string[] = [
  "#6E829B", "#FF6B6B", "#6BCB77", "#4D96FF", "#FFD93D", "#D27C2C", "#845EC2", "#2C3E50"
];

const CreateForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: User } = useAuth();
  const [formTitle, setFormTitle] = useState<string>("");
  const [inputBlocks, setInputBlocks] = useState<FormBlock[]>([]);
  const [showSlashCommand, setShowSlashCommand] = useState<boolean>(false);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [activeQuery, setActiveQuery] = useState<string>("");
  const [coverColor, setCoverColor] = useState<string>("#6E829B");
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [activeWorkspace, setActiveWorkspace] = useState<string>("My Workspace");

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setInputBlocks((prev) => {
      const oldIndex = prev.findIndex((block) => block.id === active.id);
      const newIndex = prev.findIndex((block) => block.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex).map((block, index) => ({
        ...block,
        order: index,
      }));
    });
  };


  useEffect(() => {
    if (location.state && location.state.blocks) {

      setInputBlocks(location.state.blocks);
    }
  }, [location.state]);

  useEffect(() => {
    const readWorkspace = () => {
      const stored = localStorage.getItem("activeWorkspaceName");
      if (stored) setActiveWorkspace(stored);
    };
    readWorkspace();
    window.addEventListener("workspace-change", readWorkspace);
    return () => window.removeEventListener("workspace-change", readWorkspace);
  }, []);

  const filteredOptions = blockOptions.filter((option) =>
    option.label.toLowerCase().includes(activeQuery.toLowerCase())
  );

  const activeBlock = inputBlocks.find(
    (block) => block.value?.startsWith("/") && showSlashCommand
  );

  const [publishing, setPublishing] = useState(false);


  const publishForm = async () => {
    if (!User) {
      alert("You must be logged in to publish a form.");
      return;
    }

    let finalTitle: string;
    if (formTitle.trim() === "") {
      const title = prompt("Please enter a title for your form:", "Untitled Form");
      if (!title || title.trim() === "") return;
      setFormTitle(title);
      // Continue with the newly set title (using local variable for immediate use)
      finalTitle = title;
    } else {
      finalTitle = formTitle;
    }

    setPublishing(true);
    console.log('Publish was clicked');

    const payload = {
      title: finalTitle,
      description: "",

      userId: User?.id,
    };

    try {
      console.log("Sending form creation payload:", payload);
      const formRes = await API.post("/forms", payload);
      const form = formRes.data;
      console.log("Form created:", form);
      const cleanedBlocks = inputBlocks.map((block) => ({

        type: block.type,
        label: block.label,
        required: block.required,
        placeholder: block.placeholder,
        options: block.options,
        logic: block.logic || null,
        order: block.order,
        formId: form.id,
      }));

      if (cleanedBlocks.length > 0) {
        console.log("Sending form blocks:", cleanedBlocks);
        await Promise.all(
          cleanedBlocks.map((block) => API.post("/form-blocks", block))
        );
      }

      if (form.slug) {
        navigate(`/forms/${form.slug}/published`);
      } else {
        console.log("No slug found");
        alert("Form created, but could not get the shareable link.");
      }
    } catch (error) {
      console.log("Error publishing form:", error);
      alert(getErrorMessage(error, "Failed to publish form. Please try again."));
    } finally {
      setPublishing(false);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      e.preventDefault();
      const newBlock: FormBlock = {
        id: uuid(),
        label: "",
        value: "",
        required: false,
        order: inputBlocks.length,
      };
      setInputBlocks((prev) => [...prev, newBlock]);
      setTimeout(() => {
        inputRefs.current[newBlock.id]?.focus();
      }, 0);
    }
  };

  const handleBlockKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number): void => {
    const block = inputBlocks[index];
    const isSlashActive = block.value?.startsWith("/") && showSlashCommand;

    if (isSlashActive) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((prev) => (prev + 1) % filteredOptions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const selected = filteredOptions[selectedIdx];
        if (selected) {
          handleSelectBlock(block.id, selected.type);
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowSlashCommand(false);
        return;
      }
    }

    const isDivider = block.value.trim() === "---";
    if ((e.key === "Enter" || e.key === " ") && isDivider) {
      e.preventDefault();
      const updated = [...inputBlocks];
      updated[index] = {
        id: block.id, type: "DIVIDER", label: "", value: "", required: false, order: inputBlocks.length,
      };
      const newBlock: FormBlock = {
        id: uuid(), label: "", value: "", required: false, order: inputBlocks.length,
      };
      updated.splice(index + 1, 0, newBlock);
      setInputBlocks(updated);
      setTimeout(() => {
        inputRefs.current[newBlock.id]?.focus();
      }, 0);
      return;
    }

    const isH3 = block.value.trim() === "###";
    if ((e.key === "Enter" || e.key === " ") && isH3) {
      e.preventDefault();
      const updated = [...inputBlocks];
      updated[index] = {
        id: block.id, type: "H3", label: "", value: "", required: false, order: inputBlocks.length,
      };
      const newBlock: FormBlock = {
        id: uuid(), label: "", value: "", required: false, order: inputBlocks.length,
      };
      updated.splice(index + 1, 0, newBlock);
      setInputBlocks(updated);
      setTimeout(() => {
        inputRefs.current[newBlock.id]?.focus();
      }, 0);
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const newBlock: FormBlock = {
        id: uuid(), label: "", value: "", required: false, order: inputBlocks.length,
      };
      const updated = [...inputBlocks];
      updated.splice(index + 1, 0, newBlock);
      setInputBlocks(updated);
      setTimeout(() => {
        inputRefs.current[newBlock.id]?.focus();
      }, 0);
      return;
    }

    if (e.key === "Backspace" && block.value === "") {
      e.preventDefault();
      const updated = [...inputBlocks];
      updated.splice(index, 1);
      setInputBlocks(updated);
      setTimeout(() => {
        if (updated.length === 0) {
          titleInputRef.current?.focus();
        } else {
          const prevBlock = updated[index - 1];
          if (prevBlock) inputRefs.current[prevBlock.id]?.focus();
        }
      }, 0);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, index: number): void => {
    const value = e.target.value;
    const updated = [...inputBlocks];
    updated[index].value = value;
    setInputBlocks(updated);

    if (value.startsWith("/")) {
      setShowSlashCommand(true);
      setActiveQuery(value.slice(1));
    } else {
      setShowSlashCommand(false);
    }
  };

  const handleCreateBlock = (index: number): void => {
    const newBlock: FormBlock = {
      id: uuid(), label: "", value: "", required: false, order: inputBlocks.length,
    };
    const updated = [...inputBlocks];
    updated.splice(index + 1, 0, newBlock);
    setInputBlocks(updated);
    setTimeout(() => {
      inputRefs.current[newBlock.id]?.focus();
    }, 0);
  };

  const handleSelectBlock = (blockId: string, type: BlockType): void => {
    const updated = [...inputBlocks];
    const blockIndex = updated.findIndex((block) => block.id === blockId);
    if (blockIndex !== -1) {
      updated[blockIndex] = {
        ...updated[blockIndex], type, label: "", value: "", required: false, order: inputBlocks.length,
      };
      setInputBlocks(updated);
      setShowSlashCommand(false);
    }
  };

  const handleBlockUpdate = (id: string, updatedData: Partial<FormBlock>): void => {
    setInputBlocks((prev) =>
      prev.map((block) => (block.id === id ? { ...block, ...updatedData } : block))
    );
  };

  const handleBlockDelete = (id: string): void => {
    setInputBlocks((prev) => prev.filter((block) => block.id !== id));
  };

  return (

    <div className="flex-1 overflow-y-auto bg-gray-50/50">
      {/* Cover Image Area */}
      <div
        className="relative h-64 transition-all duration-500 ease-in-out group"
        style={{ backgroundColor: coverColor }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-transparent"></div>

        {/* Hover/Focus Actions for Cover */}
        <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700 hover:bg-white shadow-sm transition-all"
          >
            <Palette size={14} />
            Change Cover
          </button>
        </div>

        {showColorPicker && (
          <div className="absolute bottom-14 right-4 p-3 bg-white rounded-2xl shadow-xl border border-gray-100 grid grid-cols-4 gap-2 z-30 animate-in fade-in zoom-in-95 duration-200">
            {presetColors.map((color) => (
              <button
                key={color}
                onClick={() => setCoverColor(color)}
                className="w-8 h-8 rounded-full border-2 border-transparent hover:border-gray-300 hover:scale-110 transition-all shadow-sm"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Main Content Card */}
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 pb-20">
        <div className="bg-white rounded-[2.25rem] shadow-2xl shadow-indigo-500/10 border border-gray-100 min-h-[60vh] relative overflow-visible">

          {/* Form Icon / Badge */}
          <div className="absolute -top-12 left-10 sm:left-14">
            <div className="bg-white p-2 rounded-[2rem] shadow-lg border border-gray-100">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-2xl">
                <File size={40} className="text-indigo-600" />
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="pt-20 px-8 sm:px-12 pb-12">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-500">
              Workspace
              <span className="text-gray-900">{activeWorkspace}</span>
            </div>

            {/* Title Input */}
            <div className="group mb-8">
              <input
                type="text"
                placeholder="Untitled Form"
                value={formTitle}
                ref={titleInputRef}
                onChange={(e) => setFormTitle(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                className="text-4xl sm:text-5xl font-extrabold w-full bg-transparent border-none focus:ring-0 focus:outline-none text-gray-900 placeholder-gray-300 leading-tight tracking-tight transition-colors"
              />
              <div className="h-1 w-20 bg-gray-100 mt-4 rounded-full group-hover:w-full group-hover:bg-indigo-500/20 transition-all duration-500"></div>
            </div>

            {/* Blocks */}
            <div className="space-y-2">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={inputBlocks.map((block) => block.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {inputBlocks.map((block, idx) => (
                    <SortableBlock key={block.id} id={block.id}>
                      {({ listeners, attributes }) => (
                        <div className="relative group/wrapper">
                          {block.type ? (
                            <BlockRenderer
                              block={block}
                              onEnter={() => handleCreateBlock(idx)}
                              onChange={handleBlockUpdate}
                              onDelete={handleBlockDelete}
                              dragHandleProps={{ listeners, attributes }}
                              allBlocks={inputBlocks}
                            />
                          ) : (
                            <div className="relative my-2 group">
                              <div
                                {...attributes}
                                {...listeners}
                                className="absolute left-0 top-1/2 -translate-y-1/2 -ml-8 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing transition-colors touch-none"
                              >
                                <GripVertical size={18} />
                              </div>
                              <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 cursor-pointer transition-colors" onClick={() => handleBlockDelete(block.id)}>
                                <Trash size={18} />
                              </div>
                              <input
                                ref={(el) => { inputRefs.current[block.id] = el }}
                                value={block.value}
                                onChange={(e) => handleInputChange(e, idx)}
                                onKeyDown={(e) => handleBlockKeyDown(e, idx)}
                                placeholder="Type '/' for commands"
                                className="w-full text-lg py-2 bg-transparent border-none focus:ring-0 focus:outline-none text-gray-700 placeholder-gray-300"
                              />
                            </div>
                          )}

                          {/* Slash Command Menu */}
                          {showSlashCommand &&
                            block.value?.startsWith("/") &&
                            activeBlock?.id === block.id && (
                              <div className="absolute top-full left-0 z-50 mt-2 w-72 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <SlashCommand
                                  blockId={block.id}
                                  query={activeQuery}
                                  onSelect={handleSelectBlock}
                                  onClose={() => setShowSlashCommand(false)}
                                  selectedIdx={selectedIdx}
                                  setSelectedIdx={setSelectedIdx}
                                  filteredOptions={filteredOptions}
                                />
                              </div>
                            )}
                        </div>
                      )}
                    </SortableBlock>
                  ))}
                </SortableContext>
              </DndContext>

              {/* Add New / Empty State */}
              <div
                onClick={() => {
                  const newBlock: FormBlock = { id: uuid(), label: "", value: "", required: false, order: 0 };
                  setInputBlocks([...inputBlocks, newBlock]);
                  setTimeout(() => inputRefs.current[newBlock.id]?.focus(), 0);
                }}
                className="group flex items-center gap-3 text-gray-400 hover:text-indigo-600 mt-6 py-3 cursor-pointer transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center bg-white group-hover:border-indigo-500/50 group-hover:shadow-md transition-all">
                  <Plus size={16} />
                </div>
                <span className="text-sm font-medium">Click to add a new question</span>
              </div>
            </div>

            {/* Footer Actions (Publish) */}
            <div className="mt-16 pt-8 border-t border-gray-100 flex justify-end">
              <button
                onClick={publishForm}
                disabled={publishing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-bold text-lg shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5 transition-all duration-300 active:scale-95 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {publishing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Publishing...
                  </>
                ) : (
                  <>
                    Publish Form
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateForm;
