import { Droppable } from "@hello-pangea/dnd";
import KanbanTask from "./kanban-task";
import { TaskType } from "@/types/api.type";
import { Badge } from "@/components/ui/badge";

interface KanbanColumnProps {
    id: string;
    title: string;
    tasks: TaskType[];
}

const KanbanColumn = ({ id, title, tasks }: KanbanColumnProps) => {
    return (
        <div className="flex flex-col bg-muted/50 rounded-lg p-4 min-w-[280px] w-full md:w-[350px] max-h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{title}</h3>
                <Badge variant="secondary" className="rounded-full px-2">
                    {tasks.length}
                </Badge>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
                <Droppable droppableId={id}>
                    {(provided) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="flex flex-col gap-2 min-h-[100px]"
                        >
                            {tasks.map((task, index) => (
                                <KanbanTask key={task._id} task={task} index={index} />
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </div>
        </div>
    );
};

export default KanbanColumn;
