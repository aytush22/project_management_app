import { useState, useEffect } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import KanbanColumn from "./kanban-column";
import { TaskStatusEnum, TaskStatusEnumType } from "@/constant";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { editTaskMutationFn, getAllTasksQueryFn } from "@/lib/api";
import { TaskType } from "@/types/api.type";
import { toast } from "@/hooks/use-toast";

const KanbanBoard = () => {
    const workspaceId = useWorkspaceId();
    const queryClient = useQueryClient();

    // Fetch all tasks (assuming pageSize 100 for acceptable board performance)
    // In a real app, you might want to fetch tasks grouped by status or handle pagination differently
    const { data, isLoading } = useQuery({
        queryKey: ["all-tasks", workspaceId, "board"],
        queryFn: () =>
            getAllTasksQueryFn({
                workspaceId,
                pageSize: 100, // Fetch more for board view
            }),
        staleTime: 0,
    });

    const tasks = data?.tasks || [];

    const [columns, setColumns] = useState<Record<TaskStatusEnumType, TaskType[]>>({
        BACKLOG: [],
        TODO: [],
        IN_PROGRESS: [],
        IN_REVIEW: [],
        DONE: [],
    });

    // Organize tasks into columns
    useEffect(() => {
        if (tasks) {
            const newColumns: Record<TaskStatusEnumType, TaskType[]> = {
                BACKLOG: [],
                TODO: [],
                IN_PROGRESS: [],
                IN_REVIEW: [],
                DONE: [],
            };

            tasks.forEach((task) => {
                if (newColumns[task.status]) {
                    newColumns[task.status].push(task);
                }
            });
            setColumns(newColumns);
        }
    }, [tasks]);

    const { mutateAsync: updateTaskStatus } = useMutation({
        mutationFn: editTaskMutationFn,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["all-tasks"] });
            // Also invalidate analytics to update "Productivity" graph
            queryClient.invalidateQueries({ queryKey: ["workspace-analytics"] });
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to update task status",
                variant: "destructive",
            })
        }
    });

    const onDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;

        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) {
            return;
        }

        // Optimistic Update
        const sourceStatus = source.droppableId as TaskStatusEnumType;
        const destStatus = destination.droppableId as TaskStatusEnumType;

        const sourceColumn = [...columns[sourceStatus]];
        const destColumn = sourceStatus === destStatus ? sourceColumn : [...columns[destStatus]];

        const [movedTask] = sourceColumn.splice(source.index, 1);

        // Update local state
        if (sourceStatus === destStatus) {
            sourceColumn.splice(destination.index, 0, movedTask);
            setColumns({
                ...columns,
                [sourceStatus]: sourceColumn
            });
        } else {
            const updatedTask = { ...movedTask, status: destStatus };
            destColumn.splice(destination.index, 0, updatedTask);
            setColumns({
                ...columns,
                [sourceStatus]: sourceColumn,
                [destStatus]: destColumn
            });

            // API Call
            await updateTaskStatus({
                workspaceId,
                projectId: movedTask.project?._id || "", // Assuming project is populated
                taskId: draggableId,
                data: { status: destStatus }
            });
        }
    };

    if (isLoading) return <div>Loading board...</div>;

    return (
        <div className="h-full overflow-x-auto overflow-y-hidden pb-4">
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex gap-6 h-full min-w-max">
                    <KanbanColumn id={TaskStatusEnum.BACKLOG} title="Backlog" tasks={columns.BACKLOG} />
                    <KanbanColumn id={TaskStatusEnum.TODO} title="To Do" tasks={columns.TODO} />
                    <KanbanColumn id={TaskStatusEnum.IN_PROGRESS} title="In Progress" tasks={columns.IN_PROGRESS} />
                    <KanbanColumn id={TaskStatusEnum.IN_REVIEW} title="In Review" tasks={columns.IN_REVIEW} />
                    <KanbanColumn id={TaskStatusEnum.DONE} title="Done" tasks={columns.DONE} />
                </div>
            </DragDropContext>
        </div>
    );
};

export default KanbanBoard;
