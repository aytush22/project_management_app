import CreateTaskDialog from "@/components/workspace/task/create-task-dialog";
import TaskTable from "@/components/workspace/task/task-table";
import KanbanBoard from "@/components/workspace/kanban/kanban-board";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { List, Kanban } from "lucide-react";

export default function Tasks() {
  return (
    <div className="w-full h-full flex-col space-y-6 pt-3">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">All Tasks</h2>
          <p className="text-muted-foreground">
            Here&apos;s the list of tasks for this workspace!
          </p>
        </div>
        <CreateTaskDialog />
      </div>

      <Tabs defaultValue="table" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="table" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Table
          </TabsTrigger>
          <TabsTrigger value="board" className="flex items-center gap-2">
            <Kanban className="h-4 w-4" />
            Board
          </TabsTrigger>
        </TabsList>
        <TabsContent value="table">
          <TaskTable />
        </TabsContent>
        <TabsContent value="board" className="h-[calc(100vh-250px)]">
          <KanbanBoard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
