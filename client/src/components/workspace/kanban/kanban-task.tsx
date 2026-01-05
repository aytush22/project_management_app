import { Draggable } from "@hello-pangea/dnd";
import { format } from "date-fns";
import { MoreHorizontal } from "lucide-react";
import { TaskType } from "@/types/api.type";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";

interface KanbanTaskProps {
    task: TaskType;
    index: number;
}

const KanbanTask = ({ task, index }: KanbanTaskProps) => {
    const priorityColor = {
        LOW: "bg-green-100 text-green-800",
        MEDIUM: "bg-yellow-100 text-yellow-800",
        HIGH: "bg-red-100 text-red-800",
    };

    const assigneeName = task.assignedTo?.name || "Unassigned";
    const initials = getAvatarFallbackText(assigneeName);
    const avatarColor = getAvatarColor(assigneeName);

    return (
        <Draggable draggableId={task._id} index={index}>
            {(provided) => (
                <Card
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="mb-4 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
                >
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                        <Badge
                            variant="outline"
                            className={`${priorityColor[task.priority as keyof typeof priorityColor]
                                } border-none font-medium capitalize`}
                        >
                            {task.priority.toLowerCase()}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <h4 className="font-semibold text-sm mb-2 line-clamp-2">
                            {task.title}
                        </h4>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={task.assignedTo?.profilePicture || ""} alt={assigneeName} />
                                    <AvatarFallback className={`text-[10px] ${avatarColor}`}>{initials}</AvatarFallback>
                                </Avatar>
                                <span className="truncate max-w-[80px]">{assigneeName}</span>
                            </div>
                            {task.dueDate && (
                                <span>{format(new Date(task.dueDate), "MMM d")}</span>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </Draggable>
    );
};

export default KanbanTask;
